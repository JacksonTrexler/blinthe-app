/**
 * Web Crypto API utilities for AES-GCM encryption/decryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const SALT_LENGTH = 16
const IV_LENGTH = 12

export interface EncryptedData {
  ciphertext: string
  iv: string
  salt: string
  algorithm: string
}

/**
 * Convert Uint8Array to base64 string (browser-native)
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(arr)))
}

/**
 * Convert base64 string to Uint8Array (browser-native)
 */
function base64ToUint8Array(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Derive an encryption key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Use provided salt or generate new one
  const cryptoSalt = salt || crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  const importedKey = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: cryptoSalt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    KEY_LENGTH
  )

  const key = await crypto.subtle.importKey('raw', derivedBits, ALGORITHM, false, ['encrypt', 'decrypt'])

  return { key, salt: cryptoSalt }
}

/**
 * Encrypt data with AES-GCM
 */
export async function encrypt(data: string, key: CryptoKey, salt: Uint8Array): Promise<EncryptedData> {
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(data)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    plaintext
  )

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
    iv: uint8ArrayToBase64(iv),
    salt: uint8ArrayToBase64(salt),
    algorithm: ALGORITHM,
  }
}

/**
 * Decrypt data with AES-GCM
 */
export async function decrypt(encrypted: EncryptedData, key: CryptoKey): Promise<string> {
  const ciphertext = base64ToUint8Array(encrypted.ciphertext)
  const iv = base64ToUint8Array(encrypted.iv)

  const plaintext = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(plaintext)
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return uint8ArrayToHex(new Uint8Array(hashBuffer))
}
