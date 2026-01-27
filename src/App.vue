<template>
  <v-app class="blinthe-app">
    <!-- Auth Modal - Show if not authenticated -->
    <AuthModal v-if="!isAuthenticated" />

    <!-- Dashboard - Show if authenticated -->
    <Dashboard v-else />
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '@/composables'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/AuthModal.vue'
import Dashboard from '@/components/Dashboard.vue'

const { session, restoreSession } = useAuth()
const authStore = useAuthStore()

const isAuthenticated = computed(() => !!session.value)

onMounted(() => {
  // Try to restore session on app load
  const restored = restoreSession()
  if (restored && session.value) {
    authStore.setSession(session.value)
  }
})
</script>

<style scoped>
.blinthe-app {
  background-color: #1a1a2e;
  color: #e0e0e0;
}
</style>
