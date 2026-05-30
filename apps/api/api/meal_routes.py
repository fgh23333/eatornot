"""Meal recording, feedback, and today's status routes."""

from datetime import datetime
from fastapi import APIRouter
from models.meal_record import MealRecord
from services.memory_service import MemoryService

router = APIRouter()

# In-memory store for Phase 1 (Phase 2: SQLite)
_meal_records: list[MealRecord] = []
_feedback_records: list[dict] = []


def record_meal_internal(record: MealRecord) -> MealRecord:
    """Internal function to save meal record (callable from other modules)."""
    record.id = f"meal-{len(_meal_records) + 1:04d}"
    if not record.timestamp:
        record.timestamp = datetime.now()
    _meal_records.append(record)
    return record


@router.post("/meal/record", response_model=MealRecord)
async def record_meal(record: MealRecord):
    """Save a meal record."""
    return record_meal_internal(record)


@router.get("/today/status")
async def get_today_status():
    """Get today's calorie, budget, and indulgence summary."""
    today = datetime.now().date()
    today_meals = [m for m in _meal_records if m.timestamp.date() == today]

    total_calories = sum(m.total_calories for m in today_meals)
    total_price = sum(m.total_price for m in today_meals)

    return {
        "date": today.isoformat(),
        "meals_count": len(today_meals),
        "total_calories": round(total_calories, 0),
        "total_spent": round(total_price, 2),
        "meals": [m.model_dump() for m in today_meals],
    }


@router.get("/meal/history")
async def get_meal_history(user_id: str = "demo-user", days: int = 7):
    """Get meal history for a user."""
    memory = MemoryService()
    meals = await memory.get_recent_meals(user_id, days)
    return {
        "user_id": user_id,
        "days": days,
        "meals_count": len(meals),
        "meals": [m.model_dump() for m in meals],
    }


@router.post("/feedback")
async def submit_feedback(feedback: dict):
    """Submit post-meal satisfaction feedback. Triggers Reflection Agent."""
    from agents.reflection_agent import ReflectionAgent

    meal_id = feedback.get("meal_id", "")
    satisfaction = feedback.get("satisfaction", 3)
    notes = feedback.get("notes", "")

    # Run Reflection Agent
    reflection = ReflectionAgent()
    result = await reflection.run({
        "meal_id": meal_id,
        "satisfaction": satisfaction,
        "notes": notes,
        "memory_service": MemoryService(),
    })

    return {
        "status": "recorded",
        "message": "Thanks for your feedback! I'll use this to improve future recommendations.",
        "reflection": {
            "insight": result.reasons[0] if result.reasons else "",
            "adjustment": result.data.get("adjustment", "none"),
            "score": result.score,
        },
    }
