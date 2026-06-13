# 🍔 半决赛答辩 Slides 大纲

> **队名**：吃了吗 | **赛道**：A (AI Agent) | **时长**：5min 路演 + 3min QA
> **核心定位**：基于 Gemma 4 的营养成分以及开销伴随智能体

---

## Slide 1：封面（5s）

**标题**：基于 Gemma 4 的营养成分以及开销伴随智能体

- 副标题：面向程序员的终端饮食决策 Agent
- 队名：吃了吗
- 赛道：A - AI Agent
- 团队成员 / 联系方式

---

## Slide 2：痛点引入（20s）

**标题**：程序员的"吃"难题

> "又忘记点饭了..." "吃个巨无霸吧，不管了" "这个月又超预算了"

三个痛点场景（配插图/emoji）：
| 痛点 | 现状 |
|------|------|
| 🕐 **忘记吃饭** | 高强度编码，错过饭点 |
| 🍔 **情绪性进食** | 压力大 → 暴饮暴食 |
| 💰 **预算失控** | 不知不觉月度餐费超标 |

**→ 现有工具只给菜单列表，不理解你的健康目标、预算限制和情绪状态。**

---

## Slide 3：产品定位（20s）

**标题**：不是菜单推荐，是多 Agent 饮食辩论

对比表格：
| 传统工具 | 本项目 |
|----------|--------|
| 1 个推荐算法 | 8 个专业 Agent |
| 只看价格/销量 | 健康 + 预算 + 情绪 + 安全 |
| 千人一面 | 学习你的饮食习惯 |
| 推荐完就结束 | 自主下单闭环 |

**核心价值**：让 AI Agent 从不同角度辩论，给出有理有据的饮食建议。

---

## Slide 4：系统架构全景（40s）⭐ 关键

**标题**：多 Agent 协作架构

架构图（简洁版）：

```
用户输入 → MealDecisionFlow
    │
    ├─ ① Memory 召回（饮食习惯 + 偏好模式）
    │
    ├─ ② Orchestrator（Gemma 4 Function Calling 智能调度）
    │   └─ 选择 3-5 个最相关的 Agent
    │
    ├─ ③ 6 Agent 并行分析（asyncio.gather）
    │   [档案] [减脂] [营养] [预算] [食欲] [时间]
    │
    ├─ ④ DebateEngine 4 阶段辩论
    │   R1 初始意见 → R2 发现冲突 → R3 妥协 → R4 投票
    │
    └─ ⑤ 输出 3 方案（自律/省钱/犒劳）+ 自动订单草稿
```

**强调**：每次决策 10-12 次 LLM 调用，不是单次 Prompt。

---

## Slide 5：Gemma 4 深度利用 — Function Calling（40s）⭐ 关键

**标题**：Native Function Calling — 不只是 Prompt 工程

**Orchestrator 智能调度**（真实日志截图）：

```
[ToolCalling] 可选工具: ['profile', 'weight_loss', 'nutrition',
  'budget', 'craving', 'time_context', 'safety', 'future_simulation']

[ToolCalling] LLM Function Calling 返回:
  selected: ['weight_loss', 'nutrition', 'budget', 'craving']
  reason: '用户明确提到减脂目标+预算限制+疲劳状态'
```

**Tool Calling 闭环**（真实 API 调用）：

```
search_menu("鸡腿堡")     → 获取餐品数据
get_nutrition("big_mac")  → 563kcal, 蛋白33g
calculate_price(items)    → ¥42, 可用优惠券-¥5
create_order(items)       → 订单创建成功
```

**要点**：Agent 通过 Gemma 4 的 Function Calling **自主选择**工具，不是硬编码路由。

---

## Slide 6：Gemma 4 深度利用 — Agent Memory（30s）⭐ 关键

**标题**：Agent Memory — 学习你的饮食习惯

三层记忆架构图：

```
短期记忆 → 当前对话上下文（内存）
中期记忆 → 用餐记录 + 偏好反馈（SQLite）
长期记忆 → 行为模式 + 习惯画像（SQLite）
```

真实日志：
```
[Memory] 检测到模式: 用户偏好高蛋白餐品 (置信度 0.82)
[Memory] 召回习惯: 偏好=[辣味, 高蛋白], 预算模式=[工作日节省]
[Orchestrator] 基于记忆 → 增加减脂Agent和预算Agent权重
```

**要点**：记忆影响 Orchestrator 的 Agent 选择权重，越用越懂你。

---

## Slide 7：圆桌辩论引擎（30s）⭐ 关键

**标题**：4 阶段辩论 — 让 Agent 互相"吵"出最优方案

辩论流程动画/图示：

| 阶段 | 内容 | Gemma 4 角色 |
|------|------|-------------|
| R1 初始意见 | 各 Agent 基于数据+知识库陈述立场 | 结构化输出 |
| R2 发现冲突 | 找出 Agent 间的矛盾点 | 冲突分析 |
| R3 形成妥协 | 主持人综合各方意见 | 推理+权衡 |
| R4 最终投票 | 各 Agent 对方案投票 | 分类判断 |

**真实冲突示例**：
- 🔥 减脂Agent："板烧鸡腿堡仅 333kcal"
- 💰 预算Agent："但套餐 ¥35 超出 ¥25 预算"
- 🍫 食欲Agent："用户心情低落需要满足感"
- **妥协**："高蛋白单品组合 + 无糖可乐，¥22 内"

---

## Slide 8：Demo 演示（40s）

**标题**：实时演示

**方案 A**：现场跑 Demo（推荐，需确保网络稳定）
- 打开 http://localhost:5173
- 演示快速建档 → 输入 "想吃麦当劳但我在减肥" → 观看辩论 → 3 方案

**方案 B**：视频 + 截图（备用）
- 演示视频：https://youtu.be/OXaYEZb2hQ0
- 关键截图：辩论可视化 / 3 方案卡片 / 今日仪表盘

**演示亮点**：
1. 双模式入口（长期管理 vs 快速选择）
2. 辩论可视化（4 阶段实时展示）
3. 终端集成（Claude Code Skill 一键点餐）

---

## Slide 9：技术栈 & 创新点（20s）

**标题**：技术实现

| 层 | 技术 |
|----|------|
| LLM | Gemma 4 31B Dense（Gemini API 直连） |
| 后端 | Python 3.12 + FastAPI（异步 Agent 编排） |
| 前端 | Vue 3 + Vite 6 + TypeScript |
| Agent 框架 | 自定义多 Agent 编排 (Gemma 4 Function Calling) |
| 外部工具 | 麦当劳 MCP（Model Context Protocol） |
| 部署 | Docker Compose 一键启动 |

**三大创新**：
1. 🧠 **LLM 驱动调度** — 不是 rule-based，是 Gemma 4 智能选择 Agent
2. 💬 **多 Agent 辩论** — 发现冲突 → 妥协 → 投票，不是简单投票
3. 🔧 **Tool Calling 闭环** — 从营养查询到自主下单，全链路 MCP

---

## Slide 10：未来扩展计划（30s）

**标题**：未来路线图

### 短期（1-2 月）
| 计划 | 说明 |
|------|------|
| 📸 **拍照分析** | Gemini Vision API 识别食物 → 营养估算 |
| 📱 **移动端适配** | PWA + 响应式，通勤场景也能用 |
| 🧪 **测试覆盖** | pytest 单元测试 + API 集成测试 |

### 中期（3-6 月）
| 计划 | 说明 |
|------|------|
| 🍜 **多平台接入** | FoodProvider 接口已就绪 → 美团/饿了么/便利店 |
| 🧠 **RAG 向量检索** | 知识库从关键词匹配 → ChromaDB 语义检索 |
| 👥 **用户认证** | 轻量级 session/token，支持多人使用 |
| 📊 **健康趋势分析** | 周/月营养摄入趋势可视化 + 医学建议 |

### 长期愿景
> 成为程序员的 **AI 饮食健康管家** — 不只是帮你选吃什么，而是长期追踪你的营养状态，在合适的时间提醒你，在你放纵时理性劝导。

---

## Slide 11：总结 & QA（10s）

**标题**：谢谢！

**一句话总结**：
> 基于 Gemma 4 的多 Agent 饮食智能体 — 让 AI Agent 辩论帮你做饮食决策，从分析到下单全闭环。

- 📹 视频：https://youtu.be/OXaYEZb2hQ0
- 💻 代码：https://github.com/fgh23333/eatornot
- 📋 PR：https://github.com/gdgshanghai/Gemma4-Hackathon-ShangHai/pull/49

---

## ⏰ 时间分配（严格 5 分钟）

| Slide | 内容 | 时长 |
|-------|------|------|
| 1 | 封面 | 5s |
| 2 | 痛点引入 | 20s |
| 3 | 产品定位 | 20s |
| 4 | 系统架构 | 40s |
| 5 | Function Calling | 40s |
| 6 | Agent Memory | 30s |
| 7 | 圆桌辩论 | 30s |
| 8 | Demo 演示 | 40s |
| 9 | 技术栈 + 创新 | 20s |
| 10 | 未来扩展 | 30s |
| 11 | 总结 + QA | 10s |
| | **总计** | **~4m45s** |

> 预留 15s 缓冲。如果 Demo 需要更多时间，可压缩 Slide 2-3（痛点+定位）各少 5s。

---

## 🎤 QA 预备（3 分钟）

### 高概率问题 + 参考回答

**Q1: 为什么选 Gemma 4 31B 而不是更小的模型？**
> 31B Dense 在中文营养学知识理解、多步推理一致性、Function Calling JSON 输出稳定性三个维度表现最好。我们尝试过 12B，在辩论环节的多 Agent 上下文保持上不够稳定。

**Q2: Orchestrator 和传统 rule-based 路由有什么区别？**
> 传统方式用关键词匹配（"减肥"→减脂Agent）。我们用 Gemma 4 分析完整上下文，能处理复杂场景如"我今天很累想吃点好的但在减肥"，关键词无法捕获"累"→食欲Agent + "减肥"→减脂Agent 的组合需求。

**Q3: Agent Memory 怎么避免冷启动？**
> 新用户先用快速建档模式（只需选目标/预算/饥饿感），首次决策不依赖历史记忆。随着用餐反馈积累（3-5 次），记忆系统开始影响 Agent 权重和推荐偏好。

**Q4: Tool Calling 的 MCP 接入有什么挑战？**
> 麦当劳 MCP 的 API 响应格式是嵌套 JSON，需要做数据转换层（Provider 抽象）。另外 MCP Token 有频率限制，我们做了 Mock 降级机制，Token 不可用时自动切换模拟数据。

**Q5: 辩论引擎的 4 阶段是硬编码还是 LLM 驱动？**
> 混合模式。流程（4 阶段）是工程框架，但每个阶段的内容（发现哪些冲突、如何妥协、投什么票）完全由 Gemma 4 生成。这样既保证流程可控，又保持灵活性。

**Q6: 怎么衡量推荐质量？**
> 目前通过用户反馈（1-5 分评分）+ 方案采纳率衡量。长期计划引入营养师标注数据做基准测试。

**Q7: 和通用 AI 助手（ChatGPT/Gemini）的饮食建议有什么区别？**
> 通用助手是单次对话。我们是多 Agent 并行分析 + 辩论 + 记忆学习 + 自主下单闭环。关键差异：1）记忆跨会话持续学习；2）多维度冲突检测和妥协；3）Tool Calling 实现下单而不只是建议。
