<script setup lang="ts">
import type { UserProfile } from '@/api/client'

defineProps<{ profile: UserProfile }>()
</script>

<template>
  <div class="text-xs text-muted-foreground py-2 border-t">
    <div class="font-medium text-foreground">{{ profile.name }}</div>
    <div>{{ profile.height_cm }}cm · {{ profile.weight_kg }}kg · {{ profile.age }}岁</div>
  </div>
</template>
