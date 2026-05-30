import { useState } from 'react'

export interface QuickProfileData {
  meal_goal: string
  budget_limit: number
  hunger_level: number
  craving_level: number
  allergies: string[]
  mood: string
}

interface QuickProfileFormProps {
  onComplete: (profile: QuickProfileData) => void
}

export function QuickProfileForm({ onComplete }: QuickProfileFormProps) {
  const [form, setForm] = useState<QuickProfileData>({
    meal_goal: 'balanced',
    budget_limit: 30,
    hunger_level: 3,
    craving_level: 2,
    allergies: [],
    mood: 'normal',
  })
  const [allergyText, setAllergyText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({
      ...form,
      allergies: allergyText ? allergyText.split(/[,，、]/).map(s => s.trim()) : [],
    })
  }

  return (
    <div className="onboarding-container quick-form">
      <h2>⚡ 快速选择</h2>
      <p className="onboarding-hint">告诉我你现在的状态</p>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-section">
          <h3>🎯 这顿的目标</h3>
          <div className="goal-grid">
            {[
              { value: 'lose_weight', label: '🥗 减脂', desc: '低热量优先' },
              { value: 'cheap', label: '💰 省钱', desc: '性价比最高' },
              { value: 'satisfying', label: '🍔 吃爽', desc: '满足口腹之欲' },
              { value: 'fast', label: '⚡ 快速', desc: '赶时间' },
              { value: 'balanced', label: '⚖️ 均衡', desc: '营养全面' },
            ].map((g) => (
              <div
                key={g.value}
                className={`goal-option ${form.meal_goal === g.value ? 'selected' : ''}`}
                onClick={() => setForm({...form, meal_goal: g.value})}
              >
                <span className="goal-label">{g.label}</span>
                <span className="goal-desc">{g.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>💰 预算和状态</h3>
          <div className="form-row two-col">
            <label>
              <span>这顿预算 (元)</span>
              <input type="number" value={form.budget_limit}
                onChange={(e) => setForm({...form, budget_limit: Number(e.target.value)})} />
            </label>
            <label>
              <span>心情</span>
              <select value={form.mood} onChange={(e) => setForm({...form, mood: e.target.value})}>
                <option value="normal">😐 一般</option>
                <option value="tired">😫 疲惫</option>
                <option value="stressed">😰 压力大</option>
                <option value="happy">😊 开心</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>饥饿程度</span>
              <div className="slider-row">
                <span>不饿</span>
                <input type="range" min={1} max={5} value={form.hunger_level}
                  onChange={(e) => setForm({...form, hunger_level: Number(e.target.value)})} />
                <span>很饿</span>
                <span className="slider-value">{form.hunger_level}</span>
              </div>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>嘴馋程度</span>
              <div className="slider-row">
                <span>无所谓</span>
                <input type="range" min={1} max={5} value={form.craving_level}
                  onChange={(e) => setForm({...form, craving_level: Number(e.target.value)})} />
                <span>特别想吃</span>
                <span className="slider-value">{form.craving_level}</span>
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>🚫 过敏信息</h3>
          <div className="form-row">
            <label>
              <span>过敏原（可选，用逗号分隔）</span>
              <input type="text" value={allergyText}
                onChange={(e) => setAllergyText(e.target.value)}
                placeholder="如：花生、海鲜" />
            </label>
          </div>
        </div>

        <button type="submit" className="btn-submit">开始分析</button>
      </form>
    </div>
  )
}
