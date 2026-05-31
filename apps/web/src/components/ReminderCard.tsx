import { useState, useEffect } from 'react'

interface ReminderButton {
  action: string
  label: string
}

interface Reminder {
  reminder_id: string
  type: string
  title: string
  message: string
  urgency: string
  suggested_action: string
  meal_type: string
  buttons: ReminderButton[]
}

interface ReminderCardProps {
  userId?: string
  onAccept?: (reminder: Reminder) => void
  onSnooze?: (reminderId: string) => void
  onDismiss?: (reminderId: string) => void
}

export function ReminderCard({ userId = 'demo-user', onAccept, onSnooze, onDismiss }: ReminderCardProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchReminders()
    // 每5分钟检查一次提醒
    const interval = setInterval(fetchReminders, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchReminders = async () => {
    try {
      const res = await fetch(`/api/reminders?user_id=${userId}`)
      const data = await res.json()
      // 过滤掉已忽略的提醒
      const filtered = (data.reminders || []).filter(
        (r: Reminder) => !dismissedIds.has(r.reminder_id)
      )
      setReminders(filtered)
    } catch (err) {
      console.error('Failed to fetch reminders:', err)
    }
    setLoading(false)
  }

  const handleAccept = async (reminder: Reminder) => {
    try {
      const res = await fetch(`/api/reminders/${reminder.reminder_id}/accept`, {
        method: 'POST',
      })
      const data = await res.json()
      onAccept?.(reminder)
      // 移除已接受的提醒
      setReminders(prev => prev.filter(r => r.reminder_id !== reminder.reminder_id))
    } catch (err) {
      console.error('Failed to accept reminder:', err)
    }
  }

  const handleSnooze = async (reminderId: string) => {
    try {
      await fetch(`/api/reminders/${reminderId}/snooze`, {
        method: 'POST',
      })
      onSnooze?.(reminderId)
      // 移除已推迟的提醒
      setReminders(prev => prev.filter(r => r.reminder_id !== reminderId))
    } catch (err) {
      console.error('Failed to snooze reminder:', err)
    }
  }

  const handleDismiss = async (reminderId: string) => {
    try {
      await fetch(`/api/reminders/${reminderId}/dismiss`, {
        method: 'POST',
      })
      onDismiss?.(reminderId)
      // 添加到已忽略列表
      setDismissedIds(prev => new Set([...prev, reminderId]))
      setReminders(prev => prev.filter(r => r.reminder_id !== reminderId))
    } catch (err) {
      console.error('Failed to dismiss reminder:', err)
    }
  }

  if (loading || reminders.length === 0) {
    return null
  }

  const urgencyColors: Record<string, string> = {
    high: 'var(--red)',
    normal: 'var(--yellow)',
    low: 'var(--text-light)',
  }

  const typeIcons: Record<string, string> = {
    meal_time: '⏰',
    missed_meal: '🍽️',
    long_gap_without_food: '⏱️',
    nutrition_gap: '🥗',
    budget_available: '💰',
    late_night_warning: '🌙',
  }

  return (
    <div className="reminder-cards">
      {reminders.map((reminder) => (
        <div
          key={reminder.reminder_id}
          className="card reminder-card"
          style={{ borderLeftColor: urgencyColors[reminder.urgency] || 'var(--primary)' }}
        >
          <div className="reminder-header">
            <span className="reminder-icon">
              {typeIcons[reminder.type] || '💡'}
            </span>
            <span className="reminder-title">{reminder.title}</span>
          </div>

          <p className="reminder-message">{reminder.message}</p>

          <div className="reminder-actions">
            <button
              className="btn-reminder accept"
              onClick={() => handleAccept(reminder)}
            >
              帮我搭配
            </button>
            <button
              className="btn-reminder snooze"
              onClick={() => handleSnooze(reminder.reminder_id)}
            >
              稍后提醒
            </button>
            <button
              className="btn-reminder dismiss"
              onClick={() => handleDismiss(reminder.reminder_id)}
            >
              今天不吃了
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
