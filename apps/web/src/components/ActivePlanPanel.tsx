import { useState } from 'react'
import type { RecommendationPlan } from '../api/client'

interface ChangeLogEntry {
  version: number
  what_changed: string
  why: string
  impact: string
  calories_delta?: number
  price_delta?: number
  protein_delta?: number
  fat_delta?: number
  sodium_delta?: number
  carbs_delta?: number
}

interface ActivePlanPanelProps {
  plan: RecommendationPlan & {
    version?: number
    change_log?: ChangeLogEntry[]
  }
  onRefine: (message: string) => void
  onConfirm: () => void
}

export function ActivePlanPanel({ plan, onRefine, onConfirm }: ActivePlanPanelProps) {
  const [refineInput, setRefineInput] = useState('')

  const handleRefine = () => {
    if (refineInput.trim()) {
      onRefine(refineInput.trim())
      setRefineInput('')
    }
  }

  return (
    <div className="card active-plan-panel">
      <div className="active-plan-header">
        <h3>📋 当前方案</h3>
        <span className="plan-version">v{plan.version || 1}</span>
      </div>

      <div className="active-plan-title">{plan.title}</div>

      <div className="active-plan-items">
        {plan.items.map((item, i) => (
          <span key={i} className="plan-item-tag">{item.name}</span>
        ))}
      </div>

      <div className="active-plan-stats">
        <span>💰 ¥{plan.estimated_price.toFixed(0)}</span>
        <span>🔥 {plan.estimated_calories.toFixed(0)} 千卡</span>
        <span>💪 {plan.protein.toFixed(0)} 克蛋白质</span>
      </div>

      {/* 变更日志 */}
      {plan.change_log && plan.change_log.length > 0 && (
        <div className="change-log">
          <h4>📝 修改记录</h4>
          {plan.change_log.map((log, i) => (
            <div key={i} className="change-entry">
              <div className="change-header">
                <span className="change-version">v{log.version}</span>
                <span className="change-what">{log.what_changed}</span>
              </div>
              <div className="change-delta">
                {log.calories_delta !== 0 && (
                  <span className={`delta ${log.calories_delta! > 0 ? 'increase' : 'decrease'}`}>
                    🔥 {log.calories_delta! > 0 ? '+' : ''}{log.calories_delta?.toFixed(0)} 千卡
                  </span>
                )}
                {log.price_delta !== 0 && (
                  <span className={`delta ${log.price_delta! > 0 ? 'increase' : 'decrease'}`}>
                    💰 {log.price_delta! > 0 ? '+' : ''}¥{log.price_delta?.toFixed(0)}
                  </span>
                )}
                {log.protein_delta !== 0 && (
                  <span className={`delta ${log.protein_delta! > 0 ? 'increase' : 'decrease'}`}>
                    💪 {log.protein_delta! > 0 ? '+' : ''}{log.protein_delta?.toFixed(0)}g
                  </span>
                )}
              </div>
              <div className="change-impact">{log.impact}</div>
            </div>
          ))}
        </div>
      )}

      {/* 精炼输入 */}
      <div className="refine-input">
        <input
          type="text"
          value={refineInput}
          onChange={(e) => setRefineInput(e.target.value)}
          placeholder="想修改什么？如：不要咖啡换成可乐"
          onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
        />
        <button onClick={handleRefine} className="btn-refine">修改</button>
      </div>

      <button onClick={onConfirm} className="btn-confirm-plan">
        🛒 确认下单
      </button>
    </div>
  )
}
