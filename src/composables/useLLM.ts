/**
 * LLM Integration composable - Routes to Perplexity, OpenAI, or Anthropic
 */

import type { LLMProvider, LLMRequest, LLMResponse } from '@/types'
import { usePerplexityModel } from './usePerplexityModel'

export function useLLM() {
  const { selectModel } = usePerplexityModel()
  /**
   * Call Perplexity API
   * @param prompt - The user prompt
   * @param apiKey - Perplexity API key
   * @param systemPrompt - Optional system prompt
   * @param isWidgetCreation - Whether this is for widget creation (uses sonar-pro)
   */
  async function callPerplexity(
    prompt: string,
    apiKey: string,
    systemPrompt?: string,
    isWidgetCreation?: boolean
  ): Promise<LLMResponse> {
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt || 'You are a helpful assistant that returns structured JSON responses.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ]

    // Select appropriate model: sonar-pro for widget creation, auto-detect for others
    const model = selectModel(prompt, {
      isWidgetCreation,
      forceAdvanced: isWidgetCreation,
    })

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check for API-level errors in the response (invalid request, etc)
    if (data.error) {
      throw new Error(`Perplexity API rejected request: ${data.error?.message || data.error?.type || String(data.error)}`)
    }
    
    const content = data.choices[0]?.message?.content || ''

    return parseJSONResponse(content)
  }

  /**
   * Call OpenAI API
   */
  async function callOpenAI(
    prompt: string,
    apiKey: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt || 'You are a helpful assistant that returns structured JSON responses.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return parseJSONResponse(content)
  }

  /**
   * Call Anthropic API
   */
  async function callAnthropic(
    prompt: string,
    apiKey: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus',
        max_tokens: 1024,
        system: systemPrompt || 'You are a helpful assistant that returns structured JSON responses.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    return parseJSONResponse(content)
  }

  /**
   * Route to appropriate LLM provider
   * @param provider - The LLM provider (perplexity, openai, anthropic)
   * @param prompt - The user prompt
   * @param apiKey - The API key for the provider
   * @param systemPrompt - Optional system prompt
   * @param isWidgetCreation - Whether this is for widget creation (affects model selection)
   */
  async function callLLM(
    provider: LLMProvider,
    prompt: string,
    apiKey: string,
    systemPrompt?: string,
    isWidgetCreation?: boolean
  ): Promise<LLMResponse> {
    switch (provider) {
      case 'perplexity':
        return callPerplexity(prompt, apiKey, systemPrompt, isWidgetCreation)
      case 'openai':
        return callOpenAI(prompt, apiKey, systemPrompt)
      case 'anthropic':
        return callAnthropic(prompt, apiKey, systemPrompt)
      default:
        throw new Error(`Unknown LLM provider: ${provider}`)
    }
  }

  return {
    callLLM,
    callPerplexity,
    callOpenAI,
    callAnthropic,
  }
}

/**
 * Validate that parsed response has required widget fields
 */
function validateWidgetResponse(parsed: any): parsed is LLMResponse {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    typeof parsed.title === 'string' &&
    parsed.title.length > 0 &&
    (typeof parsed.displayLogic === 'object' || parsed.displayLogic === undefined) &&
    // displayLogic must have a valid type
    (parsed.displayLogic?.type === undefined || typeof parsed.displayLogic?.type === 'string')
  )
}

/**
 * Parse LLM response and extract JSON with strict validation
 * Handles cases where Vue 3 code is followed by JSON metadata
 * Strips template code and finds the last valid JSON object
 */
function parseJSONResponse(content: string): LLMResponse {
  try {
    // Remove Vue template from beginning if present
    // Look for </style> marker to find end of template
    let cleanContent = content
    const templateEnd = content.lastIndexOf('</style>')
    if (templateEnd > 0) {
      cleanContent = content.substring(templateEnd + 8) // Skip past </style>
    }
    
    // Try to find JSON blocks - look for { ... } patterns
    // Extract potential JSON objects from the content
    const possibleJSONs: string[] = []
    let depth = 0
    let startIdx = -1
    
    for (let i = 0; i < cleanContent.length; i++) {
      const char = cleanContent[i]
      
      if (char === '{') {
        if (depth === 0) startIdx = i
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0 && startIdx >= 0) {
          possibleJSONs.push(cleanContent.substring(startIdx, i + 1))
          startIdx = -1
        }
      }
    }
    
    // Try each JSON object found, starting from the last (most complete)
    for (let i = possibleJSONs.length - 1; i >= 0; i--) {
      const jsonStr = possibleJSONs[i]
      try {
        const parsed = JSON.parse(jsonStr)
        
        // Validate that it has required widget fields
        if (validateWidgetResponse(parsed)) {
          return {
            title: parsed.title,
            description: parsed.description || '',
            displayLogic: parsed.displayLogic || { type: 'text' },
            refreshInterval: parsed.refreshInterval,
          }
        }
      } catch {
        // Continue to next JSON match
        continue
      }
    }
    
    // No valid widget JSON found - provide helpful debugging info
    const preview = cleanContent.substring(0, 300)
    throw new Error(
      `No valid widget JSON found. Expected {title, description, displayLogic}. Found ${possibleJSONs.length} JSON block(s). Preview: ${preview}${cleanContent.length > 300 ? '...' : ''}`
    )
  } catch (error) {
    throw new Error(
      `Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
