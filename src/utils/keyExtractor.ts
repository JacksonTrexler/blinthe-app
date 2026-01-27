/**
 * API Key extraction patterns and utilities
 */

import type { APIKeyPattern } from '@/types'

export const API_KEY_PATTERNS: APIKeyPattern[] = [
  {
    provider: 'perplexity_api_key',
    pattern: /(?:perplexity[_\s]api[_\s]key\s*[:=]\s*)?((pplx-[a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]{40,}))/gi,
  },
  {
    provider: 'openai_api_key',
    pattern: /(?:openai[_\s]api[_\s]key\s*[:=]\s*)?(sk-[a-zA-Z0-9]+)/gi,
  },
  {
    provider: 'anthropic_api_key',
    pattern: /(?:anthropic[_\s]api[_\s]key\s*[:=]\s*)?(sk-ant-[a-zA-Z0-9]+)/gi,
  },
  {
    provider: 'openweather_api_key',
    pattern: /openweather[_\s]api[_\s]key\s*[:=]\s*([a-zA-Z0-9]+)/gi,
  },
  {
    provider: 'newsapi_api_key',
    pattern: /newsapi[_\s]api[_\s]key\s*[:=]\s*([a-zA-Z0-9]+)/gi,
  },
  {
    provider: 'weatherapi_api_key',
    pattern: /weatherapi[_\s]api[_\s]key\s*[:=]\s*([a-zA-Z0-9]+)/gi,
  },
  {
    provider: 'coingecko_api_key',
    pattern: /coingecko[_\s]api[_\s]key\s*[:=]\s*([a-zA-Z0-9]+)/gi,
  },
]

/**
 * Extract API keys from user input
 * Returns { apiKeys, redactedPrompt }
 */
export function extractAPIKeys(input: string): { apiKeys: Record<string, string>; redactedPrompt: string } {
  const apiKeys: Record<string, string> = {}
  let redactedPrompt = input

  API_KEY_PATTERNS.forEach((pattern) => {
    const matches = input.matchAll(pattern.pattern)
    for (const match of matches) {
      if (match[1]) {
        apiKeys[pattern.provider] = match[1]
        // Redact from prompt
        redactedPrompt = redactedPrompt.replace(match[0], `[${pattern.provider}]`)
      }
    }
  })

  return { apiKeys, redactedPrompt: redactedPrompt.trim() }
}

/**
 * Infer LLM provider from input
 */
export function inferLLMProvider(input: string): 'perplexity' | 'openai' | 'anthropic' | null {
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('perplexity')) return 'perplexity'
  if (lowerInput.includes('openai') || lowerInput.includes('gpt')) return 'openai'
  if (lowerInput.includes('anthropic') || lowerInput.includes('claude')) return 'anthropic'

  // Default to perplexity if any API key is present
  if (/api[_\s]key/.test(input)) return 'perplexity'

  return null
}

/**
 * Validate API key format
 */
export function isValidAPIKey(key: string, provider: string): boolean {
  if (!key || key.length < 5) return false

  // Provider-specific validation
  if (provider === 'openai_api_key') return key.startsWith('sk-')
  if (provider === 'anthropic_api_key') return key.startsWith('sk-ant-')
  if (provider === 'perplexity_api_key') return key.length > 10

  return true
}
