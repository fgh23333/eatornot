"""长期记忆服务 — 记录用户饮食习惯"""

from datetime import datetime, timedelta
from typing import TYPE_CHECKING
from collections import Counter

if TYPE_CHECKING:
    from models.meal_record import MealRecord


class MemoryService:
    """管理用户用餐历史和偏好"""

    def __init__(self):
        from api.meal_routes import _meal_records, _feedback_records
        self._records = _meal_records
        self._feedback = _feedback_records

    async def get_recent_meals(self, user_id: str, days: int = 7) -> list:
        """获取最近的用餐记录"""
        cutoff = datetime.now() - timedelta(days=days)
        return [m for m in self._records if m.user_id == user_id and m.timestamp >= cutoff]

    async def get_preferences(self, user_id: str) -> dict:
        """从历史记录推断偏好"""
        recent = await self.get_recent_meals(user_id, days=30)
        if not recent:
            return {"preferred_items": [], "avoided_items": []}

        # 统计菜品频率
        item_counts: dict[str, int] = {}
        for meal in recent:
            for item in meal.items:
                name = item.get("name", "unknown")
                item_counts[name] = item_counts.get(name, 0) + 1

        # 按频率排序
        sorted_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)
        preferred = [name for name, count in sorted_items[:5]]

        # 从反馈中找出不喜欢的食物
        avoided = []
        for feedback in self._feedback:
            if feedback.get("satisfaction", 3) <= 2:
                meal_id = feedback.get("meal_id")
                for meal in self._records:
                    if meal.id == meal_id:
                        for item in meal.items:
                            avoided.append(item.get("name", ""))
                        break

        return {
            "preferred_items": preferred,
            "avoided_items": list(set(avoided))[:5],
        }

    async def get_indulgence_count_this_week(self, user_id: str) -> int:
        """本周放纵次数"""
        week_ago = datetime.now() - timedelta(days=7)
        count = 0
        for meal in self._records:
            if meal.user_id == user_id and meal.timestamp >= week_ago:
                if meal.plan_mode == "controlled_indulgence":
                    count += 1
        return count

    async def get_meal_patterns(self, user_id: str) -> dict:
        """分析用餐模式"""
        recent = await self.get_recent_meals(user_id, days=30)
        if not recent:
            return {
                "usual_times": {},
                "frequent_items": [],
                "skipped_meals": [],
                "avg_daily_spend": 0,
                "budget_usage": {},
            }

        # 分析用餐时间
        meal_times = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
        daily_spend = {}

        for meal in recent:
            hour = meal.timestamp.hour
            meal_type = meal.meal_type

            if meal_type in meal_times:
                meal_times[meal_type].append(hour)

            date = meal.timestamp.date()
            if date not in daily_spend:
                daily_spend[date] = 0
            daily_spend[date] += meal.total_price

        # 计算常见用餐时间
        usual_times = {}
        for meal_type, times in meal_times.items():
            if times:
                avg_hour = sum(times) / len(times)
                usual_times[meal_type] = f"{int(avg_hour):02d}:00"

        # 计算平均每日花费
        avg_daily_spend = sum(daily_spend.values()) / len(daily_spend) if daily_spend else 0

        # 识别跳过的餐次
        skipped_meals = []
        for meal_type in ["breakfast", "lunch", "dinner"]:
            if not meal_times[meal_type]:
                skipped_meals.append(meal_type)

        # 频繁点的菜品
        frequent_items = []
        item_counts = Counter()
        for meal in recent:
            for item in meal.items:
                item_counts[item.get("name", "")] += 1
        frequent_items = [name for name, _ in item_counts.most_common(5)]

        # 预算使用习惯
        budget_usage = {
            "avg_daily": round(avg_daily_spend, 2),
            "max_daily": round(max(daily_spend.values()) if daily_spend else 0, 2),
            "min_daily": round(min(daily_spend.values()) if daily_spend else 0, 2),
        }

        return {
            "usual_times": usual_times,
            "frequent_items": frequent_items,
            "skipped_meals": skipped_meals,
            "avg_daily_spend": round(avg_daily_spend, 2),
            "budget_usage": budget_usage,
        }

    async def save_feedback(self, user_id: str, meal_id: str, satisfaction: int, notes: str) -> None:
        """保存反馈"""
        from models.meal_record import MealRecord
        feedback = {
            "user_id": user_id,
            "meal_id": meal_id,
            "satisfaction": satisfaction,
            "notes": notes,
            "timestamp": datetime.now(),
        }
        self._feedback.append(feedback)

        # 更新用餐记录的满意度
        for meal in self._records:
            if meal.id == meal_id:
                meal.satisfaction = satisfaction
                meal.notes = notes
                break


# 全局实例
memory_service = MemoryService()
