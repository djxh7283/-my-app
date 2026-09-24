import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { db } from './db.js'

export type Todo = {
  id: string
  title: string
  done: boolean
  createdAt: string
}

// 数据库里的行：SQLite 没有布尔类型，用 0/1 存
type TodoRow = {
  id: string
  title: string
  done: number
  created_at: string
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    done: row.done === 1,
    createdAt: row.created_at,
  }
}

// 预编译语句，进程启动时准备一次
const selectAll = db.prepare('SELECT * FROM todos ORDER BY created_at')
const selectOne = db.prepare('SELECT * FROM todos WHERE id = ?')
const insert = db.prepare(
  'INSERT INTO todos (id, title, done, created_at) VALUES (?, ?, 0, ?)',
)
const updateTitle = db.prepare('UPDATE todos SET title = ? WHERE id = ?')
const updateDone = db.prepare('UPDATE todos SET done = ? WHERE id = ?')
const remove = db.prepare('DELETE FROM todos WHERE id = ?')

export const todosRouter = Router()

// 列出全部
todosRouter.get('/', (_req, res) => {
  const rows = selectAll.all() as unknown as TodoRow[]
  res.json(rows.map(toTodo))
})

// 新建
todosRouter.post('/', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'title 不能为空' })
    return
  }

  const todo: Todo = {
    id: randomUUID(),
    title,
    done: false,
    createdAt: new Date().toISOString(),
  }
  insert.run(todo.id, todo.title, todo.createdAt)
  res.status(201).json(todo)
})

// 改标题 / 改完成状态
todosRouter.patch('/:id', (req, res) => {
  const found = selectOne.get(req.params.id) as unknown as TodoRow | undefined
  if (!found) {
    res.status(404).json({ error: 'todo 不存在' })
    return
  }

  const { title, done } = req.body ?? {}

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'title 不能为空' })
      return
    }
    updateTitle.run(title.trim(), req.params.id)
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      res.status(400).json({ error: 'done 必须是布尔值' })
      return
    }
    updateDone.run(done ? 1 : 0, req.params.id)
  }

  const updated = selectOne.get(req.params.id) as unknown as TodoRow
  res.json(toTodo(updated))
})

// 删除
todosRouter.delete('/:id', (req, res) => {
  const result = remove.run(req.params.id)
  if (Number(result.changes) === 0) {
    res.status(404).json({ error: 'todo 不存在' })
    return
  }
  res.status(204).end()
})
