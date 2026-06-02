import { useState } from 'react'
import type { UserProfile } from '../api/client'

interface ProfileOnboardingFormProps {
  onComplete: (profile: UserProfile) => void
}

export function ProfileOnboardingForm({ onComplete }: ProfileOnboardingFormProps) {
  const [form, setForm] = useState({
    name: '',
    height_cm: 170,
    weight_kg: 65,
    age: 25,
    sex: 'male',
    goal: 'lose_weight',
    activity_level: 'moderate',
    daily_budget: 50,
    weekly_budget: 300,
    weekly_indulgence_allowance: 2,
    allergies: '',
    dislikes: '',
    preferred_tone: 'gentle_friend',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const profile: UserProfile = {
      user_id: 'demo-user',
      name: form.name || '用户',
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      age: form.age,
      sex: form.sex,
      goal: form.goal,
      activity_level: form.activity_level,
      daily_budget: form.daily_budget,
      weekly_budget: form.weekly_budget,
      weekly_indulgence_allowance: form.weekly_indulgence_allowance,
      taste_preferences: [],
      allergies: form.allergies ? form.allergies.split(/[,，、]/).map(s => s.trim()) : [],
      dislikes: form.dislikes ? form.dislikes.split(/[,，、]/).map(s => s.trim()) : [],
      preferred_tone: form.preferred_tone,
      meal_schedule: { breakfast: '08:00', lunch: '12:00', dinner: '18:30' },
      onboarding_complete: true,
      mode: 'long_term',
    }
    onComplete(profile)
  }

  return (
    <div className="onboarding-container">
      <h2>📋 建立你的饮食档案</h2>
      <p className="onboarding-hint">填写基本信息，让推荐更精准</p>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-section">
          <h3>👤 基本信息</h3>
          <div className="form-row">
            <label>
              <span>昵称</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="怎么称呼你？"
              />
            </label>
          </div>
          <div className="form-row three-col">
            <label>
              <span>身高 (cm)</span>
              <input type="number" value={form.height_cm}
                onChange={(e) => setForm({...form, height_cm: Number(e.target.value)})} />
            </label>
            <label>
              <span>体重 (kg)</span>
              <input type="number" value={form.weight_kg}
                onChange={(e) => setForm({...form, weight_kg: Number(e.target.value)})} />
            </label>
            <label>
              <span>年龄</span>
              <input type="number" value={form.age}
                onChange={(e) => setForm({...form, age: Number(e.target.value)})} />
            </label>
          </div>
          <div className="form-row two-col">
            <label>
              <span>性别</span>
              <select value={form.sex} onChange={(e) => setForm({...form, sex: e.target.value})}>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </label>
            <label>
              <span>活动量</span>
              <select value={form.activity_level} onChange={(e) => setForm({...form, activity_level: e.target.value})}>
                <option value="sedentary">久坐不动</option>
                <option value="light">轻度活动</option>
                <option value="moderate">中度活动</option>
                <option value="active">高度活动</option>
                <option value="very_active">非常活跃</option>
              </select>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>🎯 目标设定</h3>
          <div className="form-row">
            <label>
              <span>饮食目标</span>
              <select value={form.goal} onChange={(e) => setForm({...form, goal: e.target.value})}>
                <option value="lose_weight">减脂瘦身</option>
                <option value="maintain">保持体重</option>
                <option value="gain_muscle">增肌塑形</option>
                <option value="save_money">省钱吃饭</option>
                <option value="regular_meals">规律饮食</option>
              </select>
            </label>
          </div>
          <div className="form-row two-col">
            <label>
              <span>日预算 (元)</span>
              <input type="number" value={form.daily_budget}
                onChange={(e) => setForm({...form, daily_budget: Number(e.target.value)})} />
            </label>
            <label>
              <span>周预算 (元)</span>
              <input type="number" value={form.weekly_budget}
                onChange={(e) => setForm({...form, weekly_budget: Number(e.target.value)})} />
            </label>
          </div>
          <div className="form-row">
            <label>
              <span>每周放纵额度</span>
              <select value={form.weekly_indulgence_allowance}
                onChange={(e) => setForm({...form, weekly_indulgence_allowance: Number(e.target.value)})}>
                <option value={0}>0 次（严格自律）</option>
                <option value={1}>1 次</option>
                <option value={2}>2 次（推荐）</option>
                <option value={3}>3 次</option>
                <option value={4}>4 次以上</option>
              </select>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>🚫 饮食限制</h3>
          <div className="form-row">
            <label>
              <span>过敏原（用逗号分隔）</span>
              <input type="text" value={form.allergies}
                onChange={(e) => setForm({...form, allergies: e.target.value})}
                placeholder="如：花生、海鲜、牛奶" />
            </label>
          </div>
          <div className="form-row">
            <label>
              <span>不喜欢的食物</span>
              <input type="text" value={form.dislikes}
                onChange={(e) => setForm({...form, dislikes: e.target.value})}
                placeholder="如：香菜、苦瓜" />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>💬 交流风格</h3>
          <div className="form-row">
            <label>
              <span>你希望助手怎么跟你说话？</span>
              <select value={form.preferred_tone} onChange={(e) => setForm({...form, preferred_tone: e.target.value})}>
                <option value="strict_coach">严格教练 — 直接了当</option>
                <option value="gentle_friend">温柔朋友 — 鼓励为主</option>
                <option value="funny_friend">搞笑损友 — 幽默风趣</option>
              </select>
            </label>
          </div>
        </div>

        <button type="submit" className="btn-submit">完成建档，开始使用</button>
      </form>
    </div>
  )
}
