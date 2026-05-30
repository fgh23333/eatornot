import { useState, useEffect } from 'react'
import { fetchTodayStatus } from '../api/client'

interface TodayStatus {
  date: string
  meals_count: number
  total_calories: number
  total_spent: number
}

export function BudgetBar({ dailyBudget }: { dailyBudget: number }) {
  const [status, setStatus] = useState<TodayStatus | null>(null)

  useEffect(() => {
    fetchTodayStatus().then(setStatus)
  }, [])

  if (!status) return null

  const spent = status.total_spent
  const remaining = Math.max(0, dailyBudget - spent)
  const pct = Math.min(100, (spent / dailyBudget) * 100)

  return (
    <div className="card budget-bar">
      <h3>💰 今日预算</h3>
      <div className="budget-progress">
        <div className="budget-progress-bar">
          <div
            className="budget-progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="budget-labels">
          <span>已花 ¥{spent.toFixed(0)}</span>
          <span>剩余 ¥{remaining.toFixed(0)}</span>
        </div>
      </div>
      <div className="budget-total">
        日预算: ¥{dailyBudget}
      </div>
      <div className="budget-meals">
        今日已吃 {status.meals_count} 顿，共 {status.total_calories.toFixed(0)} kcal
      </div>
    </div>
  )
}
