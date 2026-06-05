<script setup lang="ts">
const props = defineProps<{
  lines?: number
}>()
</script>

<template>
  <div class="space-y-4 animate-pulse">
    <!-- 摘要骨架 -->
    <div class="space-y-2">
      <div class="h-4 bg-gray-200 rounded w-3/4" />
      <div class="h-4 bg-gray-200 rounded w-1/2" />
    </div>

    <!-- 3 张方案卡片骨架 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="rounded-lg border p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="h-5 bg-gray-200 rounded w-24" />
          <div class="h-5 bg-gray-200 rounded w-16" />
        </div>
        <div class="flex gap-1.5">
          <div class="h-5 bg-orange-100 rounded-full w-16" />
          <div class="h-5 bg-orange-100 rounded-full w-12" />
          <div class="h-5 bg-orange-100 rounded-full w-20" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="h-4 bg-gray-200 rounded w-20" />
          <div class="h-4 bg-gray-200 rounded w-20" />
          <div class="h-4 bg-gray-200 rounded w-20" />
          <div class="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div class="h-9 bg-gray-200 rounded w-full" />
      </div>
    </div>

    <!-- Agent 分析动画提示 -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <div class="flex gap-1">
        <span class="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style="animation-delay: 0ms" />
        <span class="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style="animation-delay: 150ms" />
        <span class="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style="animation-delay: 300ms" />
      </div>
      <span>🤖 智囊团分析中...</span>
    </div>
  </div>
</template>
