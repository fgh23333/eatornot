interface ResetButtonsProps {
  onResetConversation: () => void
  onResetProfile: () => void
}

export function ResetButtons({ onResetConversation, onResetProfile }: ResetButtonsProps) {
  return (
    <div className="reset-buttons">
      <button onClick={onResetConversation} className="btn-reset btn-reset-conversation">
        🔄 重置对话
      </button>
      <button onClick={onResetProfile} className="btn-reset btn-reset-profile">
        👤 重置档案
      </button>
    </div>
  )
}
