# my-app

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
| `npm run lint` | 前端代码检查（oxlint） |

## 目录结构

```
my-app/
├── frontend/            Vite + React + TS
│   ├── src/App.tsx      页面，调用后端 /api/hello
│   └── vite.config.ts   含 /api 代理配置
├── backend/             Express + TS
│   └── src/index.ts     接口实现
└── package.json         workspaces + 启动脚本
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/hello` | 返回欢迎信息和服务器当前时间 |
| GET | `/api/health` | 健康检查 |
