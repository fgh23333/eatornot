import type { AgentResult } from '../api/client'

const decisionLabels: Record<string, string> = {
  approve: '赞同',
  warn: '警告',
  reject: '反对',
  neutral: '中立',
}

export function AgentDebatePanel({ agents }: { agents: AgentResult[] }) {
  if (!agents.length) return null
  return (
    <div className="card agent-panel">
      <h3>🤖 智囊团辩论</h3>
      {agents.map((a, i) => (
        <div key={i} className={`agent-item ${a.decision}`}>
          <div className="agent-header">
            <span className="agent-name">{a.agent_name}</span>
            <span className={`badge ${a.decision}`}>{decisionLabels[a.decision] || a.decision}</span>
          </div>
          <div className="agent-score">评分: {a.score.toFixed(2)}</div>
          <ul className="agent-reasons">
            {a.reasons.map((r, j) => <li key={j}>{r}</li>)}
          </ul>
          {a.warnings.length > 0 && (
            <div className="agent-warnings">
              {a.warnings.map((w, j) => <span key={j} className="warning-tag">⚠️ {w}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
