"""Memory Service — stores and retrieves user history and preferences."""

from datetime import datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.meal_record import MealRecord


class MemoryService:
    """Manages user meal history and preferences."""

    def __init__(self):
        from api.meal_routes import _meal_records, _feedback_records
        self._records = _meal_records
        self._feedback = _feedback_records

    async def get_recent_meals(self, user_id: str, days: int = 7) -> list:
        """Get recent meal records."""
        cutoff = datetime.now() - timedelta(days=days)
        return [m for m in self._records if m.user_id == user_id and m.timestamp >= cutoff]

    async def get_preferences(self, user_id: str) -> dict:
        """Infer preferences from meal history."""
        recent = await self.get_recent_meals(user_id, days=30)
        if not recent:
            return {"preferred_items": [], "avoided_items": []}

        # Count item frequency
        item_counts: dict[str, int] = {}
        for meal in recent:
            for item in meal.items:
                name = item.get("name", "unknown")
                item_counts[name] = item_counts.get(name, 0) + 1

        # Sort by frequency
        sorted_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)
        preferred = [name for name, count in sorted_items[:5]]

        return {"preferred_items": preferred, "avoided_items": []}

    async def save_feedback(self, user_id: str, meal_id: str, satisfaction: int, notes: str) -> None:
        """Save feedback for a meal."""
        from models.meal_record import MealRecord
        feedback = {
            "user_id": user_id,
            "meal_id": meal_id,
            "satisfaction": satisfaction,
            "notes": notes,
            "timestamp": datetime.now(),
        }
        self._feedback.append(feedback)

        # Update meal record satisfaction
        for meal in self._records:
            if meal.id == meal_id:
                meal.satisfaction = satisfaction
                meal.notes = notes
                break

    async def get_indulgence_count_this_week(self, user_id: str) -> int:
        """Count indulgence meals this week."""
        week_ago = datetime.now() - timedelta(days=7)
        count = 0
        for meal in self._records:
            if meal.user_id == user_id and meal.timestamp >= week_ago:
                if meal.plan_mode == "controlled_indulgence":
                    count += 1
        return count
