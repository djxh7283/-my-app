import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// 用 Node 24 内置的 node:sqlite，无需额外依赖。
// DB_PATH=:memory: 可以跑纯内存模式（重启即清空，适合测试）。
const dbPath =
  process.env.DB_PATH ?? join(import.meta.dirname, '..', 'data', 'todos.db')

if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true })
}

export const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )
`)

console.log(`[backend] SQLite: ${dbPath}`)
