"""Round Table Debate Engine - 实现真正的多阶段辩论"""

import uuid
import logging
from models.agent_result import AgentResult
from models.debate import DebateMessage, DebateStage, DebateResult

logger = logging.getLogger(__name__)


class DebateEngine:
    """辩论引擎：将独立的 Agent 结果转化为多阶段辩论"""

    def run(self, agent_results: list[AgentResult], context: dict) -> DebateResult:
        """
        运行完整的辩论流程

        Args:
            agent_results: 各 Agent 的独立分析结果
            context: 上下文信息（用户、菜单等）

        Returns:
            DebateResult: 包含4个阶段的辩论结果
        """
        debate_id = str(uuid.uuid4())[:8]

        # Stage 1: 初始意见
        stage1 = self._stage_initial_opinions(agent_results)

        # Stage 2: 发现冲突
        stage2 = self._stage_conflicts(agent_results)

        # Stage 3: 形成妥协
        stage3 = self._stage_compromise(agent_results, context)

        # Stage 4: 最终投票
        stage4 = self._stage_final_vote(agent_results, stage3)

        return DebateResult(
            debate_id=debate_id,
            stages=[stage1, stage2, stage3, stage4],
        )

    def _stage_initial_opinions(self, results: list[AgentResult]) -> DebateStage:
        """Stage 1: 收集各 Agent 的初始意见"""
        messages = []

        for r in results:
            # 跳过菜单Agent（只是数据加载）
            if r.agent_name == "菜单Agent":
                continue

            # 构建立场陈述
            position = self._build_position(r)

            # 获取证据（独立于立场）
            evidence = self._get_evidence(r)

            msg = DebateMessage(
                agent=r.agent_name,
                position=position,
                evidence=evidence,
                confidence=abs(r.score),
            )
            messages.append(msg)

        return DebateStage(
            stage="initial_opinions",
            title="第一轮：各Agent初始判断",
            messages=messages,
        )

    def _stage_conflicts(self, results: list[AgentResult]) -> DebateStage:
        """Stage 2: 检测 Agent 之间的冲突"""
        messages = []

        # 过滤掉菜单Agent
        filtered = [r for r in results if r.agent_name != "菜单Agent"]

        # 比较每对 Agent 的 score 差异
        for i, r1 in enumerate(filtered):
            for r2 in filtered[i + 1:]:
                score_diff = abs(r1.score - r2.score)

                # 如果分数差异超过 0.4，认为存在冲突
                if score_diff > 0.4:
                    # 确定谁更积极，谁更保守
                    if r1.score > r2.score:
                        positive, conservative = r1, r2
                    else:
                        positive, conservative = r2, r1

                    conflict_msg = DebateMessage(
                        agent=positive.agent_name,
                        position=self._build_position(positive),
                        conflict_with=conservative.agent_name,
                        reason=self._build_conflict_reason(positive, conservative),
                        confidence=score_diff,
                    )
                    messages.append(conflict_msg)

        # 如果没有明显冲突，添加一条说明
        if not messages:
            messages.append(DebateMessage(
                agent="调度Agent",
                position="各Agent意见基本一致，无明显分歧",
                confidence=0.9,
            ))

        return DebateStage(
            stage="conflicts",
            title="第二轮：发现冲突",
            messages=messages,
        )

    def _stage_compromise(self, results: list[AgentResult], context: dict) -> DebateStage:
        """Stage 3: 形成妥协方案"""
        messages = []

        # 过滤掉菜单Agent
        filtered = [r for r in results if r.agent_name != "菜单Agent"]

        # 找出主要关切点
        concerns = []
        for r in filtered:
            if r.score < 0.3:  # 低分表示反对或担忧
                concerns.extend(r.warnings[:1] if r.warnings else r.reasons[:1])

        # 构建妥协方案
        compromise_position = self._build_compromise(filtered, context)

        # 确定哪些 Agent 会接受这个妥协
        accepting_agents = []
        for r in filtered:
            # 如果 Agent 不是强烈反对（score > 0.2），认为可以接受
            if r.score > 0.2:
                accepting_agents.append(r.agent_name)

        msg = DebateMessage(
            agent="调度Agent",
            position=compromise_position,
            accepted_by=accepting_agents,
            confidence=0.7,
        )
        messages.append(msg)

        return DebateStage(
            stage="compromise",
            title="第三轮：形成妥协",
            messages=messages,
        )

    def _stage_final_vote(self, results: list[AgentResult], compromise_stage: DebateStage) -> DebateStage:
        """Stage 4: 最终投票"""
        messages = []

        # 过滤掉菜单Agent
        filtered = [r for r in results if r.agent_name != "菜单Agent"]

        for r in filtered:
            # 根据 score 决定投票
            if r.score >= 0.5:
                vote = "approve"
                warning = None
            elif r.score >= 0.3:
                vote = "approve"
                warning = r.warnings[0] if r.warnings else "建议适量"
            else:
                vote = "warn"
                warning = r.warnings[0] if r.warnings else "需要谨慎"

            msg = DebateMessage(
                agent=r.agent_name,
                position=self._build_position(r),
                vote=vote,
                warning=warning,
                confidence=abs(r.score),
            )
            messages.append(msg)

        return DebateStage(
            stage="final_vote",
            title="第四轮：最终投票",
            messages=messages,
        )

    def _build_position(self, result: AgentResult) -> str:
        """构建 Agent 的立场陈述"""
        if result.reasons:
            return result.reasons[0]

        # 默认立场
        positions = {
            "档案Agent": "根据用户档案进行分析",
            "减脂Agent": "从减脂角度提供建议",
            "营养Agent": "从营养角度评估",
            "预算Agent": "从预算角度考虑",
            "食欲Agent": "考虑用户的情绪和食欲",
            "时间Agent": "考虑时间因素",
            "安全Agent": "检查安全和过敏信息",
            "未来模拟Agent": "模拟未来影响",
        }
        return positions.get(result.agent_name, "提供建议")

    def _get_evidence(self, result: AgentResult) -> list[str]:
        """获取 Agent 的证据来源"""
        # 从知识库获取证据（使用简单关键词匹配）
        from services.knowledge_service import get_evidence_for_agent
        evidence = get_evidence_for_agent(result.agent_name)

        # 如果有 warnings，也加入证据
        if result.warnings:
            evidence.append(result.warnings[0])

        return evidence[:2]  # 最多返回2条

    def _build_conflict_reason(self, positive: AgentResult, conservative: AgentResult) -> str:
        """构建冲突原因说明"""
        p_name = positive.agent_name
        c_name = conservative.agent_name

        reasons = {
            ("食欲Agent", "营养Agent"): "用户想吃好的，但营养Agent担心热量",
            ("食欲Agent", "减脂Agent"): "用户想放松，但减脂目标需要克制",
            ("预算Agent", "食欲Agent"): "预算有限，但用户想要满足感",
            ("营养Agent", "预算Agent"): "健康选择可能更贵",
        }

        key = (p_name, c_name)
        if key in reasons:
            return reasons[key]

        return f"{p_name}倾向积极选择，{c_name}倾向保守"

    def _build_compromise(self, results: list[AgentResult], context: dict) -> str:
        """构建妥协方案描述"""
        user = context.get("user")
        mood = context.get("mood", "normal")

        # 基于各 Agent 的意见构建妥协
        has_nutrition_concern = any(
            r.agent_name == "营养Agent" and r.score < 0.5
            for r in results
        )
        has_budget_concern = any(
            r.agent_name == "预算Agent" and r.score < 0.5
            for r in results
        )
        has_craving_need = any(
            r.agent_name == "食欲Agent" and r.score > 0.5
            for r in results
        )

        parts = ["综合各方意见："]

        if has_nutrition_concern and has_craving_need:
            parts.append("保留主食满足感，但选择更健康的配餐和零糖饮料")

        if has_budget_concern:
            parts.append("控制总价在预算范围内")

        if mood in ["tired", "stressed"]:
            parts.append("考虑到用户状态，允许适度放松")

        return "；".join(parts)
