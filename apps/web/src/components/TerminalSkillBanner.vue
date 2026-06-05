<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  compact?: boolean
}>()

const dismissed = ref(false)
const copied = ref(false)

onMounted(() => {
  if (!props.compact) {
    dismissed.value = localStorage.getItem('terminal-skill-dismissed') === 'true'
  }
})

function dismiss() {
  dismissed.value = true
  localStorage.setItem('terminal-skill-dismissed', 'true')
}

function copyCommand() {
  navigator.clipboard.writeText('.\\scripts\\claude-setup\\install.ps1')
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <!-- Compact version for ReminderBell dropdown -->
  <div v-if="compact" class="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-t">
    <div class="flex items-start gap-2">
      <span class="text-base flex-shrink-0">💻</span>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-indigo-900">终端也能点餐</p>
        <p class="text-[10px] text-indigo-600 mt-0.5">在 Claude Code 里说 "帮我点午餐"</p>
        <code class="text-[10px] bg-white/60 px-1.5 py-0.5 rounded mt-1 inline-block text-indigo-700">
          .\scripts\claude-setup\install.ps1
        </code>
      </div>
    </div>
  </div>

  <!-- Full banner version for landing page / results -->
  <div v-else-if="!dismissed" class="max-w-2xl mx-auto">
    <div class="relative rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-4 overflow-hidden">
      <!-- Decorative dots -->
      <div class="absolute top-2 right-2 opacity-20 text-2xl">⚡</div>

      <button @click="dismiss"
        class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/60 hover:bg-white text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs transition-colors">
        ✕
      </button>

      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0">
          💻
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-indigo-900 text-sm">终端也能点餐！</h4>
          <p class="text-xs text-indigo-600 mt-1 leading-relaxed">
            安装 Claude Code / Cursor Skill，在终端里说 <strong>"帮我点午餐"</strong> 即可获得 AI 推荐 + 一键下单
          </p>
          <div class="mt-2.5 flex items-center gap-2">
            <div class="flex-1 bg-white/70 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-800 border border-indigo-100 select-all">
              .\scripts\claude-setup\install.ps1
            </div>
            <button @click="copyCommand"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                copied
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm'
              ]">
              {{ copied ? '✓ 已复制' : '复制' }}
            </button>
          </div>
          <div class="mt-2 flex items-center gap-3 text-[10px] text-indigo-400">
            <span>✅ 饭点自动提醒</span>
            <span>✅ AI 智能推荐</span>
            <span>✅ 终端直接下单</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
