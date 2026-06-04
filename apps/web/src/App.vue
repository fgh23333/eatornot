<script setup lang="ts">
import { useAppStore } from '@/composables/useAppStore'
import ModeSelectionLanding from '@/components/ModeSelectionLanding.vue'
import ProfileOnboardingForm from '@/components/ProfileOnboardingForm.vue'
import QuickProfileForm from '@/components/QuickProfileForm.vue'
import TodayDashboard from '@/components/TodayDashboard.vue'
import AutoDraft from '@/components/AutoDraft.vue'
import ReminderCard from '@/components/ReminderCard.vue'
import RecommendationCard from '@/components/RecommendationCard.vue'
import RoundTableDebate from '@/components/RoundTableDebate.vue'
import ActivePlanPanel from '@/components/ActivePlanPanel.vue'
import OrderConfirmModal from '@/components/OrderConfirmModal.vue'
import SafetyBanner from '@/components/SafetyBanner.vue'
import ProviderBadge from '@/components/ProviderBadge.vue'
import ResetButtons from '@/components/ResetButtons.vue'
import FeedbackFormInline from '@/components/FeedbackFormInline.vue'
import { Button, Card, CardContent } from '@/components/ui'
import BalanceMode from '@/components/BalanceMode.vue'
import LearningPanel from '@/components/LearningPanel.vue'
import MetricsPanel from '@/components/MetricsPanel.vue'
import ProfileCard from '@/components/ProfileCard.vue'

const store = useAppStore()

function handleFeedbackSubmit(satisfaction: number, notes: string) {
  store.handleSubmitFeedback(satisfaction, notes)
}
</script>

<template>
  <!-- Phase 1: Mode Selection -->
  <ModeSelectionLanding v-if="store.phase.value === 'mode_selection'" @select-mode="store.selectMode" />

  <!-- Phase 2: Onboarding -->
  <ProfileOnboardingForm v-else-if="store.phase.value === 'onboarding'" @complete="store.completeOnboarding" />

  <!-- Phase 3: Quick Form -->
  <QuickProfileForm v-else-if="store.phase.value === 'quick_form'" @complete="store.completeQuickProfile" />

  <!-- Phase 4: Main App -->
  <div v-else class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold">🍔 EatOrNot</h1>
          <span class="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
            {{ store.mode.value === 'long_term' ? '长期管理' : '快速选择' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <ProviderBadge />
          <ResetButtons @reset-conversation="store.handleResetConversation" @reset-profile="store.handleResetProfile" />
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 py-4 flex gap-4">
      <!-- Sidebar -->
      <aside v-if="store.mode.value === 'long_term' && store.profile.value" class="w-72 flex-shrink-0 space-y-4 hidden lg:block">
        <TodayDashboard :user-id="store.profile.value.user_id"
          @request-recommend="(mt) => { store.inputValue.value = `帮我选${mt === 'breakfast' ? '早餐' : mt === 'lunch' ? '午餐' : '晚餐'}`; store.handleRecommend() }" />
        <AutoDraft :user-id="store.profile.value.user_id"
          @confirm="(d) => { store.orderResult.value = `订单已确认！共 ${d.items.length} 件，¥${d.total_price}` }" />
        <BalanceMode :user-id="store.profile.value.user_id" mood="normal" />
        <LearningPanel :user-id="store.profile.value.user_id" />
        <MetricsPanel :user-id="store.profile.value.user_id" />
        <ProfileCard :profile="store.profile.value" />
      </aside>

      <!-- Main Content -->
      <main class="flex-1 min-w-0 space-y-4">
        <SafetyBanner compact />

        <!-- Reminders -->
        <ReminderCard v-if="store.mode.value === 'long_term' && store.profile.value && !store.recommendation.value"
          :user-id="store.profile.value.user_id"
          @accept="() => { store.inputValue.value = '帮我搭配'; store.handleRecommend() }" />

        <!-- Chat Messages -->
        <div v-if="store.chatMessages.value.length" class="space-y-2">
          <div v-for="(msg, i) in store.chatMessages.value" :key="i"
            :class="['p-3 rounded-lg max-w-2xl text-sm', msg.role === 'user' ? 'bg-orange-50 ml-auto' : 'bg-white border']">
            {{ msg.content }}
          </div>
        </div>

        <!-- Input -->
        <div v-if="!store.recommendation.value" class="space-y-2">
          <p v-if="store.mode.value === 'quick'" class="text-sm text-muted-foreground">
            基于：{{ store.quickProfile.value?.meal_goal }} · 预算 ¥{{ store.quickProfile.value?.budget_limit }}
          </p>
          <div class="flex gap-2">
            <textarea v-model="store.inputValue.value" :rows="store.mode.value === 'long_term' ? 3 : 2"
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
              :placeholder="store.mode.value === 'long_term' ? '告诉我你想吃什么...' : '有什么特别想吃的？'" />
            <Button :disabled="store.loading.value || !store.inputValue.value.trim()"
              @click="store.handleRecommend()">
              {{ store.loading.value ? '分析中...' : '🔍 分析' }}
            </Button>
          </div>
        </div>

        <!-- Recommendation Results -->
        <div v-if="store.recommendation.value && !store.selectedPlan.value" class="space-y-4">
          <p class="text-sm text-gray-600">{{ store.recommendation.value.summary }}</p>
          <div v-if="store.recommendation.value.safety_warnings.length" class="flex flex-wrap gap-2">
            <span v-for="w in store.recommendation.value.safety_warnings" :key="w" class="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700">⚠️ {{ w }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RecommendationCard v-for="plan in store.recommendation.value.plans" :key="plan.id"
              :plan="plan" @select="store.selectedPlan.value = plan" />
          </div>
          <div v-if="store.recommendation.value.debate">
            <Button variant="outline" size="sm" @click="store.showDebate.value = !store.showDebate.value">
              {{ store.showDebate.value ? '收起解释' : '💡 为什么推荐这些？' }}
            </Button>
            <div v-if="store.showDebate.value" class="mt-3">
              <RoundTableDebate :debate="store.recommendation.value.debate" />
            </div>
          </div>
        </div>

        <!-- Selected Plan -->
        <div v-if="store.selectedPlan.value">
          <ActivePlanPanel :plan="store.selectedPlan.value"
            @refine="store.handleRefine" @confirm="store.showOrderModal.value = true" />
          <Button variant="ghost" size="sm" class="mt-2" @click="store.selectedPlan.value = null">← 返回查看其他方案</Button>
        </div>

        <!-- Order Result -->
        <div v-if="store.orderResult.value" class="p-3 rounded-lg bg-blue-50 text-sm">{{ store.orderResult.value }}</div>

        <!-- Feedback -->
        <Card v-if="store.showFeedback.value" class="max-w-md">
          <CardContent class="p-4 space-y-3">
            <h3 class="font-medium">📝 用餐反馈</h3>
            <p class="text-sm text-muted-foreground">你的反馈会帮助我下次推荐得更好</p>
            <FeedbackFormInline @submit="handleFeedbackSubmit" />
          </CardContent>
        </Card>
        <div v-if="store.feedbackResult.value" class="text-sm text-muted-foreground">{{ store.feedbackResult.value }}</div>
      </main>
    </div>

    <!-- Order Modal -->
    <OrderConfirmModal v-if="store.showOrderModal.value && store.selectedPlan.value"
      :plan="store.selectedPlan.value"
      @order-complete="store.handleOrderComplete" @close="store.showOrderModal.value = false" />
  </div>
</template>
