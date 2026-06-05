<script setup lang="ts">
import { ref } from 'vue'
import { DialogRoot, DialogContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { createOrder, type RecommendationPlan } from '@/api/client'

const props = defineProps<{ plan: RecommendationPlan }>()
const emit = defineEmits<{
  'order-complete': [result: { success: boolean; message: string }]
  'close': []
}>()

const loading = ref(false)
const storeCode = ref('S001')

async function handleConfirm() {
  loading.value = true
  try {
    const result = await createOrder(props.plan, storeCode.value)
    if (result.success) {
      emit('order-complete', { success: true, message: result.message || '下单成功！' })
    } else {
      emit('order-complete', { success: false, message: result.message || '下单失败' })
    }
  } catch {
    emit('order-complete', { success: false, message: '下单请求失败' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <DialogRoot :default-open="true">
    <DialogContent class="max-w-md">
      <h2 class="text-lg font-semibold mb-4">📋 确认订单</h2>
      <div class="space-y-2 mb-4">
        <div v-for="(item, i) in plan.items" :key="i" class="flex justify-between text-sm">
          <span>{{ item.name }}</span>
          <span>¥{{ item.price.toFixed(0) }} / {{ item.calories }}kcal</span>
        </div>
      </div>
      <div class="border-t pt-3 space-y-1 text-sm">
        <div>总计: ¥{{ plan.estimated_price.toFixed(0) }}</div>
        <div>总热量: {{ plan.estimated_calories.toFixed(0) }} 千卡</div>
        <div>预算影响: {{ plan.budget_impact }}</div>
      </div>
      <div class="flex items-center gap-2 mt-3">
        <label class="text-sm">门店:</label>
        <input v-model="storeCode" class="rounded-md border border-gray-300 px-2 py-1 text-sm w-24" />
      </div>
      <div v-if="plan.safety_warnings.length" class="mt-3 space-y-1">
        <div v-for="w in plan.safety_warnings" :key="w" class="text-sm text-yellow-600">⚠️ {{ w }}</div>
      </div>
      <div class="flex gap-3 mt-6">
        <Button variant="outline" class="flex-1" @click="emit('close')" :disabled="loading">取消</Button>
        <Button class="flex-1" @click="handleConfirm" :disabled="loading">
          {{ loading ? '下单中...' : '确认下单' }}
        </Button>
      </div>
    </DialogContent>
  </DialogRoot>
</template>
