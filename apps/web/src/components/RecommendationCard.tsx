import type { RecommendationPlan } from '../api/client'

const modeLabels: Record<string, string> = {
  disciplined: '自律模式',
  budget_friendly: '省钱模式',
  controlled_indulgence: '放纵模式',
}

export function RecommendationCard({
  plan,
  selected,
  onSelect,
}: {
  plan: RecommendationPlan
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div className={`card plan-card ${selected ? 'selected' : ''}`}>
      <div className="plan-header">
        <h3>{plan.title}</h3>
        <span className="plan-mode">{modeLabels[plan.mode] || plan.mode}</span>
      </div>

      <div className="plan-items">
        {plan.items.map((item, i) => (
          <span key={i} className="plan-item-tag">{item.name}</span>
        ))}
      </div>

      <div className="plan-stats">
        <div>💰 ¥{plan.estimated_price.toFixed(0)}</div>
        <div>🔥 {plan.estimated_calories.toFixed(0)} 千卡</div>
        <div>💪 蛋白质 {plan.protein.toFixed(0)}克</div>
        <div>🧂 钠 {plan.sodium.toFixed(0)}毫克</div>
      </div>

      <div className="plan-impact">
        <span>{plan.budget_impact}</span>
        <span>{plan.calorie_impact}</span>
        <span>{plan.indulgence_impact}</span>
      </div>

      <div className="plan-pros-cons">
        <div className="pros">
          {plan.pros.map((p, i) => <span key={i} className="pro-tag">✅ {p}</span>)}
        </div>
        <div className="cons">
          {plan.cons.map((c, i) => <span key={i} className="con-tag">⚠️ {c}</span>)}
        </div>
      </div>

      <div className="plan-reason">{plan.final_reason}</div>

      <button className="btn-select" onClick={onSelect}>
        {selected ? '✓ 已选择' : '选择此方案'}
      </button>
    </div>
  )
}
