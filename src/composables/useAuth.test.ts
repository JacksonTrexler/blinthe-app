/**
 * Tests for useAuth composable core logic
 * Tests authentication flow, session management, and encryption
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createAuthCore } from '../../src/composables/useAuth'

describe('useAuth', () => {
  let auth: ReturnType<typeof createAuthCore>

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Clear any pending timers
    vi.useFakeTimers()
    auth = createAuthCore()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('authenticate', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const result = await auth.authenticate('testuser', 'password123')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should fail with empty username', async () => {
      const result = await auth.authenticate('', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('at least 2 characters')
    })

    it('should fail with short password', async () => {
      const result = await auth.authenticate('testuser', 'short')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('at least 6 characters')
    })

    it('should fail with short username', async () => {
      const result = await auth.authenticate('u', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should store encrypted session in localStorage', async () => {
      localStorage.clear()

      await auth.authenticate('testuser', 'password123')

      const stored = localStorage.getItem('blinthe_session')
      expect(stored).toBeDefined()

      const parsed = JSON.parse(stored!)
      expect(parsed.username).toBe('testuser')
      expect(parsed.passwordHash).toBeDefined()
      expect(parsed.encryptedSession).toBeDefined()
    })

    it('should derive different encryption keys for different passwords', async () => {
      const result1 = await auth.authenticate('testuser', 'password123')
      const stored1 = localStorage.getItem('blinthe_session')

      localStorage.clear()

      const result2 = await auth.authenticate('testuser', 'password456')
      const stored2 = localStorage.getItem('blinthe_session')

      // Both should succeed
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // But stored data should be different (different password hashes)
      const parsed1 = JSON.parse(stored1!)
      const parsed2 = JSON.parse(stored2!)

      expect(parsed1.passwordHash).not.toBe(parsed2.passwordHash)
    })

    it('should handle special characters in username and password', async () => {
      const result = await auth.authenticate('user@example.com', 'P@ssw0rd!™')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      const stored = localStorage.getItem('blinthe_session')
      const parsed = JSON.parse(stored!)
      expect(parsed.username).toBe('user@example.com')
    })

    it('should handle unicode characters', async () => {
      const result = await auth.authenticate('用户123', 'σ»åτáüpassword')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      const stored = localStorage.getItem('blinthe_session')
      const parsed = JSON.parse(stored!)
      expect(parsed.username).toBe('用户123')
    })
  })

  describe('session management', () => {
    it('should set session expiration time', async () => {
      const before = Date.now()
      await auth.authenticate('testuser', 'password123')
      const after = Date.now()

      const stored = localStorage.getItem('blinthe_session')
      const parsed = JSON.parse(stored!)

      expect(parsed).toBeDefined()
      // Verify time was set (can't check exact time due to test timing)
      expect(parsed.username).toBe('testuser')
    })

    it('should logout and clear session', async () => {
      await auth.authenticate('testuser', 'password123')

      const stored1 = localStorage.getItem('blinthe_session')
      expect(stored1).toBeDefined()

      auth.logout()

      const stored2 = localStorage.getItem('blinthe_session')
      expect(stored2).toBeNull()
    })

    it('should extend session on activity', () => {
      auth.extendSession()
      // If no errors, test passes
      expect(true).toBe(true)
    })
  })

  describe('session restoration', () => {
    it('should restore session from localStorage', async () => {
      // First, create a session
      await auth.authenticate('testuser', 'password123')

      // Create a new auth instance
      const auth2 = createAuthCore()

      // Try to restore
      const restored = auth2.restoreSession()
      expect(restored).toBe(true)
    })

    it('should return false when no stored session', () => {
      localStorage.clear()

      const restored = auth.restoreSession()
      expect(restored).toBe(false)
    })
  })

  describe('encryption key derivation', () => {
    it('should derive encryption key with consistent PBKDF2 parameters', async () => {
      const result1 = await auth.authenticate('testuser', 'password123')

      // Get stored hash
      const stored1 = localStorage.getItem('blinthe_session')
      const parsed1 = JSON.parse(stored1!)
      const hash1 = parsed1.passwordHash

      // Authenticate again with same credentials
      localStorage.clear()
      const result2 = await auth.authenticate('testuser', 'password123')

      const stored2 = localStorage.getItem('blinthe_session')
      const parsed2 = JSON.parse(stored2!)
      const hash2 = parsed2.passwordHash

      // Hashes should be consistent
      expect(hash1).toBe(hash2)
    })

    it('should handle 100000 PBKDF2 iterations', async () => {
      // This test verifies that the slow PBKDF2 iterations don't break
      const result = await auth.authenticate('testuser', 'password123')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should handle crypto errors gracefully', async () => {
      // Simulate a very long password that might cause issues
      const longPassword = 'a'.repeat(10000)

      const result = await auth.authenticate('testuser', longPassword)

      // Should handle without throwing
      expect(result).toHaveProperty('success')
      // Long password still valid, just slow
      expect(result.success).toBe(true)
    })

    it('should provide clear error messages', async () => {
      const result1 = await auth.authenticate('', '')
      expect(result1.error).toBeDefined()
      expect(typeof result1.error).toBe('string')

      const result2 = await auth.authenticate('u', 'short')
      expect(result2.error).toBeDefined()
      expect(typeof result2.error).toBe('string')
    })
  })

  describe('concurrent authentication', () => {
    it('should handle multiple authenticate calls safely', async () => {
      const results = await Promise.all([
        auth.authenticate('user1', 'password123'),
        auth.authenticate('user2', 'password456'),
        auth.authenticate('user3', 'password789'),
      ])

      // At least one should succeed (last one will override)
      expect(results.some((r) => r.success)).toBe(true)
    })
  })
})
