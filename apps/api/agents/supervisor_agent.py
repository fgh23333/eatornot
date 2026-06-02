"""Supervisor Agent — orchestrates child agents via Orchestrator and builds recommendation plans."""

import uuid
import asyncio
import logging
from agents.orchestrator_agent import OrchestratorAgent
from agents.debate_engine import DebateEngine
from models.agent_result import AgentResult
from models.recommendation import RecommendationResponse, RecommendationPlan, MenuItem
from services.nutrition_calculator import calculate_bmr, calculate_tdee, get_daily_calorie_target

logger = logging.getLogger(__name__)


class SupervisorAgent:
    """Orchestrates child agents and produces recommendation plans."""

    async def run(self, context: dict) -> RecommendationResponse:
        # Use Orchestrator to intelligently select and run agents
        orchestrator = OrchestratorAgent()
        orchestration_result = await orchestrator.run(context)

        agent_debate = orchestration_result["results"]
        selected_agents = orchestration_result["selected_agents"]
        orchestration_reason = orchestration_result["reason"]

        logger.info(f"Orchestrator: {orchestration_reason}")
        logger.info(f"Selected agents: {selected_agents}")

        # Run Round Table Debate
        debate_engine = DebateEngine()
        debate_result = debate_engine.run(agent_debate, context)
        logger.info(f"Debate completed: {debate_result.debate_id}")

        # Build recommendation plans
        plans = self._build_plans(context.get("candidates", []), context["user"], agent_debate, context)

        # Collect safety warnings
        safety_warnings = []
        for agent in agent_debate:
            safety_warnings.extend(agent.warnings)

        # Build summary
        avg_score = sum(a.score for a in agent_debate) / len(agent_debate) if agent_debate else 0
        user = context["user"]
        goal_cn = {"lose_weight": "减脂", "maintain": "维持", "gain_muscle": "增肌"}.get(user.goal.value, user.goal.value)
        summary = f"根据您的档案（目标：{goal_cn}），{len(agent_debate)}位智囊已完成分析。"
        if avg_score > 0.5:
            summary += "整体建议：放心选择，注意均衡即可！"
        elif avg_score > 0.3:
            summary += "意见分歧，请根据您的优先级慎重选择。"
        else:
            summary += "智囊团建议重新考虑，或许来点更健康的？"

        return RecommendationResponse(
            user_id=user.user_id,
            plans=plans,
            agent_debate=agent_debate,
            debate=debate_result,
            summary=summary,
            safety_warnings=safety_warnings,
        )

    def _build_plans(self, candidates: list, user, agent_debate: list[AgentResult], context: dict) -> list[RecommendationPlan]:
        """Build 3 recommendation plans from candidates."""
        bmr = calculate_bmr(user.weight_kg, user.height_cm, user.age, user.sex)
        tdee = calculate_tdee(bmr, user.activity_level)
        daily_target = get_daily_calorie_target(tdee, user.goal.value)

        # 区分主食和饮料
        mains = [i for i in candidates if i.get("category") != "drink"]
        drinks = [i for i in candidates if i.get("category") == "drink"]

        # 按不同维度排序（只排序主食）
        by_cal = sorted(mains, key=lambda x: x["calories"])
        by_price = sorted(mains, key=lambda x: x["price"])
        by_taste = sorted(mains, key=lambda x: x.get("tags", []).count("popular"), reverse=True)

        # 饮料分类
        zero_drinks = [i for i in drinks if "zero_sugar" in i.get("tags", [])]
        cheap_drinks = [i for i in drinks if i["price"] < 10]

        def to_menu_item(d: dict) -> MenuItem:
            return MenuItem(
                name=d["name"],
                item_code=d["item_code"],
                category=d.get("category", ""),
                price=d["price"],
                calories=d["calories"],
                protein=d.get("protein", 0),
                fat=d.get("fat", 0),
                carbohydrate=d.get("carbohydrate", 0),
                sodium=d.get("sodium", 0),
                tags=d.get("tags", []),
            )

        def build_single_plan(mode: str, title: str, items: list, pros: list[str], cons: list[str], reason: str) -> RecommendationPlan:
            mi = [to_menu_item(i) for i in items]
            total_price = sum(i.price for i in mi)
            total_cal = sum(i.calories for i in mi)
            total_prot = sum(i.protein for i in mi)
            total_fat = sum(i.fat for i in mi)
            total_carb = sum(i.carbohydrate for i in mi)
            total_na = sum(i.sodium for i in mi)

            return RecommendationPlan(
                id=str(uuid.uuid4())[:8],
                title=title,
                mode=mode,
                items=mi,
                estimated_price=round(total_price, 2),
                estimated_calories=round(total_cal, 0),
                protein=round(total_prot, 1),
                fat=round(total_fat, 1),
                carbohydrate=round(total_carb, 1),
                sodium=round(total_na, 0),
                budget_impact=f"占日预算 {total_price / user.daily_budget * 100:.0f}%" if user.daily_budget > 0 else "N/A",
                calorie_impact=f"占日目标 {total_cal / daily_target * 100:.0f}%" if daily_target > 0 else "N/A",
                indulgence_impact="消耗1次本周放纵额度" if mode == "controlled_indulgence" else "不消耗放纵额度",
                pros=pros,
                cons=cons,
                safety_warnings=[],
                final_reason=reason,
            )

        # Plan 1: Disciplined — lowest calories main food + zero sugar drink
        disciplined_items = by_cal[:2]  # 取热量最低的 2 个主食
        if zero_drinks:
            disciplined_items.append(zero_drinks[0])

        plan1 = build_single_plan(
            "disciplined",
            "\U0001f4aa 自律减脂餐",
            disciplined_items,
            pros=["低热量", "高蛋白", "有助减脂目标"],
            cons=["饱腹感一般", "可能觉得不够满足"],
            reason="最适合您的减脂目标。烤制蛋白 + 零糖饮料，热量最低。",
        )

        # Plan 2: Budget-friendly — lowest price main food + cheap drink
        budget_items = by_price[:2]
        if cheap_drinks:
            budget_items.append(cheap_drinks[0])

        plan2 = build_single_plan(
            "budget_friendly",
            "\U0001f4b0 省钱包饱餐",
            budget_items,
            pros=["最实惠", "依然管饱", "适合预算紧张"],
            cons=["钠含量可能偏高", "种类较少"],
            reason="最高性价比。简单组合，吃饱不破费。",
        )

        # Plan 3: Controlled indulgence — popular items + indulgence sides
        indulgence_items = by_taste[:2]
        indulgence_sides = [i for i in candidates if "indulgence" in i.get("tags", [])]
        if indulgence_sides:
            indulgence_items.append(indulgence_sides[0])

        plan3 = build_single_plan(
            "controlled_indulgence",
            "\U0001f354 放纵一下餐",
            indulgence_items,
            pros=["最满足", "享受最爱", "心情加分"],
            cons=["热量较高", "消耗放纵额度", "可能超预算"],
            reason="偶尔犒劳自己！消耗1次本周放纵额度，明天注意均衡就好。",
        )

        return [plan1, plan2, plan3]
