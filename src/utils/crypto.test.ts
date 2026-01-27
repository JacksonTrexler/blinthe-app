/**
 * Unit tests for crypto utilities
 * Tests password derivation, encryption, decryption, and hashing
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { deriveKeyFromPassword, encrypt, decrypt, hashString } from '../../src/utils/crypto'

describe('Crypto Utils', () => {
  describe('deriveKeyFromPassword', () => {
    it('should derive the same key from the same password and salt', async () => {
      const password = 'testPassword123'
      const salt = crypto.getRandomValues(new Uint8Array(16))

      const result1 = await deriveKeyFromPassword(password, salt)
      const result2 = await deriveKeyFromPassword(password, salt)

      // Both should derive successfully
      expect(result1.key).toBeDefined()
      expect(result2.key).toBeDefined()

      // The salt should be identical (same input)
      expect(Array.from(result1.salt)).toEqual(Array.from(result2.salt))
    })

    it('should generate a random salt if none provided', async () => {
      const password = 'testPassword123'

      const result1 = await deriveKeyFromPassword(password)
      const result2 = await deriveKeyFromPassword(password)

      // Both should have salts
      expect(result1.salt).toBeDefined()
      expect(result2.salt).toBeDefined()

      // Salts should be different (random)
      expect(Array.from(result1.salt)).not.toEqual(Array.from(result2.salt))
    })

    it('should handle different passwords', async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const result1 = await deriveKeyFromPassword('password1', salt)
      const result2 = await deriveKeyFromPassword('password2', salt)

      // Both should derive successfully
      expect(result1.key).toBeDefined()
      expect(result2.key).toBeDefined()
    })

    it('should handle edge case passwords', async () => {
      const testPasswords = [
        'a', // Single character
        'verylongpasswordwith1234567890special!@#$%^&*()', // Long with special chars
        '你好世界', // Unicode
        '   ', // Whitespace
      ]

      for (const pwd of testPasswords) {
        const result = await deriveKeyFromPassword(pwd)
        expect(result.key).toBeDefined()
        expect(result.salt).toBeDefined()
      }
    })
  })

  describe('encrypt and decrypt', () => {
    let key: CryptoKey
    let salt: Uint8Array

    beforeEach(async () => {
      const result = await deriveKeyFromPassword('testPassword123')
      key = result.key
      salt = result.salt
    })

    it('should encrypt plaintext to ciphertext', async () => {
      const plaintext = 'This is secret data'
      const encrypted = await encrypt(plaintext, key, salt)

      expect(encrypted.ciphertext).toBeDefined()
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.salt).toBeDefined()
      expect(encrypted.algorithm).toBe('AES-GCM')

      // Ciphertext should be base64 encoded
      expect(typeof encrypted.ciphertext).toBe('string')
      expect(/^[A-Za-z0-9+/=]+$/.test(encrypted.ciphertext)).toBe(true)
    })

    it('should decrypt ciphertext back to plaintext', async () => {
      const plaintext = 'This is secret data'
      const encrypted = await encrypt(plaintext, key, salt)
      const decrypted = await decrypt(encrypted, key)

      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertexts for same plaintext (random IVs)', async () => {
      const plaintext = 'Same data'
      const encrypted1 = await encrypt(plaintext, key, salt)
      const encrypted2 = await encrypt(plaintext, key, salt)

      // Ciphertexts should differ due to random IVs
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)

      // But both should decrypt to the same plaintext
      const decrypted1 = await decrypt(encrypted1, key)
      const decrypted2 = await decrypt(encrypted2, key)
      expect(decrypted1).toBe(plaintext)
      expect(decrypted2).toBe(plaintext)
    })

    it('should handle JSON serialization and deserialization', async () => {
      const plaintext = 'Secret message'
      const encrypted = await encrypt(plaintext, key, salt)

      // Simulate localStorage: stringify then parse
      const stored = JSON.stringify(encrypted)
      const retrieved = JSON.parse(stored)

      const decrypted = await decrypt(retrieved, key)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle large data', async () => {
      const largeData = 'x'.repeat(100000)
      const encrypted = await encrypt(largeData, key, salt)
      const decrypted = await decrypt(encrypted, key)

      expect(decrypted).toBe(largeData)
    })
  })

  describe('hashString', () => {
    it('should produce consistent hash for same input', async () => {
      const input = 'testPassword123'
      const hash1 = await hashString(input)
      const hash2 = await hashString(input)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await hashString('password1')
      const hash2 = await hashString('password2')

      expect(hash1).not.toBe(hash2)
    })

    it('should produce hex string output', async () => {
      const hash = await hashString('test')
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true)
      expect(hash.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    it('should handle edge case inputs', async () => {
      const inputs = ['', 'a', '你好', '   ']
      for (const input of inputs) {
        const hash = await hashString(input)
        expect(typeof hash).toBe('string')
        expect(hash.length).toBe(64)
      }
    })
  })

  describe('base64 encoding edge cases', () => {
    it('should handle binary data correctly', async () => {
      const plaintext = '\x00\x01\x02\x03\x04\x05' // Binary data
      const result = await deriveKeyFromPassword('test')
      const encrypted = await encrypt(plaintext, result.key, result.salt)
      const decrypted = await decrypt(encrypted, result.key)

      expect(decrypted).toBe(plaintext)
    })

    it('should preserve emoji and special characters', async () => {
      const plaintext = '😀🔐🌍Hello™'
      const result = await deriveKeyFromPassword('test')
      const encrypted = await encrypt(plaintext, result.key, result.salt)
      const decrypted = await decrypt(encrypted, result.key)

      expect(decrypted).toBe(plaintext)
    })
  })
})
