import { useState, useEffect } from 'react'

interface BalanceStatus {
  calorie_balance: number
  money_balance: number
  desire_balance: number
  calorie_status: string
  money_status: string
  desire_status: string
  overall_status: string
  suggestion: string
}

interface BalanceModeProps {
  userId?: string
  mood?: string
  onCheckOrder?: (canOrder: boolean, warning: string | null) => void
}

export function BalanceMode({ userId = 'demo-user', mood = 'normal', onCheckOrder }: BalanceModeProps) {
  const [balance, setBalance] = useState<BalanceStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBalance()
  }, [userId, mood])

  const fetchBalance = async () => {
    try {
      const res = await fetch(`/api/balance?user_id=${userId}&mood=${mood}`)
      const data = await res.json()
      setBalance(data)
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
    setLoading(false)
  }

  if (loading || !balance) {
    return <div className="card balance-card">加载中...</div>
  }

  const statusColors: Record<string, string> = {
    '充足': 'var(--green)',
    '适中': 'var(--primary)',
    '紧张': 'var(--yellow)',
    '已超标': 'var(--red)',
    '已耗尽': 'var(--red)',
  }

  const overallColors: Record<string, string> = {
    '放心吃': 'var(--green)',
    '稳一下': 'var(--yellow)',
    '控制一下': 'var(--orange)',
    '别吃了': 'var(--red)',
  }

  return (
    <div className="card balance-card">
      <h3>🎯 稳一下模式</h3>

      <div className="balance-grid">
        {/* 热量余额 */}
        <div className="balance-item">
          <div className="balance-icon">🔥</div>
          <div className="balance-info">
            <div className="balance-label">热量余额</div>
            <div className="balance-value" style={{ color: statusColors[balance.calorie_status] }}>
              {balance.calorie_balance} 千卡
            </div>
            <div className="balance-status" style={{ color: statusColors[balance.calorie_status] }}>
              {balance.calorie_status}
            </div>
          </div>
        </div>

        {/* 金钱余额 */}
        <div className="balance-item">
          <div className="balance-icon">💰</div>
          <div className="balance-info">
            <div className="balance-label">金钱余额</div>
            <div className="balance-value" style={{ color: statusColors[balance.money_status] }}>
              ¥{balance.money_balance}
            </div>
            <div className="balance-status" style={{ color: statusColors[balance.money_status] }}>
              {balance.money_status}
            </div>
          </div>
        </div>

        {/* 欲望余额 */}
        <div className="balance-item">
          <div className="balance-icon">😌</div>
          <div className="balance-info">
            <div className="balance-label">欲望余额</div>
            <div className="balance-value" style={{ color: statusColors[balance.desire_status] }}>
              {balance.desire_balance}%
            </div>
            <div className="balance-status" style={{ color: statusColors[balance.desire_status] }}>
              {balance.desire_status}
            </div>
          </div>
        </div>
      </div>

      {/* 综合建议 */}
      <div className="balance-advice" style={{ borderLeftColor: overallColors[balance.overall_status] }}>
        <div className="advice-status" style={{ color: overallColors[balance.overall_status] }}>
          {balance.overall_status}
        </div>
        <div className="advice-suggestion">{balance.suggestion}</div>
      </div>
    </div>
  )
}
