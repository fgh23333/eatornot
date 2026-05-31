# TODO - 下一步工作

## 当前状态

### ✅ 已完成

**Phase 1: 基础框架**
- ✅ FastAPI 后端
- ✅ React 前端
- ✅ SQLite 数据库
- ✅ Mock 麦当劳 MCP

**Phase 2: 核心交互体验重构**
- ✅ 圆桌辩论 (4阶段)
- ✅ ActivePlan 多轮对话
- ✅ Orchestrator 智能调度
- ✅ 知识库
- ✅ UI 优化
- ✅ 中文化

**Phase 3: Dual-Trigger MealDecisionFlow**
- ✅ 统一决策入口 (`/api/decision`)
- ✅ 饭点提醒系统 (`/api/reminders`)
- ✅ 长期记忆强化 (饮食习惯、口味偏好、预算习惯、营养模式)
- ✅ 自动订单草稿增强 (利用记忆、BalanceMode 联动)
- ✅ 提醒卡组件 (ReminderCard.tsx)

## 待完成

### 高优先级

- [ ] **前端完整测试**
  - 测试提醒卡显示
  - 测试 MealDecisionFlow 完整流程
  - 测试记忆参考展示

- [ ] **拍照分析入口**
  - 新增图片上传组件
  - Mock 视觉识别 fallback
  - 营养范围估算

### 中优先级

- [ ] **用户认证**
  - 当前没有用户系统
  - 需要登录注册
  - 需要会话管理

- [ ] **更多餐饮平台**
  - 当前只有麦当劳
  - 需要接入美团、饿了么
  - 需要统一的 FoodProvider 接口

### 低优先级

- [ ] **RAG 向量检索**
  - 当前知识库使用简单关键词匹配
  - 需要接入向量数据库 (ChromaDB)
  - 需要下载 embedding 模型

- [ ] **部署**
  - Docker 容器化
  - 云部署 (AWS/阿里云)
  - CI/CD 流水线

- [ ] **测试**
  - 单元测试
  - 集成测试
  - E2E 测试

## 技术债务

- [ ] ConversationService 从内存存储迁移到数据库
- [ ] ActivePlanService 从内存存储迁移到数据库
- [ ] OrchestratorAgent 关键词映射改为 LLM 驱动
- [ ] 前端 BalanceMode mood 参数接入实际情绪输入

## 如何贡献

1. 克隆项目
2. 创建分支: `git checkout -b feature/xxx`
3. 提交代码: `git commit -m "feat: xxx"`
4. 创建 PR

## 联系方式

- 项目地址: https://github.com/fgh23333/eatornot
- 问题反馈: https://github.com/fgh23333/eatornot/issues
