/**
 * Pinia store for authentication state
 */

import { defineStore } from 'pinia'
import type { Session } from '@/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    isAuthenticated: false,
    sessionTimeout: 20 * 60 * 1000, // 20 minutes
  }),

  getters: {
    currentUsername: (state) => state.session?.username || null,
    isSessionExpired: (state) => {
      if (!state.session) return true
      return Date.now() > state.session.expiresAt
    },
  },

  actions: {
    setSession(session: Session | null) {
      this.session = session
      this.isAuthenticated = !!session
    },

    logout() {
      this.session = null
      this.isAuthenticated = false
    },

    extendSession() {
      if (this.session) {
        this.session.expiresAt = Date.now() + this.sessionTimeout
      }
    },
  },
})
