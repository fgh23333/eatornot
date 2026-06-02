import { useState, useEffect } from 'react'

interface SafetyPolicy {
  id: string
  title: string
  content: string
  icon: string
}

interface SafetyBannerProps {
  compact?: boolean
}

export function SafetyBanner({ compact = false }: SafetyBannerProps) {
  const [policies, setPolicies] = useState<SafetyPolicy[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPolicy()
  }, [])

  const fetchPolicy = async () => {
    try {
      const res = await fetch('/api/safety/policy')
      const data = await res.json()
      setPolicies(data.sections || [])
    } catch (err) {
      console.error('Failed to fetch safety policy:', err)
    }
    setLoading(false)
  }

  if (loading || policies.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className="safety-banner-compact">
        <span className="safety-icon">🛡️</span>
        <span className="safety-text">
          饮食建议仅供参考，不构成医疗建议
        </span>
        <button
          className="btn-safety-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '收起' : '详情'}
        </button>
        {showDetails && (
          <div className="safety-details-popup">
            {policies.map((p) => (
              <div key={p.id} className="safety-detail-item">
                <span className="detail-icon">{p.icon}</span>
                <div>
                  <div className="detail-title">{p.title}</div>
                  <div className="detail-content">{p.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card safety-banner">
      <h3>🛡️ 安全与隐私</h3>
      <div className="safety-grid">
        {policies.map((p) => (
          <div key={p.id} className="safety-item">
            <span className="safety-icon">{p.icon}</span>
            <div>
              <div className="safety-title">{p.title}</div>
              <div className="safety-content">{p.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
