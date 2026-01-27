/**
 * Core type definitions for Blinthe
 */

export type LLMProvider = 'perplexity' | 'openai' | 'anthropic'
export type DisplayType = 'text' | 'number' | 'chart' | 'list' | 'table' | 'custom'
export type DisplayFormat = 'currency' | 'percentage' | 'date' | 'json' | 'markdown'

export interface DisplayConfig {
  type: DisplayType
  format?: DisplayFormat
  refreshable?: boolean
  displayTemplate?: string // JSX or JSON schema for custom rendering
  chartType?: 'bar' | 'line' | 'pie' // For chart type
}

export interface WidgetVersion {
  id: string
  prompt: string
  displayLogic: DisplayConfig
  llmModel: LLMProvider
  createdAt: number
  updatedAt: number
}

export interface Widget {
  id: string
  title: string // Auto-extracted or user-provided
  prompt: string // Original user prompt (encrypted in storage)
  description: string
  apiKeys: Record<string, string> // { "openweather_api_key": "...", "perplexity_api_key": "..." }
  llmModel: LLMProvider
  refreshInterval?: number // ms between evaluations (default: none, manual)
  displayLogic: DisplayConfig
  versions: WidgetVersion[] // Branching history
  currentVersionId: string
  createdAt: number
  updatedAt: number
  position?: { x: number; y: number } // Grid position for drag-drop
  size?: { cols: number } // Responsive grid size (1-4 columns, default: 1)
  lastRefresh?: number
  data?: unknown // Cached result data
  loading?: boolean
  error?: string | null
}

export interface User {
  username: string
  passwordHash?: string // Only for local validation
}

export interface Session {
  username: string
  expiresAt: number
  encryptionKey?: CryptoKey
}

export interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  sessionTimeout: number // milliseconds
}

export interface APIKeyPattern {
  provider: string
  pattern: RegExp
  prefix?: string
}

export interface LLMRequest {
  model: LLMProvider
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  max_tokens?: number
  apiKey: string
}

export interface LLMResponse {
  title: string
  description: string
  displayLogic: DisplayConfig
  refreshInterval?: number
}
