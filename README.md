# 🍔 EatOrNot

**多 Agent 饮食决策助手**

> 基于圆桌辩论的智能饮食推荐系统，帮助用户在"吃什么"这个高频场景中做出平衡健康、预算、情绪的选择。

## 核心特性

- 🤖 **多 Agent 协作** - 8 个专业 Agent 并行分析
- 🎯 **智能调度** - Orchestrator 根据用户输入动态选择 Agent
- 💬 **圆桌辩论** - 4 阶段辩论：初始判断 → 发现冲突 → 形成妥协 → 最终投票
- 📚 **知识库支撑** - 营养学知识库为 Agent 判断提供依据
- 🔄 **多轮对话** - 方案精炼，版本追踪
- 🎨 **双模式** - 长期管理 + 快速选择

## 架构

```
用户输入
    ↓
┌─────────────────────────────────────┐
│         Orchestrator Agent          │
│  (关键词分析 → 智能选择 Agent)       │
└─────────────────────────────────────┘
    ↓ 动态选择 3-5 个
┌─────────────────────────────────────┐
│         Supervisor Agent            │
│  (并行执行 → 圆桌辩论 → 构建方案)    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│         Debate Engine               │
│  (4阶段辩论：初始→冲突→妥协→投票)    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│          3 个推荐方案                │
│  1. 💪 自律减脂餐 (低卡)            │
│  2. 💰 省钱包饱餐 (低价)            │
│  3. 🍔 放纵一下餐 (满足)            │
└─────────────────────────────────────┘
```

## 技术栈

- **后端**: Python 3.12 + FastAPI
- **前端**: React + Vite + TypeScript
- **LLM**: Cloudflare AI Gateway (Gemma)
- **知识库**: JSON + 关键词匹配
- **数据**: Mock McDonald's MCP

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd apps/api
pip install -r requirements.txt

# 前端
cd ../web
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 设置 API token
```

### 3. 启动服务

```bash
# 后端 (端口 8001)
cd apps/api
uvicorn main:app --host 127.0.0.1 --port 8001

# 前端 (端口 5173)
cd apps/web
npm run dev
```

### 4. 访问应用

打开 http://localhost:5173

## 项目结构

```
eatornot/
├── apps/
│   ├── api/                    # FastAPI 后端
│   │   ├── main.py             # 入口
│   │   ├── agents/             # Agent 层
│   │   │   ├── orchestrator_agent.py  # 智能调度
│   │   │   ├── supervisor_agent.py    # 方案构建
│   │   │   ├── debate_engine.py       # 圆桌辩论
│   │   │   └── ...                    # 8个专业Agent
│   │   ├── api/                # 路由层
│   │   ├── services/           # 业务服务
│   │   ├── models/             # 数据模型
│   │   └── core/               # 基础设施
│   └── web/                    # React 前端
│       └── src/
│           ├── components/     # UI 组件
│           ├── api/            # API 客户端
│           └── styles.css      # 样式
├── knowledge/                  # 知识库
│   └── nutrition.json          # 营养学知识
└── docs/                       # 文档
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/recommend` | POST | 获取推荐 |
| `/api/plan/refine` | POST | 精炼方案 |
| `/api/order/confirm` | POST | 确认订单 |
| `/api/feedback` | POST | 提交反馈 |
| `/api/profile` | GET/POST | 用户档案 |

## Agent 列表

| Agent | 职责 |
|-------|------|
| 档案Agent | 分析用户档案，计算 BMI/TDEE |
| 减脂Agent | 减脂策略，热量缺口计算 |
| 营养Agent | 营养评估，食物推荐 |
| 预算Agent | 预算控制，性价比分析 |
| 食欲Agent | 情绪性进食检测 |
| 时间Agent | 时间压力评估 |
| 安全Agent | 过敏原检查，安全警告 |
| 未来模拟Agent | 用餐影响模拟 |

## 知识库

Agent 的判断依据来自营养学知识库：

- 《中国居民膳食指南》(2022)
- 《中国食物成分表》(第6版)
- WHO 营养指南
- Mifflin-St Jeor 公式
- 情绪性进食研究

## 安全约束

- ✅ 不自动下单，必须用户确认
- ✅ 不提供医疗诊断
- ✅ 极端饮食目标会被警告
- ✅ 过敏信息优先检查
- ✅ 不提交密钥到代码库
- ✅ MCP token 缺失时自动使用 Mock 数据

## 开发阶段

- [x] Phase 1: 基础框架
- [x] Phase 2: 核心交互体验重构
  - [x] Round Table Debate (圆桌辩论)
  - [x] ActivePlan 多轮对话
  - [x] UI 重构
  - [x] 重置逻辑
  - [x] 知识库
- [ ] Phase 3: RAG 向量检索
- [ ] Phase 4: 真实 MCP 对接

## License

MIT
