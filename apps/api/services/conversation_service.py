"""对话状态管理服务"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ChatMessage:
    role: str  # user / assistant / system
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: dict = field(default_factory=dict)


class ConversationService:
    """管理多轮对话状态"""

    def __init__(self):
        self._conversations: dict[str, list[ChatMessage]] = {}  # user_id -> messages

    def add_message(self, user_id: str, role: str, content: str, metadata: dict = None) -> ChatMessage:
        """添加消息到对话历史"""
        if user_id not in self._conversations:
            self._conversations[user_id] = []

        msg = ChatMessage(role=role, content=content, metadata=metadata or {})
        self._conversations[user_id].append(msg)
        return msg

    def get_history(self, user_id: str, limit: int = 50) -> list[ChatMessage]:
        """获取对话历史"""
        messages = self._conversations.get(user_id, [])
        return messages[-limit:]

    def reset_conversation(self, user_id: str) -> bool:
        """重置对话历史"""
        if user_id in self._conversations:
            self._conversations[user_id] = []
            return True
        return False

    def reset_all(self) -> None:
        """清除所有对话"""
        self._conversations.clear()


# 全局实例
conversation_service = ConversationService()
