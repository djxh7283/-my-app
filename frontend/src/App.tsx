import { useState } from 'react'
import './App.css'

type HelloResponse = {
  message: string
  time: string
}

function App() {
  const [data, setData] = useState<HelloResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function callApi() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/hello')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await res.json()) as HelloResponse)
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>my-app</h1>
      <p className="sub">Vite + React 前端 · Express 后端</p>

      <button type="button" onClick={callApi} disabled={loading}>
        {loading ? '请求中…' : '调用后端 /api/hello'}
      </button>

      {error && (
        <p className="error">
          请求失败：{error}
          <br />
          <small>后端启动了吗？试试 npm run dev</small>
        </p>
      )}

      {data && (
        <pre className="result">
          {data.message}
          {'\n'}
          {data.time}
        </pre>
      )}
    </main>
  )
}

export default App
