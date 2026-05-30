# 🍔 EatOrNot

**多 Agent 饮食决策助手**

> 今天吃什么？让 8 个专业 Agent 帮你分析。

## 这是什么？

EatOrNot 不是简单的菜单推荐工具。它通过**多 Agent 圆桌辩论**，帮你做出平衡健康、预算、情绪的饮食决策。

**场景**：你想吃麦当劳，但你在减肥，预算不多，今天还很累。

**传统工具**：给你一个套餐列表。

**EatOrNot**：
1. 8 个 Agent 并行分析（营养、预算、情绪、安全...）
2. 圆桌辩论，找出冲突点
3. 形成妥协方案
4. 给出 3 个有理有据的推荐

## 核心特性

- 🤖 **多 Agent 协作** - 8 个专业 Agent 并行分析
- 💬 **圆桌辩论** - 4 阶段辩论，有理有据
- 📚 **知识库支撑** - 营养学知识库，不是拍脑袋
- 🔄 **多轮对话** - 方案可以持续精炼
- 🎨 **双模式** - 长期管理 + 快速选择

## 快速开始

```bash
# 1. 安装依赖
cd apps/api && pip install -r requirements.txt
cd ../web && npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 设置 API token

# 3. 启动服务
cd apps/api && uvicorn main:app --host 127.0.0.1 --port 8001 &
cd apps/web && npm run dev

# 4. 访问 http://localhost:5173
```

## 项目结构

```
eatornot/
├── apps/
│   ├── api/                    # FastAPI 后端
│   │   ├── agents/             # Agent 层 (核心)
│   │   │   ├── orchestrator_agent.py  # 智能调度
│   │   │   ├── supervisor_agent.py    # 方案构建
│   │   │   ├── debate_engine.py       # 圆桌辩论
│   │   │   └── ...                    # 8个专业Agent
│   │   ├── api/                # 路由层
│   │   ├── services/           # 业务服务
│   │   └── models/             # 数据模型
│   └── web/                    # React 前端
├── knowledge/                  # 知识库
│   └── nutrition.json          # 营养学知识
├── CLAUDE.md                   # Claude Code 接手指南
├── TODO.md                     # 下一步工作
└── README.md                   # 本文件
```

## Agent 列表

| Agent | 职责 | 证据来源 |
|-------|------|----------|
| 档案Agent | 分析用户档案 | 《中国居民膳食指南》 |
| 减脂Agent | 减脂策略 | Mifflin-St Jeor 公式 |
| 营养Agent | 营养评估 | 《中国食物成分表》 |
| 预算Agent | 预算控制 | 用户预算设置 |
| 食欲Agent | 情绪性进食 | 情绪性进食研究 |
| 时间Agent | 时间压力 | 快餐出餐效率 |
| 安全Agent | 过敏安全 | 食品过敏原数据库 |
| 未来模拟Agent | 用餐影响 | 热量-预算平衡模型 |

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/recommend` | POST | 获取推荐 |
| `/api/plan/refine` | POST | 精炼方案 |
| `/api/order/confirm` | POST | 确认订单 |
| `/api/feedback` | POST | 提交反馈 |

## 下一步

见 `TODO.md`

## 如何让 Claude Code 接手

见 `CLAUDE.md`

## License

MIT
