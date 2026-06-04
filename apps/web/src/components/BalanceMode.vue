<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

const props = defineProps<{
  userId?: string
  mood?: string
}>()

const emit = defineEmits<{ 'select': [mode: string] }>()

const modes = [
  { key: 'disciplined', label: '自律模式', icon: '🎯', desc: '严格按目标执行' },
  { key: 'balanced', label: '均衡模式', icon: '⚖️', desc: '兼顾享受与健康' },
  { key: 'indulgence', label: '放纵模式', icon: '🎉', desc: '开心最重要' },
]

const selected = ref(props.mood === 'stressed' ? 'indulgence' : 'balanced')
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-base">🎯 今日模式</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <button v-for="m in modes" :key="m.key" @click="selected = m.key; emit('select', m.key)"
          :class="['w-full flex items-center gap-2 p-2 rounded-lg border text-sm transition-all text-left', selected === m.key ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300']">
          <span class="text-lg">{{ m.icon }}</span>
          <div>
            <div class="font-medium">{{ m.label }}</div>
            <div class="text-xs text-muted-foreground">{{ m.desc }}</div>
          </div>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
