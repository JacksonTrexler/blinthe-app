<template>
  <v-dialog v-model="open" max-width="600" persistent>
    <v-card>
      <v-card-title>Edit Widget</v-card-title>

      <v-card-text>
        <div class="form-group">
          <label>Title</label>
          <v-text-field v-model="formData.title" outlined />
        </div>

        <div class="form-group">
          <label>Description</label>
          <v-textarea v-model="formData.description" outlined rows="3" />
        </div>

        <div class="form-group">
          <label>Display Type</label>
          <v-btn-toggle v-model="formData.displayLogic.type" mandatory divided border>
            <v-btn value="text">Text</v-btn>
            <v-btn value="number">Number</v-btn>
            <v-btn value="list">List</v-btn>
            <v-btn value="table">Table</v-btn>
            <v-btn value="chart">Chart</v-btn>
          </v-btn-toggle>
        </div>

        <v-alert type="info">Changes will create a new version in widget history.</v-alert>

        <v-alert v-if="error" type="error">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" :loading="loading" @click="handleSave">Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { Widget, DisplayConfig } from '@/types'

const props = defineProps<{
  widget: Widget
}>()

defineEmits<{
  close: []
  save: [updates: Partial<Widget>]
}>()

const open = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)

const formData = reactive<Partial<Widget>>({
  title: props.widget.title,
  description: props.widget.description,
  displayLogic: { ...props.widget.displayLogic },
})

function close() {
  open.value = false
}

async function handleSave() {
  loading.value = true
  error.value = null

  try {
    close()
  } catch (err) {
    error.value = `Failed to save: ${String(err)}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
</style>
