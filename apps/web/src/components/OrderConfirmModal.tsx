import type { RecommendationPlan } from '../api/client'

export function OrderConfirmModal({
  plan,
  onConfirm,
  onClose,
}: {
  plan: RecommendationPlan
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>📋 确认订单</h2>
        <div className="modal-items">
          {plan.items.map((item, i) => (
            <div key={i} className="modal-item">
              <span>{item.name}</span>
              <span>¥{item.price.toFixed(0)} / {item.calories}kcal</span>
            </div>
          ))}
        </div>
        <div className="modal-summary">
          <div>总计: ¥{plan.estimated_price.toFixed(0)}</div>
          <div>总热量: {plan.estimated_calories.toFixed(0)} 千卡</div>
          <div>预算影响: {plan.budget_impact}</div>
          <div>放纵额度: {plan.indulgence_impact}</div>
        </div>
        {plan.safety_warnings.length > 0 && (
          <div className="modal-warnings">
            {plan.safety_warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-confirm" onClick={onConfirm}>确认下单</button>
        </div>
      </div>
    </div>
  )
}
