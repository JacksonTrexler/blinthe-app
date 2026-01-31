<template>
  <v-dialog v-model="open" max-width="600" persistent>
    <v-card>
      <v-card-title>New Widget</v-card-title>

      <v-card-text class="card-text-container">
        <div class="form-section">
          <label class="section-label">Describe Your Widget</label>
          <v-textarea
            v-model="input"
            placeholder="Paste your API key(s) and describe what you want.&#10;Example: My Perplexity key is pplx-xxx... Show me today's weather and top news headlines"
            outlined
            dense
            rows="6"
            counter
            maxlength="2000"
          />
          <small class="text-disabled">Include API keys anywhere and describe what you'd like to display</small>
        </div>

        <!-- Extracted Keys Display -->
        <v-expand-transition>
          <div v-if="extractedKeys && Object.keys(extractedKeys).length > 0" class="keys-section">
            <v-alert type="success" icon="mdi-check-circle">
              Found {{ Object.keys(extractedKeys).length }} API key(s)
            </v-alert>
            <div class="keys-list">
              <div v-for="(value, key) in extractedKeys" :key="key" class="key-item">
                <strong>{{ key }}</strong>
                <code>{{ maskKey(value) }}</code>
              </div>
            </div>
          </div>
        </v-expand-transition>

        <!-- LLM Provider Selection -->
        <div class="form-section">
          <label class="section-label">LLM Provider</label>
          <v-btn-toggle v-model="selectedProvider" mandatory divided border class="llm-toggle">
            <v-btn value="perplexity" class="llm-btn">Perplexity</v-btn>
            <v-btn value="openai" class="llm-btn">OpenAI</v-btn>
            <v-btn value="anthropic" class="llm-btn">Anthropic</v-btn>
          </v-btn-toggle>
        </div>

        <!-- Error Display -->
        <v-alert v-if="error" type="error">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="isButtonDisabled"
          @click="handleCreate"
        >
          Create Widget
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Widget, LLMProvider, LLMResponse } from '@/types'
import { extractAPIKeys, inferLLMProvider } from '@/utils/keyExtractor'
import { generateSimpleHTMLWidget, reformulateAsQuestion, shouldUseAPI } from '@/utils/widgetGenerator'
import { useLLM } from '@/composables'

const emit = defineEmits<{
  close: []
  create: [widget: Widget]
}>()

const input = ref('')
const open = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedProvider = ref<LLMProvider>('perplexity')

const { callLLM } = useLLM()

// Recompute extraction on input change
const extraction = computed(() => {
  return extractAPIKeys(input.value)
})

const extractedKeys = computed(() => {
  const keys = extraction.value.apiKeys
  console.log('Extracted keys:', keys, 'Count:', Object.keys(keys).length)
  return Object.keys(keys).length > 0 ? keys : null
})

const redactedPrompt = computed(() => {
  const prompt = extraction.value.redactedPrompt
  console.log('Redacted prompt:', prompt)
  return prompt
})

// Debug button state
const isButtonDisabled = computed(() => {
  const checks = {
    noInput: !input.value,
    noProvider: !selectedProvider.value,
    noKeys: !extractedKeys.value,
    emptyKeys: extractedKeys.value && Object.keys(extractedKeys.value).length === 0,
    noPrompt: !redactedPrompt.value
  }
  console.log('Button disabled checks:', checks)
  return checks.noInput || checks.noProvider || checks.noKeys || checks.emptyKeys || checks.noPrompt
})

// Auto-infer LLM provider from input
watch(input, (newInput) => {
  const inferred = inferLLMProvider(newInput)
  if (inferred) {
    selectedProvider.value = inferred
  }
})

function maskKey(key: string): string {
  if (key.length <= 4) return '****'
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
}

function close() {
  input.value = ''
  error.value = null
  open.value = false
  // Emit close event
}

async function handleCreate() {
  if (!extractedKeys.value || Object.keys(extractedKeys.value).length === 0) {
    error.value = 'No API keys found in input'
    return
  }

  if (!redactedPrompt.value) {
    error.value = 'Please provide a prompt description'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Check if this is a simple HTML widget request that doesn't need the API
    if (!shouldUseAPI(redactedPrompt.value)) {
      console.log('Detected simple HTML widget request - bypassing API')
      const simpleWidget = generateSimpleHTMLWidget(redactedPrompt.value)
      
      if (simpleWidget) {
        const widget: Widget = {
          id: `widget_${Date.now()}`,
          title: simpleWidget.title,
          description: simpleWidget.description,
          prompt: input.value,
          apiKeys: extractedKeys.value,
          llmModel: selectedProvider.value,
          displayLogic: simpleWidget.displayLogic || { type: 'text' },
          versions: [],
          currentVersionId: `v_${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: { cols: 1 },
          refreshInterval: simpleWidget.refreshInterval,
        }

        widget.versions.push({
          id: widget.currentVersionId,
          prompt: widget.prompt,
          displayLogic: widget.displayLogic,
          llmModel: widget.llmModel,
          createdAt: widget.createdAt,
          updatedAt: widget.updatedAt,
        })

        emit('create', widget)
        close()
        return
      }
    }

    // For complex requests, use the API with retry logic
    // Get first API key for LLM call
    const [, apiKey] = Object.entries(extractedKeys.value)[0]

    // System prompt with Blinthe context - focus on Vue 3 code generation
    const systemPrompt = `Generate Vue 3 widget component code and JSON metadata.

Output format:
1. Vue 3 <template><script setup><style scoped> code (minimal, functional)
2. Blank line
3. JSON: {"title":"Name","description":"Desc","displayLogic":{"type":"vue","component":"name","content":"CODE HERE"}}

Be brief, generate valid code only.`

    // Attempt widget creation with smart retry logic
    let response: LLMResponse | null = null
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let promptToUse = redactedPrompt.value
        let sysPromptToUse = systemPrompt

        // Reformulate vague requests into proper questions for Perplexity
        if (attempt === 0) {
          promptToUse = reformulateAsQuestion(redactedPrompt.value)
          console.log(`Attempt ${attempt + 1}: Reformulated as Vue 3 task: "${promptToUse.substring(0, 150)}..."`)
        } else if (attempt === 1) {
          // Second attempt: Simpler, JSON-focused
          const words = redactedPrompt.value.split(' ').slice(0, 5).join(' ')
          promptToUse = `Create a Vue 3 widget for: "${redactedPrompt.value}". Then output JSON: {"title":"${words}","description":"Widget","displayLogic":{"type":"html","content":"<div>${words}</div>"}}`
          console.log(`Attempt ${attempt + 1}: Simplified approach`)
        } else if (attempt === 2) {
          // Last resort
          const words = redactedPrompt.value.split(' ').slice(0, 3).join(' ')
          promptToUse = `JSON only: {"title":"${words}","description":"Widget","displayLogic":{"type":"html","content":"<h1>${words}</h1>"}}`
          console.log(`Attempt ${attempt + 1} (last resort): Direct JSON`)
        }

        const llmResponse = await callLLM(selectedProvider.value, promptToUse, apiKey, sysPromptToUse, true)
        
        // Validate that displayLogic has actual content/type
        if (!llmResponse.displayLogic?.type) {
          throw new Error(`Invalid displayLogic: missing type. Got: ${JSON.stringify(llmResponse.displayLogic)}`)
        }
        
        // Check if response is just echoing the input (bad sign)
        if (llmResponse.title === `[perplexity_api_key]\n${redactedPrompt.value}` ||
            llmResponse.title === redactedPrompt.value ||
            (llmResponse.description?.includes(redactedPrompt.value) && redactedPrompt.value.length < 50)) {
          throw new Error(`LLM echoed back the input instead of processing it. Title: "${llmResponse.title}"`)
        }
        
        response = llmResponse
        console.log(`Success! Widget created with title: "${response.title}", displayLogic type: "${response.displayLogic.type}"`)
        break // Success, exit retry loop
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(`Attempt ${attempt + 1} failed:`, lastError.message)
        
        if (attempt === maxRetries) {
          throw new Error(
            `Widget creation failed after ${maxRetries + 1} attempts.\n` +
            `Last error: ${lastError.message}\n` +
            `Original prompt: "${redactedPrompt.value}"\n` +
            `Provider: ${selectedProvider.value}`
          )
        }
        // Continue to next attempt
      }
    }

    if (!response) {
      throw new Error('Widget creation failed: No response received from LLM')
    }

    // Create widget
    const widget: Widget = {
      id: `widget_${Date.now()}`,
      title: response.title,
      description: response.description,
      prompt: input.value,
      apiKeys: extractedKeys.value,
      llmModel: selectedProvider.value,
      displayLogic: response.displayLogic || { type: 'text' },
      versions: [],
      currentVersionId: `v_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: { cols: 1 },
      refreshInterval: response.refreshInterval,
    }

    widget.versions.push({
      id: widget.currentVersionId,
      prompt: widget.prompt,
      displayLogic: widget.displayLogic,
      llmModel: widget.llmModel,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    })

    emit('create', widget)
    close()
  } catch (err) {
    error.value = `Failed to create widget: ${String(err)}`
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.card-text-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 2rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e0e0e0;
}

/* LLM Button Contrast Fix */
.llm-toggle :deep(.v-btn) {
  color: #e0e0e0;
}

.llm-toggle :deep(.v-btn--active) {
  background-color: #00d4ff;
  color: #1a1a2e !important;
}

.llm-btn {
  color: #e0e0e0 !important;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: capitalize;
}

.llm-btn:not(.v-btn--active) {
  border-color: rgba(0, 212, 255, 0.3) !important;
}

.llm-btn:hover:not(.v-btn--active) {
  background-color: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.6) !important;
}

.llm-btn.v-btn--active {
  background-color: #00d4ff !important;
  color: #1a1a2e !important;
  font-weight: 600;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}

.keys-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 212, 255, 0.05);
  border-radius: 4px;
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.key-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 0.85rem;
}

code {
  color: #00d4ff;
  font-family: monospace;
}
</style>
