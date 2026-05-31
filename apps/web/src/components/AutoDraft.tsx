import { useState, useEffect } from 'react'

interface DraftItem {
  name: string
  item_code: string
  price: number
  calories: number
  protein: number
  fat: number
  carbohydrate: number
  sodium: number
}

interface AutoDraftData {
  draft_id: string
  meal_type: string
  items: DraftItem[]
  total_price: number
  nutrition: {
    calories: number
    protein: number
    fat: number
    carbs: number
    sodium: number
  }
  reasons: string[]
  status: string
}

interface AutoDraftProps {
  userId?: string
  mealType?: string
  onConfirm?: (draft: AutoDraftData) => void
}

export function AutoDraft({ userId = 'demo-user', mealType, onConfirm }: AutoDraftProps) {
  const [draft, setDraft] = useState<AutoDraftData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDraft = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = mealType
        ? `/api/draft/auto?user_id=${userId}&meal_type=${mealType}`
        : `/api/draft/auto?user_id=${userId}`
      const res = await fetch(url)
      const data = await res.json()
      setDraft(data)
    } catch (err) {
      setError('获取订单草稿失败')
      console.error('Failed to fetch auto draft:', err)
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!draft) return

    try {
      const res = await fetch('/api/draft/auto/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...draft,
        }),
      })
      const result = await res.json()
      onConfirm?.(draft)
    } catch (err) {
      setError('确认订单失败')
      console.error('Failed to confirm draft:', err)
    }
  }

  if (loading) {
    return <div className="card auto-draft-card">正在搭配...</div>
  }

  if (error) {
    return (
      <div className="card auto-draft-card">
        <div className="draft-error">{error}</div>
        <button className="btn-retry" onClick={fetchDraft}>重试</button>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="card auto-draft-card">
        <h3>🤖 自动搭配</h3>
        <p className="draft-hint">根据您的状态自动搭配一餐</p>
        <button className="btn-generate" onClick={fetchDraft}>
          生成搭配
        </button>
      </div>
    )
  }

  const mealTypeNames: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  }

  return (
    <div className="card auto-draft-card">
      <div className="draft-header">
        <h3>🤖 自动搭配</h3>
        <span className="draft-meal-type">{mealTypeNames[draft.meal_type] || draft.meal_type}</span>
      </div>

      {/* 菜品列表 */}
      <div className="draft-items">
        {draft.items.map((item, i) => (
          <div key={i} className="draft-item">
            <span className="item-name">{item.name}</span>
            <span className="item-price">¥{item.price}</span>
            <span className="item-calories">{item.calories}千卡</span>
          </div>
        ))}
      </div>

      {/* 营养汇总 */}
      <div className="draft-nutrition">
        <span>总计: ¥{draft.total_price}</span>
        <span>{draft.nutrition.calories} 千卡</span>
        <span>蛋白质 {draft.nutrition.protein}g</span>
      </div>

      {/* 推荐理由 */}
      <div className="draft-reasons">
        {draft.reasons.map((reason, i) => (
          <span key={i} className="reason-tag">{reason}</span>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="draft-actions">
        <button className="btn-refresh" onClick={fetchDraft}>
          🔄 换一组
        </button>
        <button className="btn-confirm" onClick={handleConfirm}>
          ✅ 确认下单
        </button>
      </div>
    </div>
  )
}
