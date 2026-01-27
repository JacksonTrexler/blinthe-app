<template>
  <v-dialog v-model="open" max-width="600" persistent>
    <v-card>
      <v-card-title>Create New Widget</v-card-title>

      <v-card-text>
        <div class="form-section">
          <label class="section-label">Paste Your Prompt & API Keys</label>
          <v-textarea
            v-model="input"
            placeholder="Example:&#10;openweather_api_key: abc123&#10;show me weather for today"
            outlined
            dense
            rows="6"
            counter
            maxlength="2000"
          />
          <small class="text-disabled">Include any API keys and describe what widget you want</small>
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
          <v-btn-toggle v-model="selectedProvider" mandatory divided border>
            <v-btn value="perplexity">Perplexity</v-btn>
            <v-btn value="openai">OpenAI</v-btn>
            <v-btn value="anthropic">Anthropic</v-btn>
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
          :disabled="!input || !selectedProvider || !extractedKeys || Object.keys(extractedKeys).length === 0"
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
import type { Widget, LLMProvider, DisplayConfig } from '@/types'
import { extractAPIKeys, inferLLMProvider } from '@/utils/keyExtractor'
import { useLLM } from '@/composables'

defineEmits<{
  close: []
  create: [widget: Widget]
}>()

const input = ref('')
const open = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedProvider = ref<LLMProvider>('perplexity')

const { callLLM } = useLLM()

const extractedKeys = computed(() => {
  const { apiKeys } = extractAPIKeys(input.value)
  return Object.keys(apiKeys).length > 0 ? apiKeys : null
})

const redactedPrompt = computed(() => {
  const { redactedPrompt } = extractAPIKeys(input.value)
  return redactedPrompt
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
    // Get first API key for LLM call
    const [, apiKey] = Object.entries(extractedKeys.value)[0]

    // Call LLM to parse intent
    const systemPrompt = `You are analyzing a user's request for a data widget. Extract:
1. title: Brief widget name
2. description: What data it shows
3. displayLogic: { type: 'text'|'number'|'table'|'list'|'chart', format?: 'currency'|'percentage'|'date', chartType?: 'bar'|'line'|'pie' }
4. refreshInterval: ms between refreshes (optional)

Return ONLY valid JSON.`

    const response = await callLLM(selectedProvider.value, redactedPrompt.value, apiKey, systemPrompt)

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

    // Emit create event
    close()
  } catch (err) {
    error.value = `Failed to create widget: ${String(err)}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e0e0e0;
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
