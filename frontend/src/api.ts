import type { Todo } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }

  // 204 No Content 没有响应体
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  list: () => request<Todo[]>('/api/todos'),

  create: (title: string) =>
    request<Todo>('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  update: (id: string, patch: Partial<Pick<Todo, 'title' | 'done'>>) =>
    request<Todo>(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  remove: (id: string) =>
    request<void>(`/api/todos/${id}`, { method: 'DELETE' }),
}
