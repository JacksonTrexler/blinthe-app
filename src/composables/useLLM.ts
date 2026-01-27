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
 * Parse LLM response and extract JSON
 */
function parseJSONResponse(content: string): LLMResponse {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: parsed.title || 'Untitled',
        description: parsed.description || '',
        displayLogic: parsed.displayLogic || { type: 'text' },
        refreshInterval: parsed.refreshInterval,
      }
    }

    // Fallback: create basic response
    return {
      title: 'Widget',
      description: content.substring(0, 200),
      displayLogic: { type: 'text' },
    }
  } catch {
    return {
      title: 'Widget',
      description: content.substring(0, 200),
      displayLogic: { type: 'text' },
    }
  }
}
