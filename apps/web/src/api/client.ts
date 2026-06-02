const BASE = ''

export interface UserProfile {
  user_id: string
  name: string
  height_cm: number
  weight_kg: number
  age: number
  sex: string
  goal: string
  activity_level: string
  daily_budget: number
  weekly_budget?: number
  weekly_indulgence_allowance: number
  taste_preferences: string[]
  allergies: string[]
  dislikes?: string[]
  preferred_tone?: string
  meal_schedule: Record<string, string>
  onboarding_complete?: boolean
  mode?: string
}

export interface MenuItem {
  name: string
  item_code: string
  category: string
  price: number
  calories: number
  protein: number
  fat: number
  carbohydrate: number
  sodium: number
  tags: string[]
}

export interface AgentResult {
  agent_name: string
  score: number
  decision: string
  reasons: string[]
  warnings: string[]
  data: Record<string, unknown>
  // 圆桌辩论字段
  position?: string
  objection?: string
  concession?: string
  final_vote?: string
  confidence?: number
  evidence?: string[]
}

export interface RecommendationPlan {
  id: string
  title: string
  mode: string
  items: MenuItem[]
  estimated_price: number
  estimated_calories: number
  protein: number
  fat: number
  carbohydrate: number
  sodium: number
  budget_impact: string
  calorie_impact: string
  indulgence_impact: string
  pros: string[]
  cons: string[]
  agent_votes: AgentResult[]
  safety_warnings: string[]
  final_reason: string
  version?: number
}

export interface DebateMessage {
  agent: string
  position: string
  evidence?: string[]
  confidence?: number
  conflict_with?: string
  reason?: string
  vote?: string
  warning?: string
  accepted_by?: string[]
}

export interface DebateStage {
  stage: string
  title: string
  messages: DebateMessage[]
}

export interface DebateResult {
  debate_id: string
  stages: DebateStage[]
}

export interface RecommendationResponse {
  user_id: string
  plans: RecommendationPlan[]
  agent_debate: AgentResult[]
  debate?: DebateResult
  summary: string
  safety_warnings: string[]
}

export interface QuickProfileData {
  meal_goal: string
  budget_limit: number
  hunger_level: number
  craving_level: number
  allergies: string[]
  mood: string
}

export interface TodayStatus {
  date: string
  meals_count: number
  total_calories: number
  total_spent: number
  meals: Array<{
    id: string
    user_id: string
    timestamp: string
    meal_type: string
    items: MenuItem[]
    total_price: number
    total_calories: number
    total_protein: number
    total_fat: number
    total_carbs: number
    total_sodium: number
    plan_mode: string
    satisfaction: number | null
    notes: string
  }>
}

// ============ API 函数 ============

export async function fetchProfile(userId: string = 'demo-user'): Promise<UserProfile> {
  const res = await fetch(`${BASE}/api/profile?user_id=${userId}`)
  return res.json()
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  return res.json()
}

export async function resetProfile(userId: string = 'demo-user'): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/api/profile/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
  return res.json()
}

export async function fetchRecommendation(
  message: string,
  options: {
    mode?: 'long_term' | 'quick'
    quickProfile?: QuickProfileData
    context?: Record<string, string>
  } = {}
): Promise<RecommendationResponse> {
  const { mode = 'long_term', quickProfile, context = {} } = options
  const res = await fetch(`${BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'demo-user',
      message,
      mode,
      quick_profile: quickProfile,
      context,
    }),
  })
  return res.json()
}

export async function refinePlan(planId: string, message: string, constraints: string[] = []): Promise<any> {
  const res = await fetch(`${BASE}/api/plan/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, message, constraints }),
  })
  return res.json()
}

export async function confirmOrder(plan: RecommendationPlan): Promise<{ order_id: string; status: string; message: string; is_mock: boolean }> {
  const res = await fetch(`${BASE}/api/order/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'demo-user',
      plan_id: plan.id,
      items: plan.items,
      estimated_price: plan.estimated_price,
      estimated_calories: plan.estimated_calories,
    }),
  })
  return res.json()
}

export async function resetConversation(userId: string = 'demo-user'): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/api/conversation/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
  return res.json()
}

export async function fetchTodayStatus(): Promise<TodayStatus> {
  const res = await fetch(`${BASE}/api/today/status`)
  return res.json()
}

export async function submitFeedback(feedback: { meal_id: string; satisfaction: number; notes: string }): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  })
  return res.json()
}

export async function fetchDashboard(userId: string = 'demo-user'): Promise<any> {
  const res = await fetch(`${BASE}/api/dashboard?user_id=${userId}`)
  return res.json()
}

export async function fetchReminders(userId: string = 'demo-user'): Promise<any> {
  const res = await fetch(`${BASE}/api/reminders?user_id=${userId}`)
  return res.json()
}

export async function acceptReminder(reminderId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/reminders/${reminderId}/accept`, {
    method: 'POST',
  })
  return res.json()
}

export async function snoozeReminder(reminderId: string, minutes: number = 30): Promise<any> {
  const res = await fetch(`${BASE}/api/reminders/${reminderId}/snooze?minutes=${minutes}`, {
    method: 'POST',
  })
  return res.json()
}

export async function dismissReminder(reminderId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/reminders/${reminderId}/dismiss`, {
    method: 'POST',
  })
  return res.json()
}

export async function mealDecision(request: {
  user_id?: string
  message?: string
  trigger_type?: string
  scenario?: string
  trigger_reason?: string
  suggested_action?: string
  context?: Record<string, any>
}): Promise<any> {
  const res = await fetch(`${BASE}/api/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return res.json()
}

export async function getProviderStatus(): Promise<any> {
  const res = await fetch(`${BASE}/api/provider/status`)
  return res.json()
}

export async function getDemoTimeline(userId: string = 'demo-user'): Promise<any> {
  const res = await fetch(`${BASE}/api/demo/timeline?user_id=${userId}`)
  return res.json()
}

export async function simulateWeek(userId: string = 'demo-user'): Promise<any> {
  const res = await fetch(`${BASE}/api/demo/simulate-week?user_id=${userId}`, {
    method: 'POST',
  })
  return res.json()
}

export async function getLearningPoints(userId: string = 'demo-user'): Promise<any> {
  const res = await fetch(`${BASE}/api/demo/learning?user_id=${userId}`)
  return res.json()
}

export async function getDemoMetrics(userId: string = 'demo-user'): Promise<any> {
  const res = await fetch(`${BASE}/api/demo/metrics?user_id=${userId}`)
  return res.json()
}
