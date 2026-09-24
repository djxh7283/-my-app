# my-app

[![CI](https://github.com/djxh7283/-my-app/actions/workflows/ci.yml/badge.svg)](https://github.com/djxh7283/-my-app/actions/workflows/ci.yml)

全栈示例项目：Vite + React + TypeScript 前端，Express + TypeScript 后端。

## 环境要求

- Node.js 20 以上（本机 v24.21.0 可用）

## 快速开始

```bash
npm install    # 一次性安装前后端所有依赖（npm workspaces）
npm run dev    # 同时启动前后端
```

启动后访问：

- 前端 <http://localhost:5173>
- 后端 <http://localhost:3001/api/health>

前端通过 Vite 代理把 `/api/*` 转发到后端，所以浏览器里不会遇到跨域问题。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 同时启动前端和后端 |
| `npm run dev:frontend` | 只启动前端 |
| `npm run dev:backend` | 只启动后端 |
| `npm run build` | 构建前后端产物 |
| `npm test` | 跑前后端全部测试 |
| `npm run test:backend` | 只跑后端测试 |
| `npm run test:frontend` | 只跑前端测试 |
| `npm run lint` | 前端代码检查（oxlint） |

## 目录结构

```
my-app/
├── frontend/            Vite + React + TS
│   ├── src/App.tsx      待办页面
│   ├── src/api.ts       调用后端的封装
│   ├── src/types.ts     与后端共享的数据类型
│   ├── src/App.test.tsx 组件测试
│   └── vite.config.ts   含 /api 代理和 vitest 配置
├── backend/             Express + TS
│   ├── src/index.ts     启动服务器
│   ├── src/app.ts       组装路由（不 listen，方便测试）
│   ├── src/db.ts        SQLite 连接与建表
│   ├── src/todos.ts     待办接口
│   ├── test/todos.test.ts  接口测试
│   └── data/todos.db    数据库文件（gitignore，首次启动自动生成）
└── package.json         workspaces + 启动脚本
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/todos` | 列出全部待办 |
| POST | `/api/todos` | 新建，body `{ "title": "..." }` |
| PATCH | `/api/todos/:id` | 更新，body `{ "title"?: "...", "done"?: true }` |
| DELETE | `/api/todos/:id` | 删除 |
| GET | `/api/hello` | 返回欢迎信息和服务器当前时间 |
| GET | `/api/health` | 健康检查 |

## 数据存储

用 **SQLite** 持久化，数据库文件在 `backend/data/todos.db`（已在 `.gitignore` 里，不会提交）。

用的是 Node 24 内置的 [`node:sqlite`](https://nodejs.org/api/sqlite.html)，**不需要任何额外依赖**，也不用编译原生模块。

- 换个位置：设环境变量 `DB_PATH=/your/path.db`
- 跑纯内存（重启即清空，适合测试）：`DB_PATH=:memory:`
- 清空数据重来：删掉 `backend/data/todos.db`，下次启动会自动重建目录和表

## 测试

用 [Vitest](https://vitest.dev/)，前后端各有一套。

```bash
npm test                # 前后端全部（26 个用例）
npm run test:backend    # 只跑后端：supertest 直接打接口（18 个）
npm run test:frontend   # 只跑前端：React Testing Library（8 个）
```

只看某个用例加 `-t 关键词`；边改边跑用 `npm run test:watch -w backend`（前端同理）。

写测试时踩过的两个坑，留个记录：

- **后端测试必须跑内存库**：`backend/vitest.config.ts` 里设了 `DB_PATH=:memory:`，`todos.test.ts` 里还有一条断言专门盯着这件事，防止哪天测试误写到真实数据上。
- **前端测试要手动 `cleanup()`**：没开 vitest 的 `globals`，RTL 的自动清理就不会注册，`afterEach` 里得显式调用，否则上一个用例残留的 DOM 会让 `findByText` 匹配到多个元素而失败。

## 持续集成

`.github/workflows/ci.yml` 在**每次 push 到 `main`** 和**每个 PR** 上跑，四步依次执行：

```
安装依赖（npm ci）→ 类型检查 → 代码检查 → 测试 → 构建
```

任何一步红了，PR 页面会直接标出来，不用等人肉跑一遍。本地想提前自查就跑 `npm run typecheck && npm run lint && npm test && npm run build`（或者干脆 `npm test` 加 `npm run build`）。
