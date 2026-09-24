import { useEffect, useState, type FormEvent } from 'react'
import { api } from './api'
import type { Todo } from './types'
import './App.css'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .list()
      .then(setTodos)
      .catch((err: unknown) => setError(toMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  // 统一处理请求异常，避免每个操作都写一遍 try/catch
  async function run(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (err) {
      setError(toMessage(err))
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = title.trim()
    if (!text) return

    return run(async () => {
      const created = await api.create(text)
      setTodos((prev) => [...prev, created])
      setTitle('')
    })
  }

  function handleToggle(todo: Todo) {
    return run(async () => {
      const updated = await api.update(todo.id, { done: !todo.done })
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    })
  }

  function handleRemove(todo: Todo) {
    return run(async () => {
      await api.remove(todo.id)
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    })
  }

  const remaining = todos.filter((t) => !t.done).length

  return (
    <main>
      <h1>my-app</h1>
      <p className="sub">
        {loading ? '加载中…' : `共 ${todos.length} 条，未完成 ${remaining} 条`}
      </p>

      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="要做什么？"
          aria-label="新待办"
        />
        <button type="submit">添加</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="todos">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? 'done' : undefined}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => handleToggle(todo)}
              />
              <span>{todo.title}</span>
            </label>
            <button
              type="button"
              className="remove"
              onClick={() => handleRemove(todo)}
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {!loading && todos.length === 0 && (
        <p className="empty">还没有待办，在上面添加一条试试。</p>
      )}
    </main>
  )
}

function toMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

export default App
