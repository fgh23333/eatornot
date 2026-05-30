"""Menu Agent — fetches menu data from MCP or mock."""

from agents.base import BaseAgent
from models.agent_result import AgentResult
from core.config import get_settings


class MenuAgent(BaseAgent):
    agent_name = "菜单Agent"

    async def run(self, context: dict) -> AgentResult:
        settings = get_settings()

        if settings.USE_MOCK_MCP:
            from services.mock_mcdonalds_mcp import list_nutrition_foods, query_nearby_stores
            items = list_nutrition_foods()
            stores = query_nearby_stores()
            source = "mock"
        else:
            # Real MCP would go here
            from services.mock_mcdonalds_mcp import list_nutrition_foods, query_nearby_stores
            items = list_nutrition_foods()
            stores = query_nearby_stores()
            source = "mock_fallback"

        # Update candidates in context
        context["candidates"] = items

        return AgentResult(
            agent_name=self.agent_name,
            score=0.5,
            decision="approve",
            reasons=[f"已加载 {len(items)} 个菜品（{source}）", f"附近 {len(stores)} 家门店"],
            data={"items_count": len(items), "stores_count": len(stores), "source": source},
        )
