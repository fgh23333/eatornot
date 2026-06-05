"""Mock 美团 Provider — 展示 FoodProvider 接口的扩展性"""

import uuid
from typing import Optional
from .base import FoodProvider, Store, FoodItem, ProviderStatus


# 模拟美团外卖菜品数据（常见中式快餐）
MOCK_MEITUAN_ITEMS = [
    # 主食
    {"name": "黄焖鸡米饭（大份）", "item_code": "MT001", "category": "主食", "price": 22,
     "calories": 680, "protein": 32, "fat": 18, "carbohydrate": 85, "sodium": 1200, "tags": ["高蛋白", "米饭"]},
    {"name": "红烧肉盖饭", "item_code": "MT002", "category": "主食", "price": 25,
     "calories": 750, "protein": 22, "fat": 35, "carbohydrate": 78, "sodium": 980, "tags": ["米饭", "下饭"]},
    {"name": "酸菜鱼米饭套餐", "item_code": "MT003", "category": "主食", "price": 28,
     "calories": 520, "protein": 35, "fat": 12, "carbohydrate": 55, "sodium": 1100, "tags": ["高蛋白", "酸辣"]},
    {"name": "番茄鸡蛋面", "item_code": "MT004", "category": "主食", "price": 16,
     "calories": 420, "protein": 14, "fat": 10, "carbohydrate": 62, "sodium": 680, "tags": ["面食", "清淡"]},
    {"name": "麻辣香锅（小份）", "item_code": "MT005", "category": "主食", "price": 32,
     "calories": 620, "protein": 28, "fat": 30, "carbohydrate": 48, "sodium": 1500, "tags": ["麻辣", "重口味"]},
    # 小食/配菜
    {"name": "凉拌黄瓜", "item_code": "MT006", "category": "小食", "price": 8,
     "calories": 45, "protein": 1, "fat": 2, "carbohydrate": 6, "sodium": 320, "tags": ["清淡", "低卡"]},
    {"name": "皮蛋豆腐", "item_code": "MT007", "category": "小食", "price": 10,
     "calories": 120, "protein": 8, "fat": 6, "carbohydrate": 5, "sodium": 450, "tags": ["清淡"]},
    {"name": "卤蛋", "item_code": "MT008", "category": "小食", "price": 3,
     "calories": 70, "protein": 6, "fat": 5, "carbohydrate": 1, "sodium": 380, "tags": ["高蛋白"]},
    # 饮品
    {"name": "冰红茶（大杯）", "item_code": "MT009", "category": "饮品", "price": 5,
     "calories": 120, "protein": 0, "fat": 0, "carbohydrate": 30, "sodium": 15, "tags": ["含糖"]},
    {"name": "酸梅汤", "item_code": "MT010", "category": "饮品", "price": 6,
     "calories": 80, "protein": 0, "fat": 0, "carbohydrate": 20, "sodium": 10, "tags": ["解腻"]},
    # 轻食
    {"name": "鸡胸肉沙拉", "item_code": "MT011", "category": "轻食", "price": 28,
     "calories": 280, "protein": 30, "fat": 8, "carbohydrate": 18, "sodium": 520, "tags": ["低脂", "高蛋白", "减脂首选"]},
    {"name": "藜麦蔬菜碗", "item_code": "MT012", "category": "轻食", "price": 32,
     "calories": 350, "protein": 15, "fat": 12, "carbohydrate": 42, "sodium": 380, "tags": ["健康", "饱腹"]},
]


class MockMeituanProvider(FoodProvider):
    """Mock 美团外卖 Provider — 展示 FoodProvider 接口的可扩展性"""

    def get_name(self) -> str:
        return "Mock 美团外卖"

    def get_mode(self) -> str:
        return "mock"

    async def health_check(self) -> ProviderStatus:
        return ProviderStatus(
            name=self.get_name(),
            mode=self.get_mode(),
            is_healthy=True,
            message="Mock 美团外卖 Provider ready (本地数据)",
        )

    async def list_stores(self, city: str = "南京", keyword: str = "") -> list[Store]:
        return [
            Store(store_id="MT_S001", name="老乡鸡（软件大道店）", distance_km=0.5, is_open=True),
            Store(store_id="MT_S002", name="沙县小吃（天隆寺店）", distance_km=0.3, is_open=True),
            Store(store_id="MT_S003", name="轻食日记（雨花客厅店）", distance_km=1.0, is_open=True),
        ]

    async def list_items(self, category: str = None) -> list[FoodItem]:
        items = MOCK_MEITUAN_ITEMS
        if category:
            items = [i for i in items if i.get("category") == category]
        return [self._to_food_item(i) for i in items]

    async def get_item_detail(self, item_code: str) -> Optional[FoodItem]:
        for item in MOCK_MEITUAN_ITEMS:
            if item.get("item_code") == item_code:
                return self._to_food_item(item)
        return None

    async def calculate_price(self, item_codes: list[str]) -> dict:
        items = []
        total = 0
        for code in item_codes:
            for i in MOCK_MEITUAN_ITEMS:
                if i.get("item_code") == code:
                    items.append(i)
                    total += i.get("price", 0)
                    break
        # 美团通常有配送费
        delivery_fee = 5 if total > 0 else 0
        return {
            "items": items,
            "total_price": total + delivery_fee,
            "food_price": total,
            "delivery_fee": delivery_fee,
        }

    async def create_order_draft(self, item_codes: list[str], store_id: str = None) -> dict:
        price_info = await self.calculate_price(item_codes)
        return {
            "draft_id": str(uuid.uuid4())[:8],
            "status": "draft",
            "items": price_info["items"],
            "total_price": price_info["total_price"],
            "delivery_fee": price_info.get("delivery_fee", 5),
            "is_mock": True,
            "platform": "meituan",
        }

    async def confirm_order(self, draft_id: str, confirmed: bool) -> dict:
        if confirmed:
            return {
                "order_id": f"MT-{uuid.uuid4().hex[:8]}",
                "status": "confirmed",
                "draft_id": draft_id,
                "message": "美团外卖订单已确认（Mock）",
                "is_mock": True,
            }
        return {"draft_id": draft_id, "status": "cancelled", "message": "订单已取消"}

    async def create_order(self, store_code: str, items: list[dict], order_type: int = 1,
                           take_way_code: str = None) -> dict:
        return {
            "success": True,
            "order_id": f"MT-{uuid.uuid4().hex[:8]}",
            "pay_url": "",
            "status": "pending_payment",
            "total_price": sum(i.get("price", 0) for i in items) + 5,  # +配送费
            "message": "美团外卖订单创建成功（Mock）",
            "is_mock": True,
        }

    def _to_food_item(self, data: dict) -> FoodItem:
        return FoodItem(
            name=data.get("name", ""),
            item_code=data.get("item_code", ""),
            category=data.get("category", "主食"),
            price=data.get("price", 0),
            calories=data.get("calories", 0),
            protein=data.get("protein", 0),
            fat=data.get("fat", 0),
            carbohydrate=data.get("carbohydrate", 0),
            sodium=data.get("sodium", 0),
            tags=data.get("tags", []),
        )
