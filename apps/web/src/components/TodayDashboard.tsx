import { useState, useEffect } from 'react'

interface MealStatus {
  recorded: boolean
  calories: number
  price: number
  time: string | null
}

interface DashboardData {
  date: string
  time: string
  meal_status: {
    breakfast: MealStatus
    lunch: MealStatus
    dinner: MealStatus
  }
  nutrition: {
    calories: number
    target: number
    gap: number
    protein: number
    fat: number
    carbs: number
    sodium: number
  }
  budget: {
    daily: number
    spent: number
    remaining: number
  }
  last_meal: {
    hours_ago: number | null
    time: string | null
  }
  next_meal_suggestion: {
    meal_type: string | null
    urgency: string
    calorie_budget: number
    price_budget: number
    reasons: string[]
    message: string
  }
}

interface TodayDashboardProps {
  userId?: string
  onRequestRecommend?: (mealType: string) => void
}

export function TodayDashboard({ userId = 'demo-user', onRequestRecommend }: TodayDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [userId])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard?user_id=${userId}`)
      const data = await res.json()
      setDashboard(data)
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    }
    setLoading(false)
  }

  if (loading || !dashboard) {
    return <div className="card dashboard-card">加载中...</div>
  }

  const mealIcons: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
  }

  const mealNames: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
  }

  const urgencyColors: Record<string, string> = {
    high: 'var(--red)',
    normal: 'var(--yellow)',
    low: 'var(--text-light)',
    none: 'var(--green)',
  }

  return (
    <div className="card dashboard-card">
      <div className="dashboard-header">
        <h3>📊 今日饮食</h3>
        <span className="dashboard-time">{dashboard.time}</span>
      </div>

      {/* 三餐状态 */}
      <div className="meals-status">
        {['breakfast', 'lunch', 'dinner'].map((meal) => {
          const status = dashboard.meal_status[meal as keyof typeof dashboard.meal_status]
          return (
            <div key={meal} className={`meal-status ${status.recorded ? 'recorded' : 'pending'}`}>
              <div className="meal-icon">{mealIcons[meal]}</div>
              <div className="meal-info">
                <div className="meal-name">{mealNames[meal]}</div>
                {status.recorded ? (
                  <div className="meal-recorded">
                    <span className="meal-time">{status.time}</span>
                    <span className="meal-cal">{status.calories}千卡</span>
                  </div>
                ) : (
                  <div className="meal-pending">未记录</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 距离上次进食 */}
      {dashboard.last_meal.hours_ago !== null && (
        <div className="last-meal-info">
          <span className="last-meal-label">距离上次进食:</span>
          <span className="last-meal-time">
            {dashboard.last_meal.hours_ago < 1
              ? `${Math.round(dashboard.last_meal.hours_ago * 60)} 分钟`
              : `${dashboard.last_meal.hours_ago.toFixed(1)} 小时`}
          </span>
        </div>
      )}

      {/* 营养进度 */}
      <div className="nutrition-progress">
        <div className="progress-item">
          <div className="progress-label">
            <span>热量</span>
            <span>{dashboard.nutrition.calories} / {dashboard.nutrition.target} 千卡</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill calorie"
              style={{ width: `${Math.min(100, (dashboard.nutrition.calories / dashboard.nutrition.target) * 100)}%` }}
            />
          </div>
          {dashboard.nutrition.gap > 0 && (
            <div className="progress-gap">缺口 {dashboard.nutrition.gap} 千卡</div>
          )}
        </div>

        <div className="progress-item">
          <div className="progress-label">
            <span>预算</span>
            <span>¥{dashboard.budget.spent} / ¥{dashboard.budget.daily}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill budget"
              style={{ width: `${Math.min(100, (dashboard.budget.spent / dashboard.budget.daily) * 100)}%` }}
            />
          </div>
          <div className="progress-remaining">剩余 ¥{dashboard.budget.remaining}</div>
        </div>
      </div>

      {/* 下一餐建议 */}
      {dashboard.next_meal_suggestion.meal_type && (
        <div className="next-meal-suggestion" style={{ borderLeftColor: urgencyColors[dashboard.next_meal_suggestion.urgency] }}>
          <div className="suggestion-header">
            <span className="suggestion-icon">💡</span>
            <span className="suggestion-message">{dashboard.next_meal_suggestion.message}</span>
          </div>
          <div className="suggestion-details">
            <span>建议热量: {dashboard.next_meal_suggestion.calorie_budget} 千卡</span>
            <span>建议预算: ¥{dashboard.next_meal_suggestion.price_budget}</span>
          </div>
          {dashboard.next_meal_suggestion.reasons.length > 0 && (
            <div className="suggestion-reasons">
              {dashboard.next_meal_suggestion.reasons.map((reason, i) => (
                <span key={i} className="reason-tag">{reason}</span>
              ))}
            </div>
          )}
          <button
            className="btn-suggestion"
            onClick={() => onRequestRecommend?.(dashboard.next_meal_suggestion.meal_type!)}
          >
            开始推荐
          </button>
        </div>
      )}
    </div>
  )
}
