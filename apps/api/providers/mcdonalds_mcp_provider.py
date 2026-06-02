"""McDonald's MCP Provider — 使用真实麦当劳 MCP API"""

import uuid
import logging
from typing import Optional
from core.config import get_settings
from .base import FoodProvider, Store, FoodItem, ProviderStatus

logger = logging.getLogger(__name__)


class McDonaldsMcpProvider(FoodProvider):
    """McDonald's MCP Provider — 使用真实麦当劳 MCP API"""

    def __init__(self):
        self._settings = get_settings()

    def get_name(self) -> str:
        return "McDonald's MCP"

    def get_mode(self) -> str:
        return "real"

    async def health_check(self) -> ProviderStatus:
        """检查 MCP 服务是否可用"""
        if not self._settings.MCD_MCP_TOKEN:
            return ProviderStatus(
                name=self.get_name(),
                mode=self.get_mode(),
                is_healthy=False,
                message="MCD_MCP_TOKEN not configured",
            )

        try:
            # 尝试调用 MCP 获取菜单
            items = await self._call_mcp_tool("list-nutrition-foods")
            if items and len(items) > 0:
                return ProviderStatus(
                    name=self.get_name(),
                    mode=self.get_mode(),
                    is_healthy=True,
                    message=f"McDonald's MCP connected ({len(items)} items)",
                )
            else:
                return ProviderStatus(
                    name=self.get_name(),
                    mode=self.get_mode(),
                    is_healthy=False,
                    message="McDonald's MCP returned empty response",
                )
        except Exception as e:
            return ProviderStatus(
                name=self.get_name(),
                mode=self.get_mode(),
                is_healthy=False,
                message=f"McDonald's MCP error: {str(e)}",
            )

    async def list_stores(self) -> list[Store]:
        """查询附近门店"""
        try:
            result = await self._call_mcp_tool("query-nearby-stores")
            if result and isinstance(result, list):
                return [
                    Store(
                        store_id=s.get("store_id", ""),
                        name=s.get("name", ""),
                        distance_km=s.get("distance_km", 0),
                        is_open=s.get("is_open", True),
                    )
                    for s in result
                ]
        except Exception as e:
            logger.error(f"MCP list_stores error: {e}")

        # Fallback
        return [
            Store(store_id="S001", name="麦当劳（科技园店）", distance_km=0.8, is_open=True),
        ]

    async def list_items(self, category: str = None) -> list[FoodItem]:
        """查询菜单"""
        try:
            result = await self._call_mcp_tool("list-nutrition-foods")
            if result and isinstance(result, list) and len(result) > 0:
                items = [self._to_food_item(i) for i in result]
                if category:
                    items = [i for i in items if i.category == category]
                return items
            else:
                logger.warning("MCP returned empty list, falling back to mock")
                return await self._fallback_to_mock(category)
        except Exception as e:
            logger.error(f"MCP list_items error: {e}")
            return await self._fallback_to_mock(category)

    async def _fallback_to_mock(self, category: str = None) -> list[FoodItem]:
        """降级到 Mock 数据"""
        from .mock_mcdonalds_provider import MockMcDonaldsProvider
        mock = MockMcDonaldsProvider()
        return await mock.list_items(category)

    async def get_item_detail(self, item_code: str) -> Optional[FoodItem]:
        """查询菜品详情"""
        try:
            result = await self._call_mcp_tool("query-meal-detail", {"item_code": item_code})
            if result and isinstance(result, dict):
                return self._to_food_item(result)
        except Exception as e:
            logger.error(f"MCP get_item_detail error: {e}")

        return None

    async def calculate_price(self, item_codes: list[str]) -> dict:
        """计算价格"""
        try:
            result = await self._call_mcp_tool("calculate-price", {"items": item_codes})
            if result and isinstance(result, dict):
                return result
        except Exception as e:
            logger.error(f"MCP calculate_price error: {e}")

        return {"items": [], "total_price": 0}

    async def create_order_draft(self, item_codes: list[str], store_id: str = None) -> dict:
        """创建订单草稿"""
        try:
            result = await self._call_mcp_tool("create-order", {
                "items": item_codes,
                "store_id": store_id or "S001",
            })
            if result and isinstance(result, dict):
                return {
                    "draft_id": str(uuid.uuid4())[:8],
                    "status": "draft",
                    "items": result.get("items", []),
                    "total_price": result.get("total_price", 0),
                    "is_mock": False,
                }
        except Exception as e:
            logger.error(f"MCP create_order_draft error: {e}")

        return {"draft_id": "", "status": "error", "message": "MCP order creation failed"}

    async def confirm_order(self, draft_id: str, confirmed: bool) -> dict:
        """确认订单"""
        if confirmed:
            try:
                result = await self._call_mcp_tool("create-order", {"draft_id": draft_id})
                if result and isinstance(result, dict):
                    return {
                        "order_id": result.get("order_id", ""),
                        "status": "confirmed",
                        "draft_id": draft_id,
                        "message": "Order confirmed via McDonald's MCP",
                        "is_mock": False,
                    }
            except Exception as e:
                logger.error(f"MCP confirm_order error: {e}")

        return {
            "draft_id": draft_id,
            "status": "cancelled",
            "message": "Order cancelled by user.",
        }

    async def _call_mcp_tool(self, tool_name: str, args: dict = None) -> any:
        """调用 MCP 工具"""
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client

        url = self._settings.MCD_MCP_URL
        token = self._settings.MCD_MCP_TOKEN

        async with streamablehttp_client(url, headers={"Authorization": f"Bearer {token}"}) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, args or {})

                if hasattr(result, "content") and result.content:
                    first = result.content[0]
                    if hasattr(first, "text"):
                        import json
                        try:
                            return json.loads(first.text)
                        except json.JSONDecodeError:
                            return first.text

                return None

    def _to_food_item(self, data: dict) -> FoodItem:
        """将 dict 转换为 FoodItem"""
        return FoodItem(
            name=data.get("name", ""),
            item_code=data.get("item_code", ""),
            category=data.get("category", ""),
            price=data.get("price", 0),
            calories=data.get("calories", 0),
            protein=data.get("protein", 0),
            fat=data.get("fat", 0),
            carbohydrate=data.get("carbohydrate", 0),
            sodium=data.get("sodium", 0),
            tags=data.get("tags", []),
        )
