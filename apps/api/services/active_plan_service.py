"""ActivePlan 版本管理服务"""

import uuid
from models.active_plan import ActivePlan, ChangeLogEntry
from models.recommendation import MenuItem


class ActivePlanService:
    """管理 ActivePlan 的创建、更新和版本控制"""

    def __init__(self):
        self._plans: dict[str, ActivePlan] = {}  # plan_id -> ActivePlan

    def create_plan(self, title: str, mode: str, items: list[MenuItem],
                    reasons: list[str], tradeoffs: list[str]) -> ActivePlan:
        """从推荐方案创建新的 ActivePlan"""
        plan_id = str(uuid.uuid4())[:8]

        # 计算营养总量
        nutrition = {
            "calories": sum(i.calories for i in items),
            "protein": sum(i.protein for i in items),
            "fat": sum(i.fat for i in items),
            "carbs": sum(i.carbohydrate for i in items),
            "sodium": sum(i.sodium for i in items),
        }
        price = sum(i.price for i in items)

        plan = ActivePlan(
            plan_id=plan_id,
            version=1,
            items=items,
            nutrition=nutrition,
            price=price,
            reasons=reasons,
            tradeoffs=tradeoffs,
            title=title,
            mode=mode,
        )
        self._plans[plan_id] = plan
        return plan

    def get_plan(self, plan_id: str) -> ActivePlan | None:
        return self._plans.get(plan_id)

    def refine_plan(self, plan_id: str, new_items: list[MenuItem],
                    what_changed: str, why: str, constraints: list[str]) -> ActivePlan | None:
        """精炼方案，创建新版本"""
        plan = self._plans.get(plan_id)
        if not plan:
            return None

        # 计算新营养总量
        new_nutrition = {
            "calories": sum(i.calories for i in new_items),
            "protein": sum(i.protein for i in new_items),
            "fat": sum(i.fat for i in new_items),
            "carbs": sum(i.carbohydrate for i in new_items),
            "sodium": sum(i.sodium for i in new_items),
        }
        new_price = sum(i.price for i in new_items)

        # 计算 delta
        calories_delta = new_nutrition["calories"] - plan.nutrition["calories"]
        price_delta = new_price - plan.price
        protein_delta = new_nutrition["protein"] - plan.nutrition["protein"]
        fat_delta = new_nutrition["fat"] - plan.nutrition["fat"]
        sodium_delta = new_nutrition["sodium"] - plan.nutrition["sodium"]
        carbs_delta = new_nutrition["carbs"] - plan.nutrition["carbs"]

        # 构建影响描述
        impact_parts = []
        if calories_delta != 0:
            impact_parts.append(f"热量{'增加' if calories_delta > 0 else '减少'}{abs(calories_delta):.0f}千卡")
        if price_delta != 0:
            impact_parts.append(f"价格{'增加' if price_delta > 0 else '减少'}¥{abs(price_delta):.0f}")
        impact = "，".join(impact_parts) if impact_parts else "无明显变化"

        # 添加变更日志
        change = ChangeLogEntry(
            version=plan.version + 1,
            what_changed=what_changed,
            why=why,
            impact=impact,
            calories_delta=calories_delta,
            price_delta=price_delta,
            protein_delta=protein_delta,
            fat_delta=fat_delta,
            sodium_delta=sodium_delta,
            carbs_delta=carbs_delta,
        )

        # 更新方案
        plan.version += 1
        plan.items = new_items
        plan.nutrition = new_nutrition
        plan.price = new_price
        plan.change_log.append(change)
        plan.constraints = constraints

        return plan

    def reset_plan(self, plan_id: str) -> bool:
        """删除方案"""
        if plan_id in self._plans:
            del self._plans[plan_id]
            return True
        return False

    def reset_all(self) -> None:
        """清除所有方案"""
        self._plans.clear()


# 全局实例
active_plan_service = ActivePlanService()
