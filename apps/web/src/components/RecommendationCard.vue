<script setup lang="ts">
import { Card, CardContent, Badge, Button } from '@/components/ui'
import type { RecommendationPlan } from '@/api/client'

const props = defineProps<{
  plan: RecommendationPlan
  selected?: boolean
}>()

defineEmits<{ 'select': [] }>()

const modeConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  disciplined: { label: '自律模式', icon: '💪', color: 'text-green-700', bg: 'bg-green-50' },
  budget_friendly: { label: '省钱模式', icon: '💰', color: 'text-amber-700', bg: 'bg-amber-50' },
  controlled_indulgence: { label: '放纵模式', icon: '🎉', color: 'text-pink-700', bg: 'bg-pink-50' },
}

function getModeConfig(mode: string) {
  return modeConfig[mode] || { label: mode, icon: '🍽️', color: 'text-gray-700', bg: 'bg-gray-50' }
}
</script>

<template>
  <Card :class="['cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5', selected ? 'ring-2 ring-orange-500' : '']"
    @click="$emit('select')">
    <CardContent class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl">{{ getModeConfig(plan.mode).icon }}</span>
          <h3 class="font-semibold text-base">{{ plan.title }}</h3>
        </div>
        <Badge :class="[getModeConfig(plan.mode).bg, getModeConfig(plan.mode).color]" variant="secondary">
          {{ getModeConfig(plan.mode).label }}
        </Badge>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="(item, i) in plan.items" :key="i" class="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
          {{ item.name }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="flex items-center gap-1">💰 <span class="font-medium">¥{{ plan.estimated_price.toFixed(0) }}</span></div>
        <div class="flex items-center gap-1">🔥 <span class="font-medium">{{ plan.estimated_calories.toFixed(0) }} kcal</span></div>
        <div class="flex items-center gap-1">💪 蛋白质 {{ plan.protein.toFixed(0) }}g</div>
        <div class="flex items-center gap-1">🧂 钠 {{ plan.sodium.toFixed(0) }}mg</div>
      </div>
      <div class="flex flex-wrap gap-1.5 text-xs">
        <span v-for="p in plan.pros" :key="p" class="px-2 py-0.5 rounded bg-green-50 text-green-700">✅ {{ p }}</span>
        <span v-for="c in plan.cons" :key="c" class="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">⚠️ {{ c }}</span>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed">{{ plan.final_reason }}</p>
      <Button class="w-full" :variant="selected ? 'default' : 'outline'" size="sm">
        {{ selected ? '✓ 已选择' : '选择此方案' }}
      </Button>
    </CardContent>
  </Card>
</template>
