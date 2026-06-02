import { useState, useEffect } from 'react'
import { fetchTodayStatus } from '../api/client'
import type { UserProfile } from '../api/client'

interface TodayStatus {
  date: string
  meals_count: number
  total_calories: number
  total_spent: number
  meals: Array<{
    total_calories: number
    total_protein: number
    total_fat: number
    total_carbs: number
    total_sodium: number
  }>
}

export function NutritionBalancePanel({ profile }: { profile: UserProfile }) {
  const [status, setStatus] = useState<TodayStatus | null>(null)

  useEffect(() => {
    fetchTodayStatus().then(setStatus)
  }, [])

  if (!status || status.meals_count === 0) {
    return (
      <div className="card nutrition-panel">
        <h3>🥗 今日营养</h3>
        <div className="nutrition-empty">还没有用餐记录</div>
      </div>
    )
  }

  // Calculate totals from all meals today
  const totals = status.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.total_calories,
      protein: acc.protein + m.total_protein,
      fat: acc.fat + m.total_fat,
      carbs: acc.carbs + m.total_carbs,
      sodium: acc.sodium + m.total_sodium,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 }
  )

  // Estimate daily targets based on profile (simplified)
  const dailyCalories = profile.goal === 'lose_weight' ? 1800 : profile.goal === 'gain_muscle' ? 2500 : 2000
  const calPct = Math.min(100, (totals.calories / dailyCalories) * 100)

  return (
    <div className="card nutrition-panel">
      <h3>🥗 今日营养</h3>
      <div className="nutrition-item">
        <span className="nutrition-label">热量</span>
        <div className="nutrition-bar">
          <div className="nutrition-fill" style={{ width: `${calPct}%` }} />
        </div>
        <span className="nutrition-value">{totals.calories.toFixed(0)} / {dailyCalories} 千卡</span>
      </div>
      <div className="nutrition-item">
        <span className="nutrition-label">蛋白质</span>
        <span className="nutrition-value">{totals.protein.toFixed(0)} 克</span>
      </div>
      <div className="nutrition-item">
        <span className="nutrition-label">脂肪</span>
        <span className="nutrition-value">{totals.fat.toFixed(0)} 克</span>
      </div>
      <div className="nutrition-item">
        <span className="nutrition-label">碳水</span>
        <span className="nutrition-value">{totals.carbs.toFixed(0)} 克</span>
      </div>
      <div className="nutrition-item">
        <span className="nutrition-label">钠</span>
        <span className="nutrition-value">{totals.sodium.toFixed(0)} 毫克</span>
      </div>
    </div>
  )
}
