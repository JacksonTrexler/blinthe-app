<template>
  <v-card class="widget-card" :loading="widget.loading">
    <!-- Widget Header -->
    <v-card-title class="widget-header">
      <div class="title-section">
        <h3>{{ widget.title }}</h3>
        <p class="description">{{ widget.description }}</p>
      </div>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props" />
        </template>

        <v-list>
          <v-list-item @click="$emit('edit', widget.id)">
            <v-list-item-title>Edit</v-list-item-title>
          </v-list-item>
          <v-list-item @click="showHistory = true">
            <v-list-item-title>History</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('refresh', widget.id)">
            <v-list-item-title>Refresh</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item @click="exportWidget">
            <v-list-item-title>Export</v-list-item-title>
          </v-list-item>
          <v-list-item @click="confirmDelete = true">
            <v-list-item-title class="text-error">Delete</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider />

    <!-- Widget Content -->
    <v-card-text class="widget-content">
      <DisplayRenderer :widget="widget" />
    </v-card-text>

    <!-- Widget Footer -->
    <v-card-actions class="widget-footer">
      <small class="text-disabled">{{ formatDate(widget.updatedAt) }}</small>
      <v-spacer />
      <span v-if="widget.lastRefresh" class="text-disabled">
        <small>Refreshed {{ formatDate(widget.lastRefresh) }}</small>
      </span>
    </v-card-actions>

    <!-- Delete Confirmation -->
    <v-dialog v-model="confirmDelete" max-width="400">
      <v-card>
        <v-card-title>Delete Widget?</v-card-title>
        <v-card-text>Are you sure you want to delete this widget? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDelete = false">Cancel</v-btn>
          <v-btn color="error" @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Version History -->
    <VersionHistory
      v-if="showHistory"
      :widget="widget"
      @close="showHistory = false"
      @revert="$emit('revert', $event)"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Widget } from '@/types'
import DisplayRenderer from './DisplayRenderer.vue'
import VersionHistory from './VersionHistory.vue'

defineProps<{
  widget: Widget
}>()

defineEmits<{
  edit: [widgetId: string]
  delete: [widgetId: string]
  refresh: [widgetId: string]
  revert: [versionId: string]
}>()

const confirmDelete = ref(false)
const showHistory = ref(false)

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function handleDelete() {
  confirmDelete.value = false
}

function exportWidget() {
  const widget = props.widget
  const json = JSON.stringify(widget, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${widget.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.widget-card {
  background-color: #16213e;
  border: 1px solid #00d4ff33;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.widget-card:hover {
  border-color: #00d4ff66;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.1);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
}

.title-section {
  flex: 1;
}

.title-section h3 {
  margin: 0;
  color: #00d4ff;
  font-size: 1.2rem;
}

.description {
  margin: 0.25rem 0 0;
  color: #a0a0a0;
  font-size: 0.85rem;
}

.widget-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  min-height: 150px;
}

.widget-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #00d4ff22;
  justify-content: space-between;
}
</style>
