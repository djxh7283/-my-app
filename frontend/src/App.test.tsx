import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Todo } from './types'

// 不依赖 jsdom 里有没有 Response 构造函数，手搓一个够用的假响应
function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response
}

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'id-1',
    title: '写代码',
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  // 没开 vitest 的 globals，RTL 的自动清理不会注册，得手动画掉上一个用例的 DOM，
  // 否则残留节点会让 findByText 匹配到多个元素而失败
  cleanup()
  vi.unstubAllGlobals()
})

describe('初始加载', () => {
  it('渲染后端返回的列表和统计', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([makeTodo(), makeTodo({ id: 'id-2', title: '吃饭', done: true })]),
    )

    render(<App />)

    expect(await screen.findByText('写代码')).toBeTruthy()
    expect(screen.getByText('吃饭')).toBeTruthy()
    expect(screen.getByText('共 2 条，未完成 1 条')).toBeTruthy()
  })

  it('列表为空时显示提示文案', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))

    render(<App />)

    expect(await screen.findByText('还没有待办，在上面添加一条试试。')).toBeTruthy()
  })

  it('加载失败时显示错误信息', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: '数据库炸了' }, 500))

    render(<App />)

    expect(await screen.findByText('数据库炸了')).toBeTruthy()
  })
})

describe('添加待办', () => {
  it('提交后调用 POST，新条目出现且输入框清空', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    fetchMock.mockResolvedValueOnce(jsonResponse(makeTodo({ title: '新任务' }), 201))

    render(<App />)
    await screen.findByText('还没有待办，在上面添加一条试试。')

    fireEvent.change(screen.getByLabelText('新待办'), {
      target: { value: '新任务' },
    })
    fireEvent.click(screen.getByRole('button', { name: '添加' }))

    expect(await screen.findByText('新任务')).toBeTruthy()
    expect((screen.getByLabelText('新待办') as HTMLInputElement).value).toBe('')

    // 确认发出去的是 POST /api/todos，且 body 带上了标题
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/todos')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ title: '新任务' })
  })

  it('创建失败时显示错误信息，并保留输入框内容', async () => {
    // 注意：纯空白标题在客户端就被拦下了（见上一个用例），根本不会发请求，
    // 所以后端的 400 从界面上是走不到的，这里用服务端错误来验证失败提示。
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: '服务器内部错误' }, 500))

    render(<App />)
    await screen.findByText('还没有待办，在上面添加一条试试。')

    fireEvent.change(screen.getByLabelText('新待办'), {
      target: { value: '新任务' },
    })
    fireEvent.click(screen.getByRole('button', { name: '添加' }))

    expect(await screen.findByText('服务器内部错误')).toBeTruthy()
    // 没添加成功就不该清空，否则用户得重打一遍
    expect((screen.getByLabelText('新待办') as HTMLInputElement).value).toBe(
      '新任务',
    )
  })

  it('标题为空时根本不发请求', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))

    render(<App />)
    await screen.findByText('还没有待办，在上面添加一条试试。')

    fireEvent.click(screen.getByRole('button', { name: '添加' }))

    // 只有最初那次 GET，没有多余的请求
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('勾选完成', () => {
  it('点击复选框调用 PATCH 并更新勾选状态', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([makeTodo()]))
    fetchMock.mockResolvedValueOnce(jsonResponse(makeTodo({ done: true })))

    render(<App />)
    const checkbox = await screen.findByRole('checkbox')
    expect((checkbox as HTMLInputElement).checked).toBe(false)

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    })
    expect(screen.getByText('共 1 条，未完成 0 条')).toBeTruthy()

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/todos/id-1')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ done: true })
  })
})

describe('删除待办', () => {
  it('点击删除调用 DELETE 并把条目移除', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([makeTodo()]))
    fetchMock.mockResolvedValueOnce(jsonResponse(undefined, 204))

    render(<App />)
    await screen.findByText('写代码')

    fireEvent.click(screen.getByRole('button', { name: '删除' }))

    await waitFor(() => {
      expect(screen.queryByText('写代码')).toBeNull()
    })

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/todos/id-1')
    expect(init.method).toBe('DELETE')
  })
})
