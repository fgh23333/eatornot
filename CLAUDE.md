# CLAUDE.md - Claude Code 项目指南

## 项目概述

EatOrNot 是一个**多 Agent 饮食决策助手**，帮助用户在"吃什么"这个高频场景中做出平衡健康、预算、情绪的选择。

**核心价值**：不是简单的菜单推荐，而是通过多个专业 Agent 的圆桌辩论，给出有理有据的饮食建议。

## 技术栈

- **后端**: Python 3.12 + FastAPI
- **前端**: React + Vite + TypeScript
- **LLM**: Cloudflare AI Gateway (Gemma 模型)
- **数据**: Mock McDonald's MCP

## 项目结构

```
eatornot/
├── apps/
│   ├── api/                    # FastAPI 后端
│   │   ├── main.py             # 入口
│   │   ├── agents/             # Agent 层 (核心)
│   │   ├── api/                # 路由层
│   │   ├── services/           # 业务服务
│   │   ├── models/             # 数据模型
│   │   └── core/               # 基础设施
│   └── web/                    # React 前端
├── knowledge/                  # 知识库
└── docs/                       # 文档
```

## 核心概念

### Agent 架构

```
用户输入 → Orchestrator (智能选择 3-5 Agent)
              ↓
         并行运行 Agent
              ↓
         DebateEngine (4阶段辩论)
              ↓
         SupervisorAgent (构建3个方案)
```

**8 个专业 Agent**：
- 档案Agent - 分析用户档案
- 减脂Agent - 减脂策略
- 营养Agent - 营养评估
- 预算Agent - 预算控制
- 食欲Agent - 情绪性进食
- 时间Agent - 时间压力
- 安全Agent - 过敏安全
- 未来模拟Agent - 用餐影响

### 圆桌辩论

辩论分 4 个阶段：
1. **初始判断** - 各 Agent 独立分析
2. **发现冲突** - 找出分歧点
3. **形成妥协** - 综合各方意见
4. **最终投票** - 给出推荐

### 知识库

Agent 的判断依据来自 `knowledge/nutrition.json`：
- 《中国居民膳食指南》(2022)
- 《中国食物成分表》(第6版)
- WHO 营养指南
- Mifflin-St Jeor 公式

## 启动方式

```bash
# 后端
cd apps/api
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001

# 前端
cd apps/web
npm install
npm run dev
```

## 关键文件

| 文件 | 说明 |
|------|------|
| `apps/api/agents/orchestrator_agent.py` | 智能调度器 |
| `apps/api/agents/supervisor_agent.py` | 方案构建器 |
| `apps/api/agents/debate_engine.py` | 圆桌辩论引擎 |
| `apps/api/api/recommend_routes.py` | 推荐接口 |
| `apps/api/api/plan_routes.py` | 方案精炼接口 |
| `apps/web/src/App.tsx` | 前端主应用 |
| `knowledge/nutrition.json` | 营养学知识库 |

## 协作规范

### Git Flow: GitHub Flow (精简版)

```
main ────────────────────────────────────────────●
       \              \              \
  feat/xxx       feat/yyy       feat/zzz
        │              │              │
        └──── PR ──────┘──────────────┘
              合并回 main
```

- `main` 永远可运行，禁止直接 push
- 所有开发走 `feat/*` 分支
- 合并走 PR，hackathon 期间可自 merge（建议交叉 review）

### Commit 规范

```
<type>: <描述>
```

| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `refactor` | 重构（不改功能） |
| `chore` | 构建/依赖/配置/杂务 |

示例：
```
feat: 添加饭点主动提醒功能
fix: 修复营养计算单位错误
refactor: 拆分 dashboard 服务为独立模块
chore: 升级 vite 到最新版本
```

### 分支命名

```
feat/<简短描述>
```

示例：`feat/ui-redesign`、`feat/proactive-reminder`、`feat/learning-engine`

## 下一步工作

见 `TODO.md`
