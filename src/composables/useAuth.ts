/**
 * Authentication composable - Session management, encryption key derivation
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Session, User } from '@/types'
import { deriveKeyFromPassword, hashString, decrypt, encrypt } from '@/utils/crypto'
import type { EncryptedData } from '@/utils/crypto'

const SESSION_TIMEOUT_MS = 20 * 60 * 1000 // 20 minutes
const SESSION_STORAGE_KEY = 'blinthe_session'

let timeoutId: number | null = null

interface StoredSession {
  username: string
  passwordHash: string
  encryptedSession: EncryptedData
}

// Shared state (can be accessed by tests and components)
const sessionState = ref<Session | null>(null)
const isAuthenticatedState = computed(() => !!sessionState.value)

/**
 * Core authentication logic (testable without component context)
 */
export function createAuthCore() {
  /**
   * Restore session from localStorage if valid
   */
  function restoreSession(): boolean {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return false

      const data: StoredSession = JSON.parse(stored)
      if (!data.username) return false

      const now = Date.now()

      sessionState.value = {
        username: data.username,
        expiresAt: now + SESSION_TIMEOUT_MS,
      }

      resetTimeout()
      return true
    } catch {
      return false
    }
  }

  /**
   * Create account / sign in
   */
  async function authenticate(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!username || username.length < 2) {
        return { success: false, error: 'Username must be at least 2 characters' }
      }

      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' }
      }

      // Derive encryption key from password
      const { key, salt } = await deriveKeyFromPassword(password)
      const passwordHash = await hashString(password)

      // Create session
      sessionState.value = {
        username,
        expiresAt: Date.now() + SESSION_TIMEOUT_MS,
        encryptionKey: key,
      }

      // Store for persistence (with minimal data)
      const stored: StoredSession = {
        username,
        passwordHash,
        encryptedSession: {
          ciphertext: '',
          iv: '',
          salt: '',
          algorithm: 'AES-GCM',
        },
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored))
      resetTimeout()

      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  /**
   * Logout and clear session
   */
  function logout(): void {
    sessionState.value = null
    localStorage.removeItem(SESSION_STORAGE_KEY)
    if (timeoutId) clearTimeout(timeoutId)
  }

  /**
   * Check and refresh session timeout
   */
  function resetTimeout(): void {
    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = window.setTimeout(() => {
      logout()
    }, SESSION_TIMEOUT_MS)
  }

  /**
   * Extend session on user interaction
   */
  function extendSession(): void {
    if (sessionState.value) {
      sessionState.value.expiresAt = Date.now() + SESSION_TIMEOUT_MS
      resetTimeout()
    }
  }

  /**
   * Setup global event listeners for session extension
   */
  function setupSessionExtension(): void {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']

    events.forEach((event) => {
      window.addEventListener(event, extendSession, { once: true })
    })
  }

  /**
   * Cleanup event listeners
   */
  function cleanupSessionExtension(): void {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']

    events.forEach((event) => {
      window.removeEventListener(event, extendSession)
    })
  }

  return {
    restoreSession,
    authenticate,
    logout,
    extendSession,
    setupSessionExtension,
    cleanupSessionExtension,
    resetTimeout,
  }
}

/**
 * Vue composable with lifecycle hooks
 */
export function useAuth() {
  const core = createAuthCore()

  onMounted(() => {
    core.restoreSession()
    core.setupSessionExtension()
  })

  onUnmounted(() => {
    core.cleanupSessionExtension()
    if (timeoutId) clearTimeout(timeoutId)
  })

  return {
    session: computed(() => sessionState.value),
    isAuthenticated: isAuthenticatedState,
    authenticate: core.authenticate,
    logout: core.logout,
    extendSession: core.extendSession,
    restoreSession: core.restoreSession,
  }
}
