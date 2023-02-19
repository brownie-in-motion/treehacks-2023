import sqlite from 'better-sqlite3'

const db = sqlite('./data/db.sqlite')
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        stripe_customer_id TEXT UNIQUE,
        stripe_payment_method_id TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS share_groups (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        spend_limit INTEGER NOT NULL,
        spend_limit_duration TEXT NOT NULL,
        card_token TEXT NOT NULL UNIQUE
    ) STRICT;

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

    CREATE TABLE IF NOT EXISTS lithic_transactions (
        id TEXT PRIMARY KEY,
        paid_share_balance INTEGER NOT NULL
    ) STRICT, WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS repay_groups (
        id INTEGER PRIMARY KEY,
        invite_code TEXT,
        owner_id INTEGER NOT NULL REFERENCES users,
        total INTEGER NOT NULL,
        date TEXT,
        name TEXT,
        paid INTEGER NOT NULL DEFAULT FALSE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS repay_group_items (
        id INTEGER PRIMARY KEY,
        repay_group_id INTEGER NOT NULL REFERENCES repay_groups ON DELETE CASCADE,
        claimant_id INTEGER REFERENCES users,
        description TEXT,
        price INTEGER NOT NULL,
        paid INTEGER NOT NULL DEFAULT FALSE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS repay_group_members (
        repay_group_id INTEGER NOT NULL REFERENCES repay_groups ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users,
        PRIMARY KEY (user_id, repay_group_id)
    ) STRICT, WITHOUT ROWID;
`)

const shareGroupEventTypes = {
    spend: 'spend',
    pay: 'pay',
    payError: 'payError',
}

const getUserByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?')
export const getUserByEmail = (email) => getUserByEmailStmt.get(email)

const getUserByStripeCustomerIdStmt = db.prepare(
    'SELECT * FROM users WHERE stripe_customer_id = ?'
)
export const getUserByStripeCustomerId = (stripeCustomerId) =>
    getUserByStripeCustomerIdStmt.get(stripeCustomerId)

const getUserStmt = db.prepare('SELECT * FROM users WHERE id = ?')
export const getUser = (id) => {
    const u = getUserStmt.get(id)
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        stripePaymentMethodId: u.stripe_payment_method_id,
        stripeCustomerId: u.stripe_customer_id,
    }
}

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

const updateUserStripeCustomerIdStmt = db.prepare(
    'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
)
export const updateUserStripeCustomerId = (userId, stripeCustomerId) =>
    updateUserStripeCustomerIdStmt.run(stripeCustomerId, userId).changes > 0

const updateUserStripePaymentMethodIdStmt = db.prepare(
    'UPDATE users SET stripe_payment_method_id = ? WHERE id = ?'
)
export const updateUserStripePaymentMethodId = (id, stripePaymentMethodId) =>
    updateUserStripePaymentMethodIdStmt.run(stripePaymentMethodId, id).changes >
    0

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

const getShareGroupPayabilityForUserStmt = db.prepare(`
    WITH groups AS (
        SELECT share_groups.*
            FROM share_groups, share_group_members
            WHERE share_group_members.user_id = ?
                AND share_group_members.share_group_id = share_groups.id
    )
    SELECT groups.*, COUNT(users.id) = 0 AS is_payable
        FROM groups, share_group_members, users
        WHERE groups.id = share_group_members.share_group_id
            AND share_group_members.user_id = users.id
            AND users.stripe_payment_method_id IS NULL
        GROUP BY groups.id
`)
export const getShareGroupPayabilityForUser = (userId) =>
    getShareGroupPayabilityForUserStmt.all(userId)

const getShareGroupStmt = db.prepare('SELECT * FROM share_groups WHERE id = ?')
const getShareGroupMembersStmt = db.prepare(`
    SELECT share_group_members.*, users.name, users.email
        FROM share_group_members, users WHERE share_group_id = ? AND user_id = users.id
`)
const getShareGroupEventsStmt = db.prepare(`
    WITH events AS (
        SELECT share_group_events.*, users.name, users.email
            FROM share_group_events, users
            WHERE share_group_id = ? AND user_id = users.id
        UNION SELECT *, NULL, NULL
            FROM share_group_events
            WHERE share_group_id = ? AND user_id IS NULL
    ) SELECT * FROM events ORDER BY id DESC
`)
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
        description: sg.description,
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
    shareGroup.events = getShareGroupEventsStmt.all(id, id).map((e) => ({
        id: e.id,
        type: e.type,
        data: JSON.parse(e.data),
        user: e.user_id
            ? {
                  id: e.user_id,
                  name: e.name,
                  email: e.email,
              }
            : null,
    }))
    shareGroup.spent = shareGroup.events
        .filter((l) => l.type === shareGroupEventTypes.spend)
        .reduce((acc, l) => acc + l.data.amount, 0)
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
    'INSERT INTO share_groups (name, description, card_token, spend_limit, spend_limit_duration) VALUES (?, ?, ?, ?, ?) RETURNING id'
)
const createShareGroupMemberStmt = db.prepare(
    'INSERT INTO share_group_members (user_id, share_group_id, is_owner, weight) VALUES (?, ?, ?, 1)'
)
export const createShareGroup = db.transaction(
    (userId, name, description, cardToken, spendLimit, spendLimitDuration) => {
        const { id } = createShareGroupStmt.get(
            name,
            description,
            cardToken,
            spendLimit,
            spendLimitDuration
        )
        createShareGroupMemberStmt.run(userId, id, 1)
        return id
    }
)

const deleteShareGroupStmt = db.prepare('DELETE FROM share_groups WHERE id = ?')
export const deleteShareGroup = (id) => deleteShareGroupStmt.run(id).changes > 0

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
export const createShareGroupPayEvent = makeCreateShareGroupEvent(
    shareGroupEventTypes.pay
)
export const createShareGroupPayErrorEvent = makeCreateShareGroupEvent(
    shareGroupEventTypes.payError
)
export const createShareGroupSpendEvent = makeCreateShareGroupEvent(
    shareGroupEventTypes.spend
)

const getShareGroupByCardTokenStmt = db.prepare(
    'SELECT id FROM share_groups WHERE card_token = ?'
)
export const getShareGroupByCardToken = (cardToken) =>
    getShareGroupByCardTokenStmt.get(cardToken)

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

const upsertLithicTransactionStmt = db.prepare(`
    INSERT INTO lithic_transactions (id, paid_share_balance)
    VALUES (?, ?)
    ON CONFLICT (id) DO UPDATE
        SET paid_share_balance = excluded.paid_share_balance
`)
const getLithicTransactionStmt = db.prepare(
    'SELECT * FROM lithic_transactions WHERE id = ?'
)
export const upsertLithicTransaction = db.transaction(
    (id, paidShareBalance) => {
        const transaction = getLithicTransactionStmt.get(id)
        upsertLithicTransactionStmt.run(id, paidShareBalance)
        return paidShareBalance - (transaction?.paid_share_balance ?? 0)
    }
)

const createRepayGroupStmt = db.prepare(
    'INSERT INTO repay_groups (invite_code, owner_id, total, name, date) VALUES (?, ?, ?, ?, ?) RETURNING id'
)
const createRepayGroupMemberStmt = db.prepare(
    'INSERT INTO repay_group_members (repay_group_id, user_id) VALUES (?, ?)'
)
const createRepayGroupItemStmt = db.prepare(
    'INSERT INTO repay_group_items (repay_group_id, description, price) VALUES (?, ?, ?)'
)
export const createRepayGroup = db.transaction(
    (ownerId, inviteCode, total, name, date, items) => {
        const { id } = createRepayGroupStmt.get(
            inviteCode,
            ownerId,
            total,
            name,
            date
        )
        createRepayGroupMemberStmt.run(id, ownerId)
        for (const item of items) {
            createRepayGroupItemStmt.run(id, item.description, item.price)
        }
        return id
    }
)

const getRepayGroupStmt = db.prepare('SELECT * FROM repay_groups WHERE id = ?')
const getRepayGroupItemsStmt = db.prepare(`
    WITH items AS (
        SELECT repay_group_items.*, users.name, users.email
            FROM repay_group_items, users
            WHERE repay_group_id = ? AND claimant_id = users.id
        UNION SELECT *, NULL, NULL
            FROM repay_group_items
            WHERE repay_group_id = ? AND claimant_id IS NULL
    ) SELECT * FROM items ORDER BY id DESC
`)
const getRepayGroupMembersStmt = db.prepare(
    'SELECT repay_group_members.*, users.name, users.email FROM repay_group_members, users WHERE repay_group_id = ? AND user_id = users.id'
)
export const getRepayGroup = (id) => {
    const g = getRepayGroupStmt.get(id)
    if (!g) {
        return
    }
    const owner = getUserStmt.get(g.owner_id)
    const group = {
        id: g.id,
        inviteCode: g.invite_code,
        paid: !!g.paid,
        total: g.total,
        date: g.date,
        name: g.name,
        owner: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
        },
    }
    const items = getRepayGroupItemsStmt.all(id, id)
    const subtotal = items.reduce((acc, it) => acc + it.price, 0)
    const surcharge = group.total / subtotal
    group.items = items.map((it) => ({
        id: it.id,
        description: it.description,
        price: it.price,
        paid: !!it.paid,
        owed: Math.ceil(it.price * surcharge),
        claimant: it.claimant_id
            ? {
                  id: it.claimant_id,
                  name: it.name,
                  email: it.email,
              }
            : null,
    }))
    group.members = getRepayGroupMembersStmt.all(id).map((m) => ({
        id: m.user_id,
        name: m.name,
        email: m.email,
    }))
    return group
}

export const isRepayMember = (repayGroup, user) =>
    repayGroup.members.some((m) => m.id === user.id)

export const isRepayOwner = (repayGroup, user) =>
    repayGroup.owner.id === user.id

const getRepayGroupByInviteCodeStmt = db.prepare(
    'SELECT id FROM repay_groups WHERE invite_code = ?'
)
export const joinRepayGroup = db.transaction((userId, code) => {
    const group = getRepayGroupByInviteCodeStmt.get(code)
    if (!group) {
        return
    }
    try {
        createRepayGroupMemberStmt.run(group.id, userId)
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

const getRepaysForUserStmt = db.prepare(`
    SELECT repay_groups.*, users.name AS user_name, users.email AS user_email
        FROM repay_groups, repay_group_members, users
        WHERE repay_group_members.user_id = ?
            AND repay_group_members.repay_group_id = repay_groups.id
            AND repay_groups.owner_id = users.id
        ORDER BY id DESC
`)
export const getRepayGroupsForUser = (userId) =>
    getRepaysForUserStmt.all(userId).map((r) => ({
        name: r.name,
        date: r.date,
        id: r.id,
        paid: !!r.paid,
        owner: {
            id: r.owner_id,
            name: r.user_name,
            email: r.user_email,
        },
    }))

const claimRepayGroupItemStmt = db.prepare(
    'UPDATE repay_group_items SET claimant_id = ?, paid = TRUE WHERE id = ?'
)
export const claimRepayGroupItem = (itemId, userId) =>
    claimRepayGroupItemStmt.run(userId, itemId)

const payRepayGroupStmt = db.prepare(
    'UPDATE repay_groups SET paid = TRUE WHERE id = ? AND paid = FALSE'
)
export const payRepayGroup = (groupId) => payRepayGroupStmt.run(groupId).changes > 0
