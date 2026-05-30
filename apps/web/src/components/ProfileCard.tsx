import type { UserProfile } from '../api/client'

export function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <div className="card profile-card">
      <h3>👤 {profile.name}</h3>
      <div className="profile-stats">
        <span>身高 {profile.height_cm}cm</span>
        <span>体重 {profile.weight_kg}kg</span>
        <span>年龄 {profile.age}</span>
      </div>
      <div className="profile-goal">
        目标: <strong>{profile.goal === 'lose_weight' ? '减脂' : profile.goal === 'gain_muscle' ? '增肌' : '维持'}</strong>
      </div>
      <div className="profile-budget">
        日预算: ¥{profile.daily_budget}
      </div>
    </div>
  )
}
