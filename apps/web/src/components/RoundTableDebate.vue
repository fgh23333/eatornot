<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, TabsRoot, TabsList, TabsTrigger, TabsContent, Badge } from '@/components/ui'
import type { DebateResult } from '@/api/client'

defineProps<{ debate?: DebateResult | null }>()
const activeTab = ref('initial_opinions')

const stageIcons: Record<string, string> = {
  initial_opinions: '💬',
  conflicts: '⚡',
  compromise: '🤝',
  final_vote: '✅',
}

const voteColors: Record<string, string> = {
  approve: 'text-green-600',
  warn: 'text-yellow-600',
  reject: 'text-red-600',
}
</script>

<template>
  <Card v-if="debate?.stages?.length">
    <CardHeader>
      <CardTitle class="text-base">🤖 智囊团圆桌辩论</CardTitle>
    </CardHeader>
    <CardContent>
      <TabsRoot :default-value="'initial_opinions'" v-model="activeTab">
        <TabsList class="w-full">
          <TabsTrigger v-for="s in debate.stages" :key="s.stage" :value="s.stage">
            {{ stageIcons[s.stage] || '📋' }} {{ s.title?.replace(/第.轮：/, '') }}
          </TabsTrigger>
        </TabsList>

        <TabsContent v-for="s in debate.stages" :key="s.stage" :value="s.stage">
          <div class="space-y-3 mt-2">
            <div v-for="(msg, i) in s.messages" :key="i" class="p-3 rounded-lg bg-gray-50">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm">{{ msg.agent }}</span>
                <Badge v-if="msg.vote" variant="outline" :class="voteColors[msg.vote] || ''">{{ msg.vote }}</Badge>
                <Badge v-if="msg.conflict_with" variant="destructive">vs {{ msg.conflict_with }}</Badge>
                <span v-if="msg.confidence" class="text-xs text-muted-foreground ml-auto">{{ Math.round(msg.confidence * 100) }}%</span>
              </div>
              <p class="text-sm text-gray-700">{{ msg.position }}</p>
              <p v-if="msg.reason" class="text-xs text-gray-500 mt-1">原因: {{ msg.reason }}</p>
              <p v-if="msg.warning" class="text-xs text-yellow-600 mt-1">⚠️ {{ msg.warning }}</p>
              <div v-if="msg.accepted_by?.length" class="text-xs text-muted-foreground mt-1">
                接受: {{ msg.accepted_by.join('、') }}
              </div>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>
    </CardContent>
  </Card>
</template>
