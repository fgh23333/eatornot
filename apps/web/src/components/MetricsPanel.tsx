import { useState, useEffect } from 'react'

interface MetricItem {
  before: number
  after: number
  description: string
  value?: number
}

interface MetricsData {
  meal_regular_score: MetricItem
  avg_lunch_delay_minutes: MetricItem
  budget_overrun_count: MetricItem
  recommendation_acceptance_rate: MetricItem
  protein_gap_days: MetricItem
  late_night_uncontrolled_orders: MetricItem
}

interface MetricsPanelProps {
  userId?: string
}

export function MetricsPanel({ userId = 'demo-user' }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

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

  const formatDelta = (before: number, after: number, unit: string = '') => {
    const delta = after - before
    const isImprovement = delta < 0 || (unit === '%' && delta > 0)
    const sign = delta > 0 ? '+' : ''

    return (
      <span className={`metric-delta ${isImprovement ? 'improved' : 'worsened'}`}>
        {sign}{delta}{unit}
      </span>
    )
  }

  return (
    <div className="card metrics-panel">
      <h3>📊 本周改善</h3>
      <p className="metrics-subtitle">基于 7 天模拟数据</p>

      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">午餐平均延迟</div>
          <div className="metric-values">
            <span className="metric-before">{metrics.avg_lunch_delay_minutes.before} 分钟</span>
            <span className="metric-arrow">→</span>
            <span className="metric-after">{metrics.avg_lunch_delay_minutes.after} 分钟</span>
            {formatDelta(metrics.avg_lunch_delay_minutes.before, metrics.avg_lunch_delay_minutes.after, ' 分钟')}
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">预算超支次数</div>
          <div className="metric-values">
            <span className="metric-before">{metrics.budget_overrun_count.before} 次</span>
            <span className="metric-arrow">→</span>
            <span className="metric-after">{metrics.budget_overrun_count.after} 次</span>
            {formatDelta(metrics.budget_overrun_count.before, metrics.budget_overrun_count.after, ' 次')}
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">推荐采纳率</div>
          <div className="metric-values">
            <span className="metric-after">{(metrics.recommendation_acceptance_rate.value * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">蛋白质不足天数</div>
          <div className="metric-values">
            <span className="metric-before">{metrics.protein_gap_days.before} 天</span>
            <span className="metric-arrow">→</span>
            <span className="metric-after">{metrics.protein_gap_days.after} 天</span>
            {formatDelta(metrics.protein_gap_days.before, metrics.protein_gap_days.after, ' 天')}
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">深夜失控订单</div>
          <div className="metric-values">
            <span className="metric-before">{metrics.late_night_uncontrolled_orders.before} 次</span>
            <span className="metric-arrow">→</span>
            <span className="metric-after">{metrics.late_night_uncontrolled_orders.after} 次</span>
            {formatDelta(metrics.late_night_uncontrolled_orders.before, metrics.late_night_uncontrolled_orders.after, ' 次')}
          </div>
        </div>
      </div>

      <p className="metrics-note">
        * 这些是 demo 模拟数据，用于展示产品闭环和长期伴随价值
      </p>
    </div>
  )
}
