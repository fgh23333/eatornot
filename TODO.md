# TODO - 下一步工作

## 当前状态

### ✅ Phase 1: 基础框架
- ✅ FastAPI 后端
- ✅ **Vue 3** 前端 (Tailwind CSS + radix-vue)
- ✅ SQLite 数据库 (SQLAlchemy async)
- ✅ Mock 麦当劳 MCP

### ✅ Phase 2: 核心交互体验重构
- ✅ 圆桌辩论 (4阶段可视化：时间线+Agent彩色气泡+自动播放)
- ✅ ActivePlan 多轮对话精炼
- ✅ **Orchestrator LLM 智能调度** (Gemini 驱动 + 关键词降级)
- ✅ 知识库 (115条营养学数据)
- ✅ UI 全面重写 (Vue 3 + shadcn-vue 模式)
- ✅ 中文化

### ✅ Phase 3: Dual-Trigger MealDecisionFlow
- ✅ 统一决策入口 (`/api/decision`)
- ✅ 饭点提醒系统 (`/api/reminders`) + 浏览器 Notification
- ✅ 长期记忆强化 (饮食习惯、口味偏好、预算习惯、营养模式)
- ✅ 自动订单草稿增强 (利用记忆、BalanceMode 联动)
- ✅ 提醒卡组件 (ReminderCard.vue)

### ✅ Phase 4: 真实数据接入 + 可视化增强
- ✅ **真实麦当劳 MCP 接入** (streamablehttp_client, 160+ 真实菜品)
- ✅ **Gemini 官方 API** (gemma-4-31b-it, OpenAI 兼容协议)
- ✅ **辩论可视化增强** (时间线动画 + Agent 配色气泡 + 投票进度条 + 冲突对比)
- ✅ Provider 健康检查 + Mock 自动降级
- ✅ Tab 侧边栏布局 (状态/模式/数据 三页签)
- ✅ 隐藏滚动条 CSS 工具类

---

## 待完成

### 🔥 高优先级 (Hackathon 展示关键)

- [ ] **消除 demo-user 硬编码**
  - 前端 15+ 文件硬编码 `'demo-user'`
  - 需要从 profile 获取真实 user_id
  - API client 默认参数改为动态

- [ ] **持久化核心服务**
  - `ConversationService` 内存 dict → SQLite
  - `ActivePlanService` 内存 dict → SQLite
  - 重启不丢数据

- [ ] **前端交互打磨**
  - BalanceMode mood 接入实际情绪输入
  - 推荐结果页快捷回复按钮 ("换一个" / "少油" / "更便宜")
  - 分析时 skeleton 加载动画
  - 移动端响应式适配

### 📸 中优先级

- [ ] **拍照分析入口**
  - 图片上传组件
  - Gemini Vision API 识别食物
  - 营养范围估算

- [ ] **用户认证 (轻量级)**
  - 简单 session/token 认证
  - 不做完整注册系统，Hackathon 够用即可

- [ ] **更多餐饮平台**
  - 当前只有麦当劳
  - 统一 FoodProvider 接口已就绪
  - 接入美团/饿了么

### 🔧 低优先级

- [ ] **RAG 向量检索**
  - 当前知识库使用简单关键词匹配
  - 需要接入向量数据库 (ChromaDB)

- [ ] **部署**
  - Docker 容器化
  - 云部署 (Cloudflare Workers / 阿里云)

- [ ] **测试**
  - 单元测试 (pytest)
  - API 集成测试
  - E2E 测试 (Playwright)

---

## 已清理的技术债务

- ✅ ~~OrchestratorAgent 关键词映射 → 已改为 LLM 驱动 + 关键词降级~~
- ✅ ~~前端 React → 已迁移到 Vue 3~~
- ✅ ~~MCP Mock only → 已接入真实麦当劳 MCP~~
- ✅ ~~CF AIG 网关 → 已切换 Gemini 官方 API~~

## 技术债务 (剩余)

- [ ] ConversationService 从内存存储迁移到数据库
- [ ] ActivePlanService 从内存存储迁移到数据库
- [ ] 前端 BalanceMode mood 参数接入实际情绪输入
- [ ] demo-user 硬编码 → 真实用户会话
- [ ] CORS origins 硬编码 → 环境变量配置

## 如何贡献

1. 克隆项目
2. 创建分支: `git checkout -b feat/xxx`
3. 提交代码: `git commit -m "feat: xxx"`
4. 创建 PR → 合并到 main

## 联系方式

- 项目地址: https://github.com/fgh23333/eatornot
- 问题反馈: https://github.com/fgh23333/eatornot/issues
