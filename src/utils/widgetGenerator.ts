/**
 * Widget Generation Utilities
 * Handles direct widget generation for simple cases without needing the API
 */

import type { LLMResponse } from '@/types'

/**
 * Detect if the user request is asking for simple HTML display
 * Examples: "H1 blinthe", "display <h1>blinthe</h1>", "show heading blinthe"
 */
function isSimpleHTMLRequest(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase().trim()
  
  // Check for HTML tags in the request
  const hasHTMLTag = /<[a-z1-6]+[^>]*>.*<\/[a-z1-6]+>/i.test(prompt)
  
  // Check for heading-related keywords
  const headingKeywords = /^(h[1-6]|heading|title|display.*heading|show.*heading|create.*heading)/i
  const isHeadingRequest = headingKeywords.test(lowerPrompt)
  
  // Check for simple content-only requests (short, no complex instructions)
  const isSimple = prompt.length < 100 && !lowerPrompt.includes('calculate') && 
                   !lowerPrompt.includes('analyze') && !lowerPrompt.includes('fetch') &&
                   !lowerPrompt.includes('search') && !lowerPrompt.includes('query')
  
  return hasHTMLTag || (isHeadingRequest && isSimple)
}

/**
 * Extract HTML content from a request
 * If the user provided HTML, extract it. Otherwise, generate appropriate HTML.
 */
function extractHTMLContent(prompt: string): string {
  // Try to find existing HTML tags
  const htmlMatch = prompt.match(/<[a-z1-6][^>]*>.*?<\/[a-z1-6]+>/i)
  if (htmlMatch) {
    return htmlMatch[0]
  }

  // Parse heading requests like "H1 blinthe" or "heading: blinthe"
  const h1Match = prompt.match(/^h1\s+(.+?)$/i)
  if (h1Match) {
    return `<h1>${h1Match[1]}</h1>`
  }

  const h2Match = prompt.match(/^h2\s+(.+?)$/i)
  if (h2Match) {
    return `<h2>${h2Match[1]}</h2>`
  }

  const h3Match = prompt.match(/^h3\s+(.+?)$/i)
  if (h3Match) {
    return `<h3>${h3Match[1]}</h3>`
  }

  // Generic heading request - default to h1
  const contentMatch = prompt.match(/(?:heading|title|display|show)\s*:?\s*(.+?)$/i)
  if (contentMatch) {
    const content = contentMatch[1].replace(/<\/?[^>]+>/g, '').trim()
    return `<h1>${content}</h1>`
  }

  // Fallback - wrap content in h1
  const content = prompt.replace(/<\/?[^>]+>/g, '').replace(/^\s*(h[1-6])\s+/i, '').trim()
  return `<h1>${content || 'Widget'}</h1>`
}

/**
 * Generate a widget response for simple HTML display requests
 * Bypasses the LLM API entirely
 */
export function generateSimpleHTMLWidget(prompt: string): LLMResponse | null {
  if (!isSimpleHTMLRequest(prompt)) {
    return null
  }

  const htmlContent = extractHTMLContent(prompt)
  
  // Extract title from HTML or prompt
  let title = 'Widget'
  const titleMatch = htmlContent.match(/>([^<]+)</)
  if (titleMatch) {
    title = titleMatch[1].trim().substring(0, 50) // Limit to 50 chars
  }

  return {
    title: title || 'Widget',
    description: `Displays: ${htmlContent.substring(0, 80)}`,
    displayLogic: {
      type: 'html',
      content: htmlContent,
    },
  }
}

/**
 * Reformulate a vague request into a natural language question for Perplexity
 * Helps ensure the API accepts the request
 */
export function reformulateAsQuestion(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase().trim()

  // If it already looks like a natural question, return as-is
  if (prompt.endsWith('?') || /^(how|what|when|where|why|create|build|show|display|make|generate)/i.test(prompt)) {
    return prompt
  }

  // Parse heading requests - these are the most common
  const h1Match = prompt.match(/^h1\s+(.+?)$/i)
  if (h1Match) {
    const content = h1Match[1].trim()
    return `Generate Vue 3 code for a modular Blinthe dashboard widget that displays an h1 heading with the text "${content}". Return only the complete <template>, <script setup>, and <style> sections. No explanations, only valid .vue component code.`
  }

  const h2Match = prompt.match(/^h2\s+(.+?)$/i)
  if (h2Match) {
    const content = h2Match[1].trim()
    return `Generate Vue 3 code for a modular Blinthe dashboard widget that displays an h2 heading with the text "${content}". Return only the complete <template>, <script setup>, and <style> sections.`
  }

  const h3Match = prompt.match(/^h3\s+(.+?)$/i)
  if (h3Match) {
    const content = h3Match[1].trim()
    return `Generate Vue 3 code for a modular Blinthe dashboard widget that displays an h3 heading with the text "${content}". Return only the complete <template>, <script setup>, and <style> sections.`
  }

  // Parse other UI element requests
  if (/^(card|button|list|table|chart|dialog|menu)/i.test(lowerPrompt)) {
    return `Generate Vue 3 code for a modular Blinthe dashboard widget that ${prompt}. Return only valid .vue component code with <template>, <script setup>, and <style> sections.`
  }

  // Generic expansion with task context
  return `Generate Vue 3 code for a modular Blinthe dashboard widget that ${prompt}. Output only the complete <template>, <script setup>, and <style> sections. No explanations.`
}

/**
 * Determine if a request should use the API or be handled locally
 */
export function shouldUseAPI(prompt: string): boolean {
  // If it's a simple HTML request, handle locally
  if (isSimpleHTMLRequest(prompt)) {
    return false
  }

  // Otherwise, use the API
  return true
}
