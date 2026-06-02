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

            # 解析结果
            items_data = []
            if result and isinstance(result, list):
                items_data = result
            elif result and isinstance(result, dict) and "data" in result:
                data = result["data"]
                if isinstance(data, list):
                    items_data = data
                elif isinstance(data, str):
                    # 尝试解析 CSV 格式
                    parsed = self._parse_csv_items(data)
                    if parsed:
                        items_data = parsed

            if items_data and len(items_data) > 0:
                items = [self._to_food_item(i) for i in items_data]
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
        logger.warning("Falling back to Mock data because MCP returned empty or failed")
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
        import json
        import re
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
                        text = first.text

                        # 尝试直接解析 JSON
                        try:
                            return json.loads(text)
                        except json.JSONDecodeError:
                            pass

                        # 尝试从文本中提取 JSON
                        json_match = re.search(r'\{.*\}', text, re.DOTALL)
                        if json_match:
                            try:
                                return json.loads(json_match.group())
                            except json.JSONDecodeError:
                                pass

                        # 如果是 CSV 格式的数据
                        if text.startswith('[') and '{' in text:
                            return self._parse_csv_items(text)

                        return text

                return None

    def _parse_csv_items(self, csv_text: str) -> list[dict]:
        """解析 CSV 格式的菜品数据

        格式示例:
        [160]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:
          麦辣鸡腿堡,null,1288,308,16,16,24,781,213
          巨无霸,null,1618,387,23,21,25,846,243
        """
        import re
        items = []
        lines = csv_text.strip().split('\n')

        if len(lines) < 2:
            return items

        # 第一行是表头: [160]{productName,...}:
        header_line = lines[0]
        # 提取表头字段
        header_match = re.search(r'\{(.+?)\}', header_line)
        if not header_match:
            return items

        headers = [h.strip() for h in header_match.group(1).split(',')]

        # 解析数据行
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue

            values = [v.strip() for v in line.split(',')]
            if len(values) >= len(headers):
                item = {}
                for i, header in enumerate(headers):
                    value = values[i] if i < len(values) else ''
                    # 转换数值类型
                    if value == 'null' or value == '':
                        item[header] = None
                    else:
                        try:
                            if '.' in value:
                                item[header] = float(value)
                            else:
                                item[header] = int(value)
                        except ValueError:
                            item[header] = value

                # 转换为标准格式
                product_name = item.get('productName', '')
                if product_name and product_name != 'null':
                    items.append({
                        'name': product_name,
                        'item_code': f'MCD_{len(items)+1:03d}',
                        'category': 'main',
                        'price': 0,  # MCP 不返回价格
                        'calories': item.get('energyKcal', 0) or 0,
                        'protein': item.get('protein', 0) or 0,
                        'fat': item.get('fat', 0) or 0,
                        'carbohydrate': item.get('carbohydrate', 0) or 0,
                        'sodium': item.get('sodium', 0) or 0,
                        'tags': [],
                    })

        return items

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
