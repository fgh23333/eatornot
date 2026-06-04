<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, Progress, Badge, Button } from '@/components/ui'
import { fetchDashboard } from '@/api/client'

const props = defineProps<{ userId?: string }>()
const emit = defineEmits<{ 'request-recommend': [mealType: string] }>()

const dashboard = ref<any>(null)

async function loadDashboard() {
  try {
    dashboard.value = await fetchDashboard(props.userId || 'demo-user')
  } catch {}
}

onMounted(loadDashboard)

const mealLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
</script>

<template>
  <Card v-if="dashboard" class="text-sm">
    <CardHeader class="pb-2">
      <CardTitle class="text-base">📊 今日状态</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div v-for="(info, type) in dashboard.meal_status" :key="type" class="flex items-center justify-between">
        <span>{{ mealLabels[type] || type }}</span>
        <Badge :variant="info === 'recorded' ? 'default' : 'outline'">
          {{ info === 'recorded' ? '✅ 已记录' : '⏳ 待记录' }}
        </Badge>
      </div>
      <div class="border-t pt-2">
        <div class="text-xs text-muted-foreground">热量进度</div>
        <Progress :value="Math.min((dashboard.total_calories / dashboard.daily_target) * 100, 100)" />
        <div class="text-xs text-muted-foreground mt-1">{{ dashboard.total_calories }} / {{ dashboard.daily_target }} kcal</div>
      </div>
      <Button v-if="dashboard.next_meal_suggestion" variant="outline" size="sm" class="w-full"
        @click="emit('request-recommend', dashboard.next_meal_suggestion.meal_type)">
        {{ dashboard.next_meal_suggestion.message }}
      </Button>
    </CardContent>
  </Card>
</template>
