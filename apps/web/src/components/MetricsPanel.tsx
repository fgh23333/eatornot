import { useState, useEffect } from 'react'

interface MetricItem {
  current: number
  description: string
  calculation: string
}

interface MetricsData {
  is_simulated: boolean
  simulated_note: string
  meal_regular_score: MetricItem
  avg_lunch_delay_minutes: MetricItem
  budget_overrun_count: MetricItem
  recommendation_acceptance_rate: MetricItem
  protein_gap_days: MetricItem
  late_night_orders: MetricItem
}

interface MetricsPanelProps {
  userId?: string
}

export function MetricsPanel({ userId = 'demo-user' }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchMetrics()
  }, [userId])

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/demo/metrics?user_id=${userId}`)
      const data = await res.json()
      setMetrics(data)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
    setLoading(false)
  }

  if (loading || !metrics) {
    return null
  }

  const getStatusColor = (value: number, threshold: number, inverse: boolean = false) => {
    const isGood = inverse ? value < threshold : value > threshold
    return isGood ? 'var(--green)' : 'var(--yellow)'
  }

  return (
    <div className="card metrics-panel">
      <div className="metrics-header">
        <h3>📊 本周指标</h3>
        {metrics.is_simulated && (
          <span className="simulated-badge">模拟数据</span>
        )}
      </div>

      {metrics.is_simulated && (
        <p className="simulated-note">{metrics.simulated_note}</p>
      )}

      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">饮食规律性</div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.meal_regular_score.current, 70) }}>
            {metrics.meal_regular_score.current}
          </div>
          <div className="metric-unit">/ 100</div>
        </div>

        <div className="metric-item">
          <div className="metric-label">午餐延迟</div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.avg_lunch_delay_minutes.current, 30, true) }}>
            {metrics.avg_lunch_delay_minutes.current}
          </div>
          <div className="metric-unit">分钟</div>
        </div>

        <div className="metric-item">
          <div className="metric-label">预算超支</div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.budget_overrun_count.current, 1, true) }}>
            {metrics.budget_overrun_count.current}
          </div>
          <div className="metric-unit">天</div>
        </div>

        <div className="metric-item">
          <div className="metric-label">推荐采纳率</div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.recommendation_acceptance_rate.current, 0.5) }}>
            {(metrics.recommendation_acceptance_rate.current * 100).toFixed(0)}%
          </div>
          <div className="metric-unit"></div>
        </div>

        <div className="metric-item">
          <div className="metric-label">蛋白质不足</div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.protein_gap_days.current, 2, true) }}>
            {metrics.protein_gap_days.current}
          </div>
          <div className="metric-unit">天</div>
        </div>

        <div className="metric-item">
          <div className="metric-label">深夜订单</div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.late_night_orders.current, 1, true) }}>
            {metrics.late_night_orders.current}
          </div>
          <div className="metric-unit">次</div>
        </div>
      </div>

      <button
        className="btn-toggle-details"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? '隐藏详情' : '查看计算方式'}
      </button>

      {showDetails && (
        <div className="metrics-details">
          <div className="detail-item">
            <span className="detail-label">饮食规律性:</span>
            <span className="detail-value">{metrics.meal_regular_score.calculation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">午餐延迟:</span>
            <span className="detail-value">{metrics.avg_lunch_delay_minutes.calculation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">预算超支:</span>
            <span className="detail-value">{metrics.budget_overrun_count.calculation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">推荐采纳率:</span>
            <span className="detail-value">{metrics.recommendation_acceptance_rate.calculation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">蛋白质不足:</span>
            <span className="detail-value">{metrics.protein_gap_days.calculation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">深夜订单:</span>
            <span className="detail-value">{metrics.late_night_orders.calculation}</span>
          </div>
        </div>
      )}
    </div>
  )
}
