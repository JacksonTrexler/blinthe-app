/**
 * Encrypted storage composable using Web Crypto API
 */

import { encrypt, decrypt, deriveKeyFromPassword } from '@/utils/crypto'
import type { EncryptedData } from '@/utils/crypto'

const STORAGE_PREFIX = 'blinthe_'

export function useStorage() {
  /**
   * Set encrypted value in localStorage
   */
  async function setEncrypted(key: string, value: unknown, password: string): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value)
      const { key: cryptoKey, salt } = await deriveKeyFromPassword(password)
      const encrypted = await encrypt(jsonValue, cryptoKey, salt)

      const storageKey = `${STORAGE_PREFIX}${key}`
      localStorage.setItem(storageKey, JSON.stringify(encrypted))
    } catch (err) {
      console.error('Encryption error:', err)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Get decrypted value from localStorage
   */
  async function getEncrypted<T = unknown>(key: string, password: string): Promise<T | null> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`
      const stored = localStorage.getItem(storageKey)

      if (!stored) return null

      const encrypted: EncryptedData = JSON.parse(stored)
      const { key: cryptoKey } = await deriveKeyFromPassword(password)

      const decrypted = await decrypt(encrypted, cryptoKey)
      return JSON.parse(decrypted) as T
    } catch (err) {
      console.error('Decryption error:', err)
      return null
    }
  }

  /**
   * Remove encrypted value from localStorage
   */
  function removeEncrypted(key: string): void {
    const storageKey = `${STORAGE_PREFIX}${key}`
    localStorage.removeItem(storageKey)
  }

  /**
   * Clear all encrypted data with prefix
   */
  function clearAllEncrypted(): void {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Get all keys (for listing)
   */
  function getAllKeys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ''))
      }
    }
    return keys
  }

  return {
    setEncrypted,
    getEncrypted,
    removeEncrypted,
    clearAllEncrypted,
    getAllKeys,
  }
}
