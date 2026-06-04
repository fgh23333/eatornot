<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDemoMetrics } from '@/api/client'

const props = defineProps<{ userId?: string }>()

const data = ref<any>(null)

async function load() {
  try {
    data.value = await getDemoMetrics(props.userId || 'demo-user')
  } catch {}
}

onMounted(load)
</script>

<template>
  <div v-if="data" class="text-sm space-y-2">
    <div v-for="m in (data.metrics || [])" :key="m.name" class="flex justify-between">
      <span>{{ m.name }}</span>
      <span class="font-medium">{{ m.value }}{{ m.unit || '' }}</span>
    </div>
    <div v-if="data.trend" class="text-xs text-muted-foreground">
      趋势: {{ data.trend }}
    </div>
  </div>
  <div v-else class="text-xs text-muted-foreground py-2">暂无统计数据</div>
</template>
