"""Budget Service — tracks daily/weekly spending."""

from datetime import datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.meal_record import MealRecord


class BudgetService:
    """Tracks budget usage from meal records."""

    def __init__(self):
        # Import here to avoid circular imports
        from api.meal_routes import _meal_records
        self._records = _meal_records

    async def get_today_spent(self, user_id: str) -> float:
        """Get total spent today."""
        today = datetime.now().date()
        return sum(
            m.total_price for m in self._records
            if m.user_id == user_id and m.timestamp.date() == today
        )

    async def get_week_spent(self, user_id: str) -> float:
        """Get total spent this week (last 7 days)."""
        week_ago = datetime.now() - timedelta(days=7)
        return sum(
            m.total_price for m in self._records
            if m.user_id == user_id and m.timestamp >= week_ago
        )

    async def get_remaining_daily(self, user_id: str, daily_budget: float) -> float:
        """Get remaining daily budget."""
        spent = await self.get_today_spent(user_id)
        return max(0, daily_budget - spent)

    async def get_remaining_weekly(self, user_id: str, weekly_budget: float) -> float:
        """Get remaining weekly budget."""
        spent = await self.get_week_spent(user_id)
        return max(0, weekly_budget - spent)

    async def get_today_meals(self, user_id: str) -> list:
        """Get today's meal records."""
        today = datetime.now().date()
        return [m for m in self._records if m.user_id == user_id and m.timestamp.date() == today]
