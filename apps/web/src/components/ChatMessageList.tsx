export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

interface ChatMessageListProps {
  messages: ChatMessage[]
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  if (messages.length === 0) return null

  return (
    <div className="chat-messages">
      {messages.map((msg, i) => (
        <div key={i} className={`chat-bubble ${msg.role}`}>
          <div className="chat-content">{msg.content}</div>
        </div>
      ))}
    </div>
  )
}
