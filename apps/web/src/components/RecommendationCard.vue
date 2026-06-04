<script setup lang="ts">
import { Card, CardContent, Badge, Button } from '@/components/ui'
import type { RecommendationPlan } from '@/api/client'

const props = defineProps<{
  plan: RecommendationPlan
  selected?: boolean
}>()

defineEmits<{ 'select': [] }>()

const modeLabels: Record<string, string> = {
  disciplined: '自律模式',
  budget_friendly: '省钱模式',
  controlled_indulgence: '放纵模式',
}
</script>

<template>
  <Card :class="`cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-orange-500' : ''}`" @click="$emit('select')">
    <CardContent class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-lg">{{ plan.title }}</h3>
        <Badge variant="secondary">{{ modeLabels[plan.mode] || plan.mode }}</Badge>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="(item, i) in plan.items" :key="i" class="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs">
          {{ item.name }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>💰 ¥{{ plan.estimated_price.toFixed(0) }}</div>
        <div>🔥 {{ plan.estimated_calories.toFixed(0) }} kcal</div>
        <div>💪 蛋白质 {{ plan.protein.toFixed(0) }}g</div>
        <div>🧂 钠 {{ plan.sodium.toFixed(0) }}mg</div>
      </div>
      <div class="flex flex-wrap gap-1.5 text-xs">
        <span v-for="p in plan.pros" :key="p" class="px-2 py-0.5 rounded bg-green-50 text-green-700">✅ {{ p }}</span>
        <span v-for="c in plan.cons" :key="c" class="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">⚠️ {{ c }}</span>
      </div>
      <p class="text-sm text-gray-600">{{ plan.final_reason }}</p>
      <Button class="w-full" :variant="selected ? 'default' : 'outline'" size="sm">
        {{ selected ? '✓ 已选择' : '选择此方案' }}
      </Button>
    </CardContent>
  </Card>
</template>
