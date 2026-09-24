import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { db, dbPath } from '../src/db.js'

// 每个用例前清空表，用例之间互不干扰
beforeEach(() => {
  db.exec('DELETE FROM todos')
})

// 建一条待办并返回它，省得每个用例都写一遍
async function createTodo(title = 'task') {
  const res = await request(app).post('/api/todos').send({ title })
  return res.body
}

describe('测试隔离', () => {
  it('用的是内存数据库，不会写到真实数据文件', () => {
    expect(dbPath).toBe(':memory:')
  })
})

describe('GET /api/todos', () => {
  it('没有数据时返回空数组', async () => {
    const res = await request(app).get('/api/todos')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('按创建顺序返回列表', async () => {
    await createTodo('first')
    await createTodo('second')

    const res = await request(app).get('/api/todos')

    expect(res.status).toBe(200)
    expect(res.body.map((t: { title: string }) => t.title)).toEqual([
      'first',
      'second',
    ])
  })
})

describe('POST /api/todos', () => {
  it('创建成功返回 201 和完整对象', async () => {
    const res = await request(app).post('/api/todos').send({ title: '写代码' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('写代码')
    expect(res.body.done).toBe(false)
    expect(typeof res.body.id).toBe('string')
    expect(res.body.createdAt).toBeTruthy()
  })

  it('中文标题往返无损', async () => {
    // 这条专门防编码回归：之前用命令行测试时中文被 GBK 破坏过
    const title = '持久化测试 · 中文标题 · emoji 🎉'
    const created = await createTodo(title)

    expect(created.title).toBe(title)

    const list = (await request(app).get('/api/todos')).body
    expect(list[0].title).toBe(title)
  })

  it('去掉标题两端的空白', async () => {
    const created = await createTodo('  前后有空格  ')

    expect(created.title).toBe('前后有空格')
  })

  it('纯空白标题返回 400', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  it('缺 title 字段返回 400', async () => {
    const res = await request(app).post('/api/todos').send({})

    expect(res.status).toBe(400)
  })

  it('title 不是字符串返回 400', async () => {
    const res = await request(app).post('/api/todos').send({ title: 123 })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/todos/:id', () => {
  it('可以把 done 改成 true', async () => {
    const created = await createTodo()

    const res = await request(app)
      .patch(`/api/todos/${created.id}`)
      .send({ done: true })

    expect(res.status).toBe(200)
    expect(res.body.done).toBe(true)
    expect(res.body.id).toBe(created.id)
  })

  it('可以改标题', async () => {
    const created = await createTodo('old')

    const res = await request(app)
      .patch(`/api/todos/${created.id}`)
      .send({ title: 'new' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('new')
  })

  it('改动会存下来，后续查询能看到', async () => {
    const created = await createTodo()
    await request(app).patch(`/api/todos/${created.id}`).send({ done: true })

    const list = (await request(app).get('/api/todos')).body

    expect(list[0].done).toBe(true)
  })

  it('不存在的 id 返回 404', async () => {
    const res = await request(app)
      .patch('/api/todos/not-a-real-id')
      .send({ done: true })

    expect(res.status).toBe(404)
    expect(res.body.error).toBeTruthy()
  })

  it('done 不是布尔值返回 400', async () => {
    const created = await createTodo()

    const res = await request(app)
      .patch(`/api/todos/${created.id}`)
      .send({ done: 'yes' })

    expect(res.status).toBe(400)
  })

  it('空标题返回 400', async () => {
    const created = await createTodo()

    const res = await request(app)
      .patch(`/api/todos/${created.id}`)
      .send({ title: '  ' })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/todos/:id', () => {
  it('删除成功返回 204，列表里也没了', async () => {
    const created = await createTodo()

    const res = await request(app).delete(`/api/todos/${created.id}`)

    expect(res.status).toBe(204)
    expect((await request(app).get('/api/todos')).body).toEqual([])
  })

  it('不存在的 id 返回 404', async () => {
    const res = await request(app).delete('/api/todos/not-a-real-id')

    expect(res.status).toBe(404)
  })
})

describe('GET /api/health', () => {
  it('返回 ok', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
