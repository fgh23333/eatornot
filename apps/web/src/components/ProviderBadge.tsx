import { useState, useEffect } from 'react'

interface ProviderStatus {
  active_provider: string
  provider_mode: string
  fallback_available: boolean
  mcd_mcp_configured: boolean
  mcd_mcp_health: string
  message: string
}

export function ProviderBadge() {
  const [status, setStatus] = useState<ProviderStatus | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/provider/status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch provider status:', err)
    }
  }

  if (!status) return null

  const isReal = status.provider_mode === 'real'
  const badgeColor = isReal ? 'var(--green)' : 'var(--yellow)'
  const badgeText = isReal ? "McDonald's MCP" : 'Mock Demo Mode'

  return (
    <div className="provider-badge-container">
      <button
        className="provider-badge"
        style={{ borderColor: badgeColor, color: badgeColor }}
        onClick={() => setShowTooltip(!showTooltip)}
        title={status.message}
      >
        <span className="provider-dot" style={{ background: badgeColor }} />
        Provider: {badgeText}
      </button>

      {showTooltip && (
        <div className="provider-tooltip">
          <div className="tooltip-header">Provider 状态</div>
          <div className="tooltip-row">
            <span>当前模式:</span>
            <span>{status.provider_mode}</span>
          </div>
          <div className="tooltip-row">
            <span>MCP 配置:</span>
            <span>{status.mcd_mcp_configured ? '✅ 已配置' : '❌ 未配置'}</span>
          </div>
          <div className="tooltip-row">
            <span>MCP 健康:</span>
            <span>{status.mcd_mcp_health === 'ok' ? '✅ 正常' : '⚠️ 不可用'}</span>
          </div>
          <div className="tooltip-message">{status.message}</div>
        </div>
      )}
    </div>
  )
}
