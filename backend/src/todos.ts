import { Router } from 'express'
import { randomUUID } from 'node:crypto'

export type Todo = {
  id: string
  title: string
  done: boolean
  createdAt: string
}

// 内存存储：进程重启就清空。要持久化请换成数据库（见 README）。
const todos = new Map<string, Todo>()

export const todosRouter = Router()

// 列出全部
todosRouter.get('/', (_req, res) => {
  res.json([...todos.values()])
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
  todos.set(todo.id, todo)
  res.status(201).json(todo)
})

// 改标题 / 改完成状态
todosRouter.patch('/:id', (req, res) => {
  const todo = todos.get(req.params.id)
  if (!todo) {
    res.status(404).json({ error: 'todo 不存在' })
    return
  }

  const { title, done } = req.body ?? {}

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'title 不能为空' })
      return
    }
    todo.title = title.trim()
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      res.status(400).json({ error: 'done 必须是布尔值' })
      return
    }
    todo.done = done
  }

  res.json(todo)
})

// 删除
todosRouter.delete('/:id', (req, res) => {
  if (!todos.delete(req.params.id)) {
    res.status(404).json({ error: 'todo 不存在' })
    return
  }
  res.status(204).end()
})
