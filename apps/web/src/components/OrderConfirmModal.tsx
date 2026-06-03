import { useState } from 'react'
import { createOrder, type RecommendationPlan } from '../api/client'

export function OrderConfirmModal({
  plan,
  onClose,
  onOrderComplete,
}: {
  plan: RecommendationPlan
  onClose: () => void
  onOrderComplete: (result: { success: boolean; message: string }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [storeCode, setStoreCode] = useState('S001')

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await createOrder(plan, storeCode)
      onOrderComplete(result)
    } catch (err) {
      onOrderComplete({ success: false, message: '下单请求失败' })
    } finally {
      setLoading(false)
    }
  }

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
        </div>
        <div className="modal-store">
          <label>门店编码: </label>
          <input
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            placeholder="S001"
          />
        </div>
        {plan.safety_warnings.length > 0 && (
          <div className="modal-warnings">
            {plan.safety_warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>取消</button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? '下单中...' : '确认下单'}
          </button>
        </div>
      </div>
    </div>
  )
}
