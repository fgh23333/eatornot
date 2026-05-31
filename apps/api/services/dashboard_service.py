"""今日仪表盘服务 — 提供今日饮食状态概览"""

from datetime import datetime, timedelta
from models.user_profile import UserProfile
from services.nutrition_calculator import calculate_bmr, calculate_tdee, get_daily_calorie_target, get_meal_calorie_budget
from services.budget_service import BudgetService
from services.memory_service import MemoryService


class DashboardService:
    """今日饮食仪表盘"""

    def __init__(self):
        self.budget_service = BudgetService()
        self.memory_service = MemoryService()

    async def get_today_dashboard(self, user: UserProfile) -> dict:
        """获取今日仪表盘数据"""
        now = datetime.now()
        today = now.date()

        # 获取今日用餐记录
        today_meals = await self.budget_service.get_today_meals(user.user_id)

        # 计算今日营养摄入
        total_calories = sum(m.total_calories for m in today_meals)
        total_protein = sum(m.total_protein for m in today_meals)
        total_fat = sum(m.total_fat for m in today_meals)
        total_carbs = sum(m.total_carbs for m in today_meals)
        total_sodium = sum(m.total_sodium for m in today_meals)
        total_spent = sum(m.total_price for m in today_meals)

        # 计算营养目标
        bmr = calculate_bmr(user.weight_kg, user.height_cm, user.age, user.sex)
        tdee = calculate_tdee(bmr, user.activity_level)
        daily_calorie_target = get_daily_calorie_target(tdee, user.goal.value)

        # 计算各餐预算
        meal_budgets = {
            "breakfast": get_meal_calorie_budget(daily_calorie_target, "breakfast"),
            "lunch": get_meal_calorie_budget(daily_calorie_target, "lunch"),
            "dinner": get_meal_calorie_budget(daily_calorie_target, "dinner"),
            "snack": get_meal_calorie_budget(daily_calorie_target, "snack"),
        }

        # 分析各餐状态
        meal_status = {}
        for meal_type in ["breakfast", "lunch", "dinner"]:
            recorded = [m for m in today_meals if m.meal_type == meal_type]
            if recorded:
                meal_status[meal_type] = {
                    "recorded": True,
                    "calories": sum(m.total_calories for m in recorded),
                    "price": sum(m.total_price for m in recorded),
                    "time": recorded[0].timestamp.strftime("%H:%M"),
                }
            else:
                meal_status[meal_type] = {
                    "recorded": False,
                    "calories": 0,
                    "price": 0,
                    "time": None,
                }

        # 计算距离上次进食时间
        last_meal = max(today_meals, key=lambda m: m.timestamp) if today_meals else None
        hours_since_last_meal = (now - last_meal.timestamp).total_seconds() / 3600 if last_meal else None

        # 计算营养缺口
        calorie_gap = daily_calorie_target - total_calories
        protein_gap = max(0, user.weight_kg * 1.6 - total_protein)  # 1.6g/kg 体重

        # 计算预算余额
        budget_remaining = user.daily_budget - total_spent

        # 判断下一餐建议
        next_meal_suggestion = self._get_next_meal_suggestion(
            now, meal_status, calorie_gap, budget_remaining, user
        )

        # 获取用餐模式
        patterns = await self.memory_service.get_meal_patterns(user.user_id)

        return {
            "date": today.isoformat(),
            "time": now.strftime("%H:%M"),
            "meal_status": meal_status,
            "nutrition": {
                "calories": round(total_calories),
                "target": round(daily_calorie_target),
                "gap": round(calorie_gap),
                "protein": round(total_protein),
                "fat": round(total_fat),
                "carbs": round(total_carbs),
                "sodium": round(total_sodium),
            },
            "budget": {
                "daily": user.daily_budget,
                "spent": round(total_spent),
                "remaining": round(budget_remaining),
            },
            "last_meal": {
                "hours_ago": round(hours_since_last_meal, 1) if hours_since_last_meal else None,
                "time": last_meal.timestamp.strftime("%H:%M") if last_meal else None,
            },
            "next_meal_suggestion": next_meal_suggestion,
            "patterns": patterns,
        }

    def _get_next_meal_suggestion(self, now: datetime, meal_status: dict,
                                   calorie_gap: float, budget_remaining: float,
                                   user: UserProfile) -> dict:
        """生成下一餐建议"""
        hour = now.hour
        minute = now.minute

        # 判断当前应该吃哪一餐
        if hour < 10 and not meal_status["breakfast"]["recorded"]:
            meal_type = "breakfast"
            urgency = "high" if hour >= 8 else "normal"
        elif 10 <= hour < 14 and not meal_status["lunch"]["recorded"]:
            meal_type = "lunch"
            urgency = "high" if hour >= 12 else "normal"
        elif 14 <= hour < 21 and not meal_status["dinner"]["recorded"]:
            meal_type = "dinner"
            urgency = "high" if hour >= 18 else "normal"
        else:
            # 已经过了饭点或者都吃过了
            if calorie_gap > 200:
                meal_type = "snack"
                urgency = "low"
            else:
                return {
                    "meal_type": None,
                    "message": "今日饮食已达标",
                    "urgency": "none",
                }

        # 计算建议热量和预算
        meal_calorie_budget = get_meal_calorie_budget(
            calorie_gap + 500,  # 加上一些缓冲
            meal_type
        )
        meal_price_budget = budget_remaining / (3 - sum(1 for s in meal_status.values() if s["recorded"]))

        # 生成建议理由
        reasons = []
        if urgency == "high":
            reasons.append(f"已过{'早' if meal_type == 'breakfast' else '午' if meal_type == 'lunch' else '晚'}餐时间")
        if calorie_gap > 300:
            reasons.append(f"今日热量缺口 {round(calorie_gap)} 千卡")
        if budget_remaining < 20:
            reasons.append("预算紧张，建议选择性价比高的选项")

        return {
            "meal_type": meal_type,
            "urgency": urgency,
            "calorie_budget": round(meal_calorie_budget),
            "price_budget": round(meal_price_budget, 2),
            "reasons": reasons,
            "message": f"建议{'尽快' if urgency == 'high' else ''}吃{meal_type}",
        }


# 全局实例
dashboard_service = DashboardService()
