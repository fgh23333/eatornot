import { useState } from 'react'
import type { DebateResult, DebateStage as DebateStageType, DebateMessage } from '../api/client'

const stageLabels: Record<string, string> = {
  initial_opinions: '初始判断',
  conflicts: '发现冲突',
  compromise: '形成妥协',
  final_vote: '最终投票',
}

const stageIcons: Record<string, string> = {
  initial_opinions: '💬',
  conflicts: '⚡',
  compromise: '🤝',
  final_vote: '✅',
}

const voteLabels: Record<string, string> = {
  approve: '赞同',
  warn: '保留',
  reject: '反对',
}

interface RoundTableDebateProps {
  debate?: DebateResult | null
}

export function RoundTableDebate({ debate }: RoundTableDebateProps) {
  const [activeStage, setActiveStage] = useState<string>('initial_opinions')

  if (!debate || !debate.stages.length) {
    return (
      <div className="card round-table">
        <h3>🤖 智囊团圆桌辩论</h3>
        <p className="debate-empty">等待分析完成...</p>
      </div>
    )
  }

  const currentStage = debate.stages.find(s => s.stage === activeStage) || debate.stages[0]

  return (
    <div className="card round-table">
      <h3>🤖 智囊团圆桌辩论</h3>

      {/* 阶段导航 */}
      <div className="debate-stages">
        {debate.stages.map((s) => (
          <button
            key={s.stage}
            className={`stage-btn ${activeStage === s.stage ? 'active' : ''}`}
            onClick={() => setActiveStage(s.stage)}
          >
            <span className="stage-icon">{stageIcons[s.stage] || '📋'}</span>
            <span className="stage-label">{stageLabels[s.stage] || s.title}</span>
          </button>
        ))}
      </div>

      {/* 当前阶段内容 */}
      <div className="debate-content">
        <p className="stage-title">{currentStage.title}</p>

        {currentStage.stage === 'initial_opinions' && (
          <InitialOpinionsStage messages={currentStage.messages} />
        )}

        {currentStage.stage === 'conflicts' && (
          <ConflictsStage messages={currentStage.messages} />
        )}

        {currentStage.stage === 'compromise' && (
          <CompromiseStage messages={currentStage.messages} />
        )}

        {currentStage.stage === 'final_vote' && (
          <FinalVoteStage messages={currentStage.messages} />
        )}
      </div>
    </div>
  )
}

function InitialOpinionsStage({ messages }: { messages: DebateMessage[] }) {
  return (
    <div className="stage-messages">
      <p className="stage-desc">每位智囊发表独立观点</p>
      {messages.map((msg, i) => (
        <div key={i} className="agent-opinion">
          <div className="opinion-header">
            <span className="agent-name">{msg.agent}</span>
            <span className="confidence">置信度: {Math.round((msg.confidence || 0) * 100)}%</span>
          </div>
          <div className="opinion-position">{msg.position}</div>
          {msg.evidence && msg.evidence.length > 0 && (
            <div className="opinion-evidence">
              <span className="evidence-label">依据：</span>
              {msg.evidence.map((e, j) => (
                <span key={j} className="evidence-tag">{e}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ConflictsStage({ messages }: { messages: DebateMessage[] }) {
  const hasConflicts = messages.some(m => m.conflict_with)

  return (
    <div className="stage-messages">
      <p className="stage-desc">
        {hasConflicts ? '检测到不同意见，需要权衡' : '智囊团意见基本一致'}
      </p>

      {hasConflicts ? (
        messages.map((msg, i) => (
          <div key={i} className="agent-conflict">
            <div className="conflict-header">
              <span className="agent-name">{msg.agent}</span>
              {msg.conflict_with && (
                <span className="conflict-with">vs {msg.conflict_with}</span>
              )}
            </div>
            <div className="conflict-position">{msg.position}</div>
            {msg.reason && (
              <div className="conflict-reason">冲突原因: {msg.reason}</div>
            )}
          </div>
        ))
      ) : (
        <div className="consensus-message">
          <span className="consensus-icon">🎉</span>
          <p>所有智囊一致认为这个方案可行！</p>
        </div>
      )}
    </div>
  )
}

function CompromiseStage({ messages }: { messages: DebateMessage[] }) {
  return (
    <div className="stage-messages">
      <p className="stage-desc">各方做出让步，寻找平衡点</p>
      {messages.map((msg, i) => (
        <div key={i} className="agent-compromise">
          <div className="compromise-header">
            <span className="agent-name">{msg.agent}</span>
            {msg.accepted_by && msg.accepted_by.length > 0 && (
              <span className="accepted-by">
                被 {msg.accepted_by.length} 位智囊接受
              </span>
            )}
          </div>
          <div className="compromise-position">{msg.position}</div>
          {msg.accepted_by && msg.accepted_by.length > 0 && (
            <div className="accepted-list">
              接受方: {msg.accepted_by.join('、')}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FinalVoteStage({ messages }: { messages: DebateMessage[] }) {
  const approveCount = messages.filter(m => m.vote === 'approve').length
  const warnCount = messages.filter(m => m.vote === 'warn').length
  const rejectCount = messages.filter(m => m.vote === 'reject').length

  return (
    <div className="stage-messages">
      <p className="stage-desc">综合各方意见，给出最终建议</p>

      <div className="final-summary">
        <div className="vote-count">
          <span className="vote approve">👍 {approveCount} 赞同</span>
          <span className="vote warn">⚠️ {warnCount} 保留</span>
          <span className="vote reject">👎 {rejectCount} 反对</span>
        </div>

        <div className="final-verdict">
          {approveCount >= messages.length * 0.6 ? (
            <span className="verdict approve">✅ 推荐执行</span>
          ) : approveCount >= messages.length * 0.3 ? (
            <span className="verdict warn">⚠️ 谨慎执行</span>
          ) : (
            <span className="verdict reject">❌ 建议重新考虑</span>
          )}
        </div>
      </div>

      <div className="final-votes">
        {messages.map((msg, i) => (
          <div key={i} className="agent-final-vote">
            <span className="agent-name">{msg.agent}</span>
            <span className={`final-vote ${msg.vote || 'neutral'}`}>
              {voteLabels[msg.vote || 'neutral'] || msg.vote}
            </span>
            {msg.warning && (
              <span className="vote-warning">⚠️ {msg.warning}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
