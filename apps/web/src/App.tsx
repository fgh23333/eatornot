import { useState, useEffect } from 'react'
import {
  fetchProfile,
  saveProfile,
  resetProfile,
  fetchRecommendation,
  refinePlan,
  confirmOrder,
  submitFeedback,
  resetConversation,
  type UserProfile,
  type RecommendationResponse,
  type RecommendationPlan,
  type QuickProfileData,
} from './api/client'
import { ModeSelectionLanding } from './components/ModeSelectionLanding'
import { ProfileOnboardingForm } from './components/ProfileOnboardingForm'
import { QuickProfileForm } from './components/QuickProfileForm'
import { ProfileCard } from './components/ProfileCard'
import { RoundTableDebate } from './components/RoundTableDebate'
import { RecommendationCard } from './components/RecommendationCard'
import { OrderConfirmModal } from './components/OrderConfirmModal'
import { BudgetBar } from './components/BudgetBar'
import { NutritionBalancePanel } from './components/NutritionBalancePanel'
import { ActivePlanPanel } from './components/ActivePlanPanel'
import { ChatMessageList, type ChatMessage } from './components/ChatMessageList'
import { ResetButtons } from './components/ResetButtons'
import { TodayDashboard } from './components/TodayDashboard'
import { BalanceMode } from './components/BalanceMode'
import { AutoDraft } from './components/AutoDraft'
import { ReminderCard } from './components/ReminderCard'
import { ProviderBadge } from './components/ProviderBadge'
import { LearningPanel } from './components/LearningPanel'
import { MetricsPanel } from './components/MetricsPanel'

// 应用阶段
type AppPhase = 'mode_selection' | 'onboarding' | 'quick_form' | 'main_app'

function FeedbackForm({ onSubmit }: { onSubmit: (satisfaction: number, notes: string) => void }) {
  const [satisfaction, setSatisfaction] = useState(4)
  const [notes, setNotes] = useState('')

  return (
    <div className="card feedback-form">
      <h3>📝 用餐反馈</h3>
      <p className="feedback-hint">你的反馈会帮助我下次推荐得更好</p>
      <div className="feedback-stars">
        <span className="feedback-label">满意度:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} className={`star-btn ${star <= satisfaction ? 'active' : ''}`}
            onClick={() => setSatisfaction(star)}>
            {star <= satisfaction ? '★' : '☆'}
          </button>
        ))}
      </div>
      <textarea className="feedback-notes" value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="有什么想说的？（可选）" rows={2} />
      <button className="btn-feedback" onClick={() => onSubmit(satisfaction, notes)}>提交反馈</button>
    </div>
  )
}

export default function App() {
  // 阶段控制
  const [phase, setPhase] = useState<AppPhase>('mode_selection')
  const [mode, setMode] = useState<'long_term' | 'quick'>('long_term')

  // 用户数据
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [quickProfile, setQuickProfile] = useState<QuickProfileData | null>(null)

  // 推荐数据
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<RecommendationPlan | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderResult, setOrderResult] = useState<string | null>(null)
  const [showDebate, setShowDebate] = useState(false)  // 是否显示辩论面板

  // 对话数据
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // 初始化：检查是否有已保存的档案
  useEffect(() => {
    const savedMode = localStorage.getItem('eatornot_mode') as 'long_term' | 'quick' | null
    const savedProfile = localStorage.getItem('eatornot_profile')
    if (savedMode && savedProfile) {
      setMode(savedMode)
      setProfile(JSON.parse(savedProfile))
      setPhase('main_app')
    }
  }, [])

  // ============ 模式选择 ============
  const handleModeSelect = (selectedMode: 'long_term' | 'quick') => {
    setMode(selectedMode)
    localStorage.setItem('eatornot_mode', selectedMode)
    if (selectedMode === 'long_term') {
      setPhase('onboarding')
    } else {
      setPhase('quick_form')
    }
  }

  // ============ 档案完成 ============
  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    const saved = await saveProfile(newProfile)
    setProfile(saved)
    localStorage.setItem('eatornot_profile', JSON.stringify(saved))
    setPhase('main_app')
  }

  const handleQuickProfileComplete = (qp: QuickProfileData) => {
    setQuickProfile(qp)
    setPhase('main_app')
  }

  // ============ 推荐 ============
  const handleRecommend = async (message: string) => {
    setLoading(true)
    setOrderResult(null)
    setSelectedPlan(null)
    setShowFeedback(false)
    setFeedbackResult(null)

    // 添加用户消息
    setChatMessages(prev => [...prev, { role: 'user', content: message }])

    try {
      const result = await fetchRecommendation(message, {
        mode,
        quickProfile: mode === 'quick' ? quickProfile || undefined : undefined,
        context: {
          time_pressure: 'high',
          mood: quickProfile?.mood || 'tired',
          meal_type: 'dinner',
        },
      })
      setRecommendation(result)

      // 添加助手消息
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.summary }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '抱歉，分析失败了，请重试。' }])
    }
    setLoading(false)
  }

  // ============ 精炼方案 ============
  const handleRefine = async (message: string) => {
    if (!selectedPlan) return

    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const refined = await refinePlan(selectedPlan.id, message)
      // 更新选中的方案
      setSelectedPlan({
        ...selectedPlan,
        items: refined.items.map((i: any) => ({
          ...i,
          carbohydrate: i.carbohydrate || i.carbs || 0,
        })),
        estimated_price: refined.price,
        estimated_calories: refined.nutrition.calories,
        protein: refined.nutrition.protein,
        fat: refined.nutrition.fat,
        sodium: refined.nutrition.sodium,
        version: refined.version,
      } as any)

      const changeLog = refined.change_log || []
      const lastChange = changeLog[changeLog.length - 1]
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `已更新方案：${lastChange?.what_changed || message}。${lastChange?.impact || ''}`
      }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '修改失败，请重试。' }])
    }
    setLoading(false)
  }

  // ============ 下单 ============
  const handleConfirmOrder = async () => {
    if (!selectedPlan) return
    setShowOrderModal(false)
    try {
      const result = await confirmOrder(selectedPlan)
      setOrderResult(`订单 ${result.order_id} 已${result.is_mock ? '模拟' : ''}创建！${result.message}`)
      setShowFeedback(true)
      fetchProfile().then(setProfile)
    } catch (err) {
      setOrderResult('下单失败，请重试')
    }
  }

  // ============ 反馈 ============
  const handleSubmitFeedback = async (satisfaction: number, notes: string) => {
    try {
      const result = await submitFeedback({ meal_id: 'meal-0001', satisfaction, notes })
      setFeedbackResult(result.message)
      setShowFeedback(false)
    } catch (err) {
      setFeedbackResult('反馈提交失败')
    }
  }

  // ============ 重置 ============
  const handleResetConversation = async () => {
    await resetConversation()
    setRecommendation(null)
    setSelectedPlan(null)
    setOrderResult(null)
    setShowFeedback(false)
    setFeedbackResult(null)
    setChatMessages([])
  }

  const handleResetProfile = async () => {
    await resetProfile()
    localStorage.removeItem('eatornot_mode')
    localStorage.removeItem('eatornot_profile')
    setProfile(null)
    setQuickProfile(null)
    setRecommendation(null)
    setSelectedPlan(null)
    setChatMessages([])
    setPhase('mode_selection')
  }

  // ============ 渲染 ============

  // 阶段1：模式选择
  if (phase === 'mode_selection') {
    return <ModeSelectionLanding onSelectMode={handleModeSelect} />
  }

  // 阶段2：档案录入
  if (phase === 'onboarding') {
    return <ProfileOnboardingForm onComplete={handleOnboardingComplete} />
  }

  // 阶段3：快速问卷
  if (phase === 'quick_form') {
    return <QuickProfileForm onComplete={handleQuickProfileComplete} />
  }

  // 阶段4：主应用
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>🍔 EatOrNot</h1>
          <span className="mode-badge">{mode === 'long_term' ? '长期管理' : '快速选择'}</span>
        </div>
        <div className="header-right">
          <ProviderBadge />
          <ResetButtons
            onResetConversation={handleResetConversation}
            onResetProfile={handleResetProfile}
          />
        </div>
      </header>

      <div className="app-layout">
        {/* 左侧：仪表盘和档案 */}
        {mode === 'long_term' && profile && (
          <aside className="sidebar-left">
            <TodayDashboard
              userId={profile.user_id}
              onRequestRecommend={(mealType) => {
                setInputValue(`帮我选${mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'}`)
                handleRecommend(`帮我选${mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'}`)
              }}
            />
            <AutoDraft
              userId={profile.user_id}
              onConfirm={(draft) => {
                setOrderResult(`订单已确认！共 ${draft.items.length} 件，¥${draft.total_price}`)
              }}
            />
            <BalanceMode
              userId={profile.user_id}
              mood="normal"
            />
            <LearningPanel userId={profile.user_id} />
            <MetricsPanel userId={profile.user_id} />
            <ProfileCard profile={profile} />
          </aside>
        )}

        {/* 中间：对话和推荐 */}
        <main className={`main-content ${mode === 'quick' ? 'full-width' : ''}`}>
          {/* 提醒卡 */}
          {mode === 'long_term' && profile && !recommendation && (
            <ReminderCard
              userId={profile.user_id}
              onAccept={(reminder) => {
                setInputValue('帮我搭配')
                handleRecommend('帮我搭配')
              }}
            />
          )}

          {/* 聊天消息 */}
          <ChatMessageList messages={chatMessages} />

          {/* 输入区 */}
          {!recommendation && (
            <div className="chat-input">
              {mode === 'long_term' ? (
                <>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="告诉我你想吃什么..."
                    rows={3}
                  />
                  <button className="btn-recommend" onClick={() => handleRecommend(inputValue)} disabled={loading || !inputValue.trim()}>
                    {loading ? '分析中...' : '🔍 开始分析'}
                  </button>
                </>
              ) : (
                <div className="quick-input">
                  <p className="quick-hint">
                    基于你的选择：{quickProfile?.meal_goal === 'lose_weight' ? '减脂' :
                      quickProfile?.meal_goal === 'cheap' ? '省钱' :
                      quickProfile?.meal_goal === 'satisfying' ? '吃爽' :
                      quickProfile?.meal_goal === 'fast' ? '快速' : '均衡'}
                    ，预算 ¥{quickProfile?.budget_limit}
                  </p>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="有什么特别想吃的？或者直接点开始..."
                    rows={2}
                  />
                  <button className="btn-recommend" onClick={() => handleRecommend(inputValue || '帮我选一顿饭')} disabled={loading}>
                    {loading ? '分析中...' : '🔍 开始分析'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 推荐结果 */}
          {recommendation && !selectedPlan && (
            <div className="recommendation-section">
              <p className="summary">{recommendation.summary}</p>
              {recommendation.safety_warnings.length > 0 && (
                <div className="safety-warnings">
                  {recommendation.safety_warnings.map((w, i) => (
                    <span key={i} className="warning-tag">⚠️ {w}</span>
                  ))}
                </div>
              )}
              <div className="plans-grid">
                {recommendation.plans.map((plan) => (
                  <RecommendationCard
                    key={plan.id}
                    plan={plan}
                    selected={false}
                    onSelect={() => setSelectedPlan(plan)}
                  />
                ))}
              </div>

              {/* 为什么推荐 - 解释层 */}
              {recommendation.debate && (
                <div className="why-section">
                  <button
                    className="btn-why"
                    onClick={() => setShowDebate(!showDebate)}
                  >
                    {showDebate ? '收起解释' : '💡 为什么推荐这些？'}
                  </button>

                  {showDebate && (
                    <div className="debate-explanation">
                      <RoundTableDebate debate={recommendation.debate} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 选中的方案 + 精炼 */}
          {selectedPlan && (
            <div className="active-plan-section">
              <ActivePlanPanel
                plan={selectedPlan}
                onRefine={handleRefine}
                onConfirm={() => setShowOrderModal(true)}
              />
              <button className="btn-back" onClick={() => setSelectedPlan(null)}>
                ← 返回查看其他方案
              </button>
            </div>
          )}

          {/* 下单结果 */}
          {orderResult && <div className="order-result">{orderResult}</div>}

          {/* 反馈 */}
          {showFeedback && <FeedbackForm onSubmit={handleSubmitFeedback} />}
          {feedbackResult && <div className="feedback-result">{feedbackResult}</div>}
        </main>
      </div>

      {/* 订单确认弹窗 */}
      {showOrderModal && selectedPlan && (
        <OrderConfirmModal
          plan={selectedPlan}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  )
}
