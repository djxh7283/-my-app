import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // 测试跑内存数据库，绝不碰 backend/data/todos.db 里的真实数据
    env: { DB_PATH: ':memory:' },
  },
})
