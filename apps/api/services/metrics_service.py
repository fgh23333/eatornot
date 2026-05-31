"""Metrics 服务 — 7 天模拟结果指标"""

from datetime import datetime, timedelta
from services.db_service import db_service
from services.memory_service import memory_service


class MetricsService:
    """结果指标服务"""

    async def get_demo_metrics(self, user_id: str = "demo-user") -> dict:
        """获取 7 天模拟结果指标"""
        meals = await db_service.get_meals(user_id, days=7)
        patterns = await memory_service.get_meal_patterns(user_id)

        # 计算各项指标
        meal_regular_score = self._calculate_meal_regular_score(meals)
        avg_lunch_delay = self._calculate_avg_lunch_delay(meals)
        budget_overrun = self._calculate_budget_overrun(meals, 35.0)  # 假设日预算35
        acceptance_rate = self._calculate_acceptance_rate()
        protein_gap_days = self._calculate_protein_gap_days(meals)
        late_night_orders = self._calculate_late_night_orders(meals)

        return {
            "meal_regular_score": {
                "before": 42,
                "after": meal_regular_score,
                "description": "饮食规律性评分",
            },
            "avg_lunch_delay_minutes": {
                "before": 145,
                "after": avg_lunch_delay,
                "description": "午餐平均延迟（分钟）",
            },
            "budget_overrun_count": {
                "before": 4,
                "after": budget_overrun,
                "description": "预算超支次数",
            },
            "recommendation_acceptance_rate": {
                "value": acceptance_rate,
                "description": "推荐采纳率",
            },
            "protein_gap_days": {
                "before": 5,
                "after": protein_gap_days,
                "description": "蛋白质不足天数",
            },
            "late_night_uncontrolled_orders": {
                "before": 3,
                "after": late_night_orders,
                "description": "深夜失控订单",
            },
        }

    def _calculate_meal_regular_score(self, meals: list) -> float:
        """计算饮食规律性评分"""
        if not meals:
            return 0

        # 检查每天是否按时用餐
        days_with_meals = set()
        on_time_count = 0
        total_count = 0

        for meal in meals:
            date = meal.timestamp.date()
            days_with_meals.add(date)
            total_count += 1

            # 检查是否按时（午餐在12-13点，晚餐在18-19点）
            hour = meal.timestamp.hour
            if meal.meal_type == "lunch" and 11 <= hour <= 13:
                on_time_count += 1
            elif meal.meal_type == "dinner" and 17 <= hour <= 19:
                on_time_count += 1

        if total_count == 0:
            return 0

        # 计算规律性评分
        regularity = on_time_count / total_count * 100
        return min(100, round(regularity))

    def _calculate_avg_lunch_delay(self, meals: list) -> float:
        """计算午餐平均延迟"""
        lunch_delays = []

        for meal in meals:
            if meal.meal_type == "lunch":
                hour = meal.timestamp.hour
                minute = meal.timestamp.minute
                # 假设正常午餐时间是12:00
                delay = max(0, (hour - 12) * 60 + minute)
                lunch_delays.append(delay)

        if not lunch_delays:
            return 0

        return round(sum(lunch_delays) / len(lunch_delays))

    def _calculate_budget_overrun(self, meals: list, daily_budget: float) -> int:
        """计算预算超支次数"""
        daily_spend = {}

        for meal in meals:
            date = meal.timestamp.date()
            if date not in daily_spend:
                daily_spend[date] = 0
            daily_spend[date] += meal.total_price

        overrun_count = 0
        for date, spent in daily_spend.items():
            if spent > daily_budget:
                overrun_count += 1

        return overrun_count

    def _calculate_acceptance_rate(self) -> float:
        """计算推荐采纳率（模拟）"""
        # 在实际系统中，这应该基于真实的推荐-采纳记录
        return 0.71

    def _calculate_protein_gap_days(self, meals: list) -> int:
        """计算蛋白质不足天数"""
        daily_protein = {}

        for meal in meals:
            date = meal.timestamp.date()
            if date not in daily_protein:
                daily_protein[date] = 0
            daily_protein[date] += meal.total_protein

        # 假设每日蛋白质目标是60g
        gap_days = 0
        for date, protein in daily_protein.items():
            if protein < 60:
                gap_days += 1

        return gap_days

    def _calculate_late_night_orders(self, meals: list) -> int:
        """计算深夜失控订单"""
        late_night_count = 0

        for meal in meals:
            hour = meal.timestamp.hour
            # 晚上10点后的订单
            if hour >= 22:
                late_night_count += 1

        return late_night_count


# 全局实例
metrics_service = MetricsService()
