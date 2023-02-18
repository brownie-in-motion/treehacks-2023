import sqlite from 'better-sqlite3'

const db = sqlite('./data/db.sqlite')
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS share_groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    spend_limit INTEGER NOT NULL,
    spend_limit_duration TEXT NOT NULL,
    card_token TEXT NOT NULL
  ) STRICT;
  CREATE INDEX IF NOT EXISTS share_groups_card_token ON share_groups (card_token);

  CREATE TABLE IF NOT EXISTS share_group_members (
    share_group_id INTEGER NOT NULL REFERENCES share_groups ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users,
    is_owner INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    PRIMARY KEY (user_id, share_group_id)
  ) STRICT, WITHOUT ROWID;

  CREATE TABLE IF NOT EXISTS share_group_events (
    id INTEGER PRIMARY KEY,
    share_group_id INTEGER NOT NULL REFERENCES share_groups ON DELETE CASCADE,
    user_id INTEGER REFERENCES users,
    type TEXT NOT NULL,
    data TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS share_group_invites (
    code TEXT PRIMARY KEY,
    share_group_id INTEGER NOT NULL REFERENCES share_groups ON DELETE CASCADE
  ) STRICT, WITHOUT ROWID;
`)

const shareGroupEventTypes = {
    spend: 'spend',
}

const getUserByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?')
export const getUserByEmail = (email) => getUserByEmailStmt.get(email)

const getUserStmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?')
export const getUser = (id) => getUserStmt.get(id)

const createUserStmt = db.prepare(
    'INSERT INTO users (email, name, password) VALUES (?, ?, ?) RETURNING id'
)
export const createUser = (email, name, password) => {
    try {
        return createUserStmt.get(email, name, password).id
    } catch (err) {
        if (
            err instanceof sqlite.SqliteError &&
            err.code === 'SQLITE_CONSTRAINT_UNIQUE'
        ) {
            return
        }
        throw err
    }
}

const getShareGroupsForUserStmt = db.prepare(`
    WITH groups AS (
        SELECT share_groups.*
        FROM share_groups, share_group_members
        WHERE share_group_members.user_id = ?
            AND share_group_members.share_group_id = share_groups.id
    )
    SELECT groups.*, COUNT(share_group_members.user_id) AS member_count
    FROM groups, share_group_members
    WHERE groups.id = share_group_members.share_group_id
    GROUP BY groups.id
`)
export const getShareGroupsForUser = (userId) =>
    getShareGroupsForUserStmt.all(userId).map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.member_count,
    }))

const getShareGroupStmt = db.prepare('SELECT * FROM share_groups WHERE id = ?')
const getShareGroupMembersStmt = db.prepare(
    'SELECT share_group_members.*, users.name, users.email FROM share_group_members, users WHERE share_group_id = ? AND user_id = users.id'
)
const getShareGroupEventsStmt = db.prepare(
    'SELECT share_group_events.*, users.name, users.email FROM share_group_events, users WHERE share_group_id = ? AND user_id = users.id'
)
const getShareGroupInvitesStmt = db.prepare(
    'SELECT code FROM share_group_invites WHERE share_group_id = ?'
)
export const getShareGroup = (id) => {
    const sg = getShareGroupStmt.get(id)
    if (!sg) {
        return
    }
    const shareGroup = {
        id: sg.id,
        name: sg.name,
        cardToken: sg.card_token,
        spendLimit: sg.spend_limit,
        spendLimitDuration: sg.spend_limit_duration,
    }
    shareGroup.members = getShareGroupMembersStmt.all(id).map((m) => ({
        isOwner: !!m.is_owner,
        weight: m.weight,
        user: {
            id: m.user_id,
            name: m.name,
            email: m.email,
        },
    }))
    shareGroup.events = getShareGroupEventsStmt.all(id).map((e) => ({
        id: e.id,
        type: e.type,
        data: JSON.parse(e.data),
        user: {
            id: e.user_id,
            name: e.name,
            email: e.email,
        },
    }))
    shareGroup.spent = shareGroup.events
        .filter((l) => l.type === shareGroupEventTypes.spend)
        .reduce((acc, l) => acc + l.action.amount, 0)
    shareGroup.invites = getShareGroupInvitesStmt.all(id)
    return shareGroup
}

export const isOwner = (group, user) => {
    return group.members.some((m) => m.user.id === user.id && m.isOwner)
}

export const isMember = (group, user) => {
    return group.members.some((m) => m.user.id === user.id)
}

const createShareGroupStmt = db.prepare(
    'INSERT INTO share_groups (name, card_token, spend_limit, spend_limit_duration) VALUES (?, ?, ?, ?) RETURNING id'
)
const createShareGroupMemberStmt = db.prepare(
    'INSERT INTO share_group_members (user_id, share_group_id, is_owner, weight) VALUES (?, ?, ?, 1)'
)
export const createShareGroup = db.transaction(
    (userId, name, cardToken, spendLimit, spendLimitDuration) => {
        const { id } = createShareGroupStmt.get(
            name,
            cardToken,
            spendLimit,
            spendLimitDuration
        )
        createShareGroupMemberStmt.run(userId, id, 1)
        return id
    }
)

const getShareGroupByInviteCodeStmt = db.prepare(
    'SELECT share_groups.* FROM share_groups, share_group_invites WHERE code = ? AND share_group_id = share_groups.id'
)
export const joinShareGroup = db.transaction((userId, code) => {
    const group = getShareGroupByInviteCodeStmt.get(code)
    if (!group) {
        return
    }
    try {
        createShareGroupMemberStmt.run(userId, group.id, 0)
    } catch (err) {
        if (
            err instanceof sqlite.SqliteError &&
            err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
        ) {
            return
        }
        throw err
    }
    return group.id
})

export const getShareGroupByInvite = (code) => {
    const group = getShareGroupByInviteCodeStmt.get(code)
    if (!group) {
        return
    }
    return {
        id: group.id,
        name: group.name,
        spendLimit: group.spend_limit,
        spendLimitDuration: group.spend_limit_duration,
    }
}

const deleteShareGroupMemberStmt = db.prepare(
    'DELETE FROM share_group_members WHERE user_id = ? AND share_group_id = ? AND is_owner = FALSE'
)
export const deleteShareGroupMember = (userId, shareGroupId) =>
    deleteShareGroupMemberStmt.run(userId, shareGroupId).changes > 0

const updateShareGroupMemberWeightStmt = db.prepare(
    'UPDATE share_group_members SET weight = ? WHERE user_id = ? AND share_group_id = ?'
)
export const updateShareGroupMemberWeight = (userId, shareGroupId, weight) =>
    updateShareGroupMemberWeightStmt.run(weight, userId, shareGroupId)

const createShareGroupEventStmt = db.prepare(
    'INSERT INTO share_group_events (user_id, share_group_id, type, data) VALUES (?, ?, ?, ?)'
)
const makeCreateShareGroupEvent = (type) => (userId, shareGroupId, data) =>
    createShareGroupEventStmt.run(
        userId,
        shareGroupId,
        type,
        JSON.stringify(data)
    )

const getShareGroupByCardTokenStmt = db.prepare(
    'SELECT id FROM share_groups WHERE card_token = ?'
)
export const createShareGroupSpendEvent = db.transaction((cardToken, data) => {
    const group = getShareGroupByCardTokenStmt.get(cardToken)
    if (!group) {
        return
    }
    createShareGroupEventStmt.run(
        null,
        group.id,
        shareGroupEventTypes.spend,
        JSON.stringify(data)
    )
})

const createShareGroupInviteStmt = db.prepare(
    'INSERT INTO share_group_invites (code, share_group_id) VALUES (?, ?)'
)
export const createShareGroupInvite = (code, shareGroupId) =>
    createShareGroupInviteStmt.run(code, shareGroupId)

const deleteShareGroupInviteStmt = db.prepare(
    'DELETE FROM share_group_invites WHERE code = ? AND share_group_id = ?'
)
export const deleteShareGroupInvite = (code, shareGroupId) =>
    deleteShareGroupInviteStmt.run(code, shareGroupId).changes > 0
