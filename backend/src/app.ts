import express from 'express'
import { todosRouter } from './todos.js'

// 只负责组装 app，不负责启动服务器 —— 这样测试可以直接拿 app 跑，不用占端口
export const app = express()

app.use(express.json())

app.get('/api/hello', (_req, res) => {
  res.json({
    message: 'Hello from the backend 👋',
    time: new Date().toISOString(),
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/api/todos', todosRouter)
