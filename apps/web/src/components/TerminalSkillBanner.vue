<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  compact?: boolean
}>()

const dismissed = ref(false)
const copiedStep = ref(-1)
const showSteps = ref(false)

onMounted(() => {
  if (!props.compact) {
    dismissed.value = localStorage.getItem('terminal-skill-dismissed') === 'true'
  }
})

function dismiss() {
  dismissed.value = true
  localStorage.setItem('terminal-skill-dismissed', 'true')
}

const skillContent = `---
name: meal-order
description: Terminal meal ordering. Say "帮我点餐" or "午餐推荐".
---

# 🍔 EatOrNot 终端点餐

## 触发词
"帮我点餐" / "午餐推荐" / "吃什么" / "领券" / "有什么活动"

## 流程
1. curl POST https://eatornot-api.jimmy120070.workers.dev/api/recommend 获取 3 个 AI 方案
2. 用 Markdown 表格展示方案
3. 用户选择后，使用 mcp__mcd-mcp__query-nearby-stores 查门店
4. 使用 mcp__mcd-mcp__query-meals 匹配菜品
5. 使用 mcp__mcd-mcp__calculate-price 算价
6. 用户确认后使用 mcp__mcd-mcp__create-order 下单

## 安全规则
- 下单前必须用户确认
- cron 提醒只展示推荐，不自动下单`

const steps = [
  { label: '1', text: '打开终端，进入项目目录', cmd: 'git clone https://github.com/fgh23333/eatornot.git && cd eatornot' },
  { label: '2', text: '运行安装脚本', cmd: 'powershell scripts/claude-setup/install.ps1', note: 'Mac/Linux: bash scripts/claude-setup/install.sh' },
  { label: '3', text: '重启 Claude Code，说 "帮我点午餐" 即可' },
]

function copyStep(idx: number, text: string) {
  navigator.clipboard.writeText(text)
  copiedStep.value = idx
  setTimeout(() => { copiedStep.value = -1 }, 2000)
}
</script>

<template>
  <!-- Compact version for ReminderBell dropdown -->
  <div v-if="compact" class="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-t">
    <div class="flex items-start gap-2">
      <span class="text-base flex-shrink-0">💻</span>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-indigo-900">终端也能点餐</p>
        <p class="text-[10px] text-indigo-600 mt-0.5">安装 Claude Code Skill → 说 "帮我点午餐" 即可</p>
        <a href="https://github.com/fgh23333/eatornot#-终端点餐claude-code"
          target="_blank" class="text-[10px] text-indigo-500 underline mt-1 inline-block">查看安装教程 →</a>
      </div>
    </div>
  </div>

  <!-- Full banner version for landing page / results -->
  <div v-else-if="!dismissed" class="max-w-2xl mx-auto">
    <div class="relative rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-5 overflow-hidden">
      <button @click="dismiss"
        class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/60 hover:bg-white text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs transition-colors z-10">
        ✕
      </button>

      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0">
          💻
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-indigo-900 text-sm">终端也能点餐！</h4>
          <p class="text-xs text-indigo-600 mt-1">
            在 Claude Code / Cursor 终端里说 <strong>"帮我点午餐"</strong> 即可获得 AI 推荐 + 一键下单
          </p>

          <!-- Toggle steps -->
          <button @click="showSteps = !showSteps"
            class="mt-2 text-xs text-indigo-500 hover:text-indigo-700 underline transition-colors">
            {{ showSteps ? '收起安装步骤' : '📋 查看安装步骤' }}
          </button>

          <!-- Installation steps -->
          <div v-if="showSteps" class="mt-3 space-y-2.5">
            <div v-for="(step, idx) in steps" :key="idx"
              class="bg-white/60 rounded-lg p-2.5 border border-indigo-100">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {{ step.label }}
                </span>
                <span class="text-xs text-indigo-900">{{ step.text }}</span>
              </div>
              <div v-if="step.cmd" class="mt-1.5 flex items-center gap-1.5">
                <code class="flex-1 bg-white rounded px-2 py-1 text-[11px] font-mono text-indigo-800 border border-indigo-100 select-all break-all">
                  {{ step.cmd }}
                </code>
                <button @click="copyStep(idx, step.cmd)"
                  :class="[
                    'px-2 py-1 rounded text-[10px] font-medium transition-all flex-shrink-0',
                    copiedStep === idx
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  ]">
                  {{ copiedStep === idx ? '✓' : '复制' }}
                </button>
              </div>
              <p v-if="step.note" class="text-[10px] text-indigo-400 mt-1 ml-7">{{ step.note }}</p>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-3 text-[10px] text-indigo-400">
            <span>✅ 饭点自动提醒</span>
            <span>✅ AI 智能推荐</span>
            <span>✅ 终端直接下单</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
