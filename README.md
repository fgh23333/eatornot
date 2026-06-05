# 🍔 EatOrNot

**多 Agent 饮食决策助手** — 让 8 个专业 Agent 帮你分析，今天到底吃不吃。

> Hackathon 项目 | [协作规范](CLAUDE.md) | [待办事项](TODO.md)

---

## 这是什么？

EatOrNot 不是简单的菜单推荐工具。它通过**多 Agent 圆桌辩论**，帮你做出平衡健康、预算、情绪的饮食决策。

**场景**：你想吃麦当劳，但你在减肥，预算不多，今天还很累。

| 传统工具 | EatOrNot |
|----------|----------|
| 给你一个套餐列表 | 8 个 Agent 并行分析 |
| 只看价格或销量 | 营养、预算、情绪、安全多维度 |
| 千人一面 | 基于你的档案和饮食习惯个性化推荐 |

**决策流程**：
1. 8 个 Agent 并行分析（营养、预算、情绪、安全...）
2. 4 阶段圆桌辩论，找出冲突点
3. 形成妥协方案
4. 给出 3 个有理有据的推荐（自律/省钱/犒劳）

---

## 核心特性

- 🤖 **多 Agent 协作** — 8 个专业 Agent 并行分析，Orchestrator 智能调度
- 💬 **圆桌辩论** — 4 阶段辩论（初始判断→发现冲突→形成妥协→最终投票）
- 📚 **知识库支撑** — 基于《中国居民膳食指南》等权威营养学知识
- 🔄 **多轮精炼** — 方案可逐轮调整，ActivePlan 支持版本追踪
- 🎨 **双模式入口** — 长期管理（完整档案）+ 快速选择（极简档案）
- 🧠 **习惯记忆** — 记录饮食偏好与历史，持续优化推荐
- ⏰ **饭点提醒** — 服务端 Cron + Web Push 浏览器推送 + 前端轮询
- 🔔 **终端集成** — Claude Code skill，终端内一键点餐/推荐/领券
- 📊 **今日仪表盘** — 实时营养摄入、预算消耗、饮食平衡可视化
- 🔗 **麦当劳 MCP** — 接入真实麦当劳菜单和价格数据，自动生成订单草稿

---

## 技术栈

| 层 | 技术 |
|----|------|
| **后端** | Python 3.12 + FastAPI |
| **前端** | Vue 3 + Vite 6 + TypeScript |
| **LLM** | Cloudflare AI Gateway → Google Gemma 4 |
| **数据库** | SQLAlchemy + aiosqlite (SQLite) |
| **Agent 框架** | Google ADK (Agent Development Kit) |
| **外部数据** | 麦当劳 MCP (Model Context Protocol) |

---

## 快速开始

### 方式 A：Docker 一键启动（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 CF_AIG_TOKEN（必填）

# 2. 一键启动
docker compose up -d --build

# 3. 访问
# 前端: http://localhost:5173
# 后端: http://localhost:8001/health
```

nginx 自动代理 `/api` → FastAPI 后端，无需跨域配置。

### 方式 B：本地开发

```bash
# 后端
cd apps/api
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001

# 前端 (另一个终端)
cd apps/web
pnpm install
pnpm dev
```

访问 http://localhost:5173

### 方式 C：Cloudflare 部署（线上）

- **前端**: Cloudflare Pages → 自动构建，绑定 `eatornot-7tp.pages.dev`
- **后端**: Cloudflare Workers + D1 → `eatornot-api.jimmy120070.workers.dev`
- **LLM**: Cloudflare AI Gateway → Gemma 4

### 终端点餐（Claude Code）

```powershell
# 一键安装 skill + 权限
.\scripts\claude-setup\install.ps1

# 重启 Claude Code，然后说：
帮我点午餐     # AI 推荐 + 查门店 + 下单
领券           # 自动领取麦当劳优惠券
有什么活动     # 查询当月活动日历
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

| 变量 | 必填 | 说明 |
|------|------|------|
| `CF_AIG_TOKEN` | ✅ | Cloudflare AI Gateway Token |
| `CF_AIG_BASE_URL` | ✅ | AI Gateway 兼容端点 URL |
| `GEMMA_MODEL` | ✅ | Gemma 模型 ID（如 `google-ai-studio/gemma-4-31b-it`） |
| `MCD_MCP_TOKEN` | ❌ | 麦当劳 MCP Token（无则用 Mock 数据） |
| `DATABASE_URL` | ❌ | SQLite 路径（默认 `./data/eatornot.db`） |

---

## 项目结构

```
eatornot/
├── apps/
│   ├── api/                          # FastAPI 后端
│   │   ├── main.py                   # 应用入口
│   │   ├── core/                     # 基础设施
│   │   │   ├── config.py             # 环境配置
│   │   │   ├── database.py           # 数据库连接
│   │   │   └── llm_client.py         # LLM 调用封装
│   │   ├── agents/                   # Agent 层 (核心)
│   │   │   ├── orchestrator_agent.py # 智能调度器
│   │   │   ├── supervisor_agent.py   # 方案构建器
│   │   │   ├── debate_engine.py      # 4 阶段圆桌辩论
│   │   │   └── 8 个专业 Agent        # 各维度分析
│   │   ├── api/                      # 路由层 (12 个模块)
│   │   ├── services/                 # 业务服务 (18 个)
│   │   ├── models/                   # Pydantic 数据模型
│   │   ├── providers/                # 食物数据源抽象层
│   │   ├── adk_app/                  # Google ADK 集成
│   │   └── data/                     # Mock 数据
│   └── web/                          # Vue 3 前端
│       └── src/
│           ├── App.vue               # 主应用
│           ├── api/client.ts         # API 客户端
│           ├── composables/          # Push 通知 + 全局状态
│           └── components/           # 25+ 组件
├── apps/worker/                      # Cloudflare Worker (Hono.js)
│   ├── src/index.ts                  # Worker 入口 + Cron + Push
│   └── wrangler.toml                 # D1 + Cron Trigger 配置
├── knowledge/                        # 营养学知识库
│   ├── nutrition.json                # 核心营养数据
│   ├── nutrition_guidelines/         # 膳食指南
│   ├── safety/                       # 安全规则
│   └── weight_loss/                  # 减重规则
├── skills/                           # ADK Skills (5 个)
├── scripts/claude-setup/             # 终端点餐安装脚本
│   ├── skills/meal-order.md          # Claude Code skill
│   ├── install.ps1                   # 一键安装
│   └── README.md                     # 使用文档
├── docs/                             # 文档
├── CLAUDE.md                         # 开发指南 + 协作规范
└── TODO.md                           # 待办事项
```

---

## Agent 列表

| Agent | 职责 | 证据来源 |
|-------|------|----------|
| 🧑 档案Agent | 分析用户画像 | 《中国居民膳食指南》 |
| 🔥 减脂Agent | 减脂策略 & 热量目标 | Mifflin-St Jeor 公式 |
| 🥗 营养Agent | 营养素评估 | 《中国食物成分表》 |
| 💰 预算Agent | 预算控制 & 开销策略 | 用户预算设置 |
| 🍫 食欲Agent | 情绪性进食分析 | 情绪性进食研究 |
| ⏰ 时间Agent | 时间压力评估 | 快餐出餐效率 |
| ⚠️ 安全Agent | 过敏 & 饮食安全 | 食品过敏原数据库 |
| 🔮 未来模拟Agent | 用餐后影响预测 | 热量-预算平衡模型 |

---

## 架构概览

```
┌──────────────────────────────────────────────────────┐
│                  用户入口 (3 种方式)                   │
│  🌐 浏览器 (Pages)  │  💻 终端 (Claude Code)  │  🐳 Docker │
└──────────┬──────────┴────────────┬──────────┴──────┬──────┘
           │                       │                  │
           ▼                       ▼                  ▼
┌──────────────────┐    ┌──────────────────┐   ┌────────────┐
│  Cloudflare Pages │    │  Claude Code      │   │  Docker    │
│  Vue 3 + nginx    │    │  + meal-order     │   │  Compose   │
│  Service Worker   │    │    skill          │   │  web+api   │
└────────┬─────────┘    └────────┬──────────┘   └─────┬──────┘
         │                       │                     │
         ▼                       ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    API 后端 (2 种部署)                        │
│         Cloudflare Workers (Hono.js)  │  FastAPI (本地/Docker) │
│         ├─ D1 Database               │  ├─ SQLite             │
│         ├─ Cron Triggers (3 餐次)     │  ├─ Google ADK Agents  │
│         ├─ Web Push (VAPID)           │  └─ McDonalds MCP      │
│         └─ AI Gateway → Gemma 4      │                        │
└──────────────────────────────────────────────────────────────┘
```

### 决策流程

```
用户输入 → MealDecisionFlow → SupervisorAgent
  ├─ OrchestratorAgent (LLM 智能调度 → 选 3-5 个 Agent)
  │   └─ asyncio.gather() → 8 个 Agent 并行分析
  ├─ DebateEngine (4 阶段圆桌辩论)
  └─ SupervisorAgent → 3 个方案: 💪自律 / 💰省钱 / 🍔犒劳
```

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/recommend` | POST | 获取推荐方案 |
| `/api/decision` | POST | 统一决策入口（含场景检测） |
| `/api/plan/refine` | POST | 精炼方案 |
| `/api/plan/active` | GET | 获取活跃方案 |
| `/api/profile/quick` | POST | 快速建档 |
| `/api/profile` | POST/GET | 完整建档/查询 |
| `/api/dashboard/today` | GET | 今日仪表盘 |
| `/api/reminder` | GET | 饭点提醒 |
| `/api/balance/*` | POST | 营养平衡分析 |
| `/api/chat` | POST | 对话式交互 |
| `/api/draft/auto` | POST | 自动生成订单草稿 |

---

## 食物数据源

系统通过 Provider 抽象层接入食物数据，支持：

| Provider | 说明 | 状态 |
|----------|------|------|
| `McDonaldsMCPProvider` | 真实麦当劳 MCP | ✅ 已接入 |
| `MockMcDonaldsProvider` | Mock 数据 | ✅ 降级备用 |
| `ManualProvider` | 手动输入 | ✅ 已实现 |

---

## 双模式

| 模式 | 输入 | 场景 |
|------|------|------|
| 🏋️ 长期管理 | 身高/体重/目标/预算/过敏/口味 | 持续追踪饮食习惯 |
| ⚡ 快速选择 | 目标/预算/饥饿感/食欲/心情 | 即时决策 |

---

## 相关文档

- [CLAUDE.md](CLAUDE.md) — 开发指南 + 协作规范
- [TODO.md](TODO.md) — 待办事项
- [docs/architecture.md](docs/architecture.md) — 详细架构设计
- [docs/product_plan.md](docs/product_plan.md) — 产品规划

## License

MIT
