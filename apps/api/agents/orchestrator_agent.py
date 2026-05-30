"""Orchestrator Agent — 智能调度器，根据用户输入决定需要调用哪些 Agent"""

import asyncio
import logging
from agents.base import BaseAgent
from agents.profile_agent import ProfileAgent
from agents.weight_loss_agent import WeightLossAgent
from agents.nutrition_agent import NutritionAgent
from agents.budget_agent import BudgetAgent
from agents.craving_agent import CravingAgent
from agents.time_context_agent import TimeContextAgent
from agents.menu_agent import MenuAgent
from agents.safety_agent import SafetyAgent
from agents.future_simulation_agent import FutureSimulationAgent
from models.agent_result import AgentResult

logger = logging.getLogger(__name__)

# Agent 注册表
AGENT_REGISTRY = {
    "profile": ProfileAgent,
    "weight_loss": WeightLossAgent,
    "nutrition": NutritionAgent,
    "budget": BudgetAgent,
    "craving": CravingAgent,
    "time_context": TimeContextAgent,
    "safety": SafetyAgent,
    "future_simulation": FutureSimulationAgent,
}

# 关键词 → Agent 映射
KEYWORD_AGENT_MAP = {
    # 预算相关
    "预算": ["budget", "nutrition"],
    "便宜": ["budget", "nutrition"],
    "省钱": ["budget"],
    "花了多少": ["budget"],
    "budget": ["budget"],

    # 减脂相关
    "减脂": ["weight_loss", "nutrition", "profile"],
    "减肥": ["weight_loss", "nutrition", "profile"],
    "热量": ["weight_loss", "nutrition"],
    "卡路里": ["weight_loss", "nutrition"],
    "低卡": ["weight_loss", "nutrition"],

    # 情绪/食欲相关
    "累": ["craving", "time_context"],
    "疲惫": ["craving", "time_context"],
    "压力": ["craving"],
    "心情": ["craving"],
    "馋": ["craving"],
    "想吃": ["craving", "nutrition"],
    "饿": ["craving", "nutrition"],

    # 安全相关
    "过敏": ["safety"],
    "不要": ["safety"],
    "忌口": ["safety"],

    # 时间相关
    "赶时间": ["time_context"],
    "快": ["time_context"],
    "急": ["time_context"],
}

# 默认 Agent 组合（最少要跑的）
DEFAULT_AGENTS = ["profile", "menu"]


class OrchestratorAgent(BaseAgent):
    """智能调度器：分析用户输入，动态选择需要运行的 Agent"""

    agent_name = "Orchestrator Agent"

    async def run(self, context: dict) -> dict:
        """
        分析用户输入，决定需要运行哪些 Agent，然后并行执行。

        Returns:
            dict: {
                "selected_agents": list[str],  # 选中的 Agent 名称
                "results": list[AgentResult],   # Agent 执行结果
                "reason": str,                  # 选择原因
            }
        """
        message = context.get("message", "").lower()
        mode = context.get("mode", "long_term")

        # 1. 分析用户输入，选择 Agent
        selected = self._select_agents(message, mode)

        # 2. 始终包含 MenuAgent（获取菜品数据）
        if "menu" not in selected:
            selected.insert(0, "menu")

        logger.info(f"Orchestrator selected agents: {selected}")

        # 3. 并行运行选中的 Agent
        agents = []
        agent_names = []
        for name in selected:
            if name == "menu":
                agents.append(MenuAgent())
            elif name in AGENT_REGISTRY:
                agents.append(AGENT_REGISTRY[name]())
            agent_names.append(name)

        results = await asyncio.gather(*(a.run(context) for a in agents))

        # 4. 构建选择原因
        reason = self._build_reason(message, selected)

        return {
            "selected_agents": agent_names,
            "results": list(results),
            "reason": reason,
        }

    def _select_agents(self, message: str, mode: str) -> list[str]:
        """根据用户消息和模式选择需要的 Agent"""
        selected = set(DEFAULT_AGENTS)

        # 快速模式：只跑核心 Agent
        if mode == "quick":
            selected.update(["nutrition", "budget", "craving"])
            return list(selected)

        # 长期模式：根据关键词动态选择
        matched_agents = set()
        for keyword, agents in KEYWORD_AGENT_MAP.items():
            if keyword in message:
                matched_agents.update(agents)

        if matched_agents:
            selected.update(matched_agents)
        else:
            # 没有匹配到关键词，默认跑全套（但排除不必要的）
            selected.update([
                "profile",
                "nutrition",
                "budget",
                "craving",
                "safety",
            ])

        return list(selected)

    def _build_reason(self, message: str, selected: list[str]) -> str:
        """构建选择原因的可读描述"""
        reasons = []

        if "budget" in selected:
            if any(kw in message for kw in ["预算", "便宜", "省钱"]):
                reasons.append("检测到预算相关需求")
            else:
                reasons.append("检查预算约束")

        if "weight_loss" in selected:
            reasons.append("检测到减脂/热量相关需求")

        if "craving" in selected:
            if any(kw in message for kw in ["累", "疲惫", "压力"]):
                reasons.append("检测到情绪状态，评估食欲")
            else:
                reasons.append("评估食欲和情绪")

        if "safety" in selected:
            reasons.append("检查过敏/安全信息")

        if "time_context" in selected:
            reasons.append("考虑时间压力")

        if not reasons:
            reasons.append("进行全面分析")

        return "；".join(reasons)
