import express from 'express'
import { todosRouter } from './todos.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)

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

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`)
})
