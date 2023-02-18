import sqlite from 'better-sqlite3'

const db = sqlite('./data/db.sqlite')
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  ) STRICT;
`)

const getUserStmt = db.prepare('SELECT * FROM users WHERE email = ?')
export const getUser = (email) => getUserStmt.get(email)

const createUserStmt = db.prepare(
    'INSERT INTO users (email, password) VALUES (?, ?) RETURNING id'
)
export const createUser = (email, password) => {
    try {
        return createUserStmt.get(email, password).id
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
