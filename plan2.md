# EatOrNot 重构计划（剩余项）

## 已完成 ✅

1. ~~模式选择首页~~
2. ~~重置按钮~~
3. ~~用户档案建档~~
4. ~~快速模式~~
5. ~~多轮方案精炼~~
6. ~~圆桌辩论 UI~~
7. ~~Google ADK 集成~~
9. ~~UI 质量~~
10. ~~产品定位 + FoodProvider 抽象~~
11. ~~文档更新~~

## 未完成

### 8. 拍照分析模式

- 图片上传组件
- Gemini Vision API 识别食物
- 营养范围估算
- 用户确认后更新记录

需要的端点：
```
POST /api/vision/test
POST /api/meal/analyze-image
POST /api/menu/analyze-image
```

注意：
- 不要声称精确热量，必须显示"估算范围"
- 如果 Gemma 4 不支持图片输入，用 mock vision 兜底
- 需要用户确认检测到的食物项
