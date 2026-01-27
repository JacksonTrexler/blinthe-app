<template>
  <v-dialog v-model="open" max-width="600">
    <v-card>
      <v-card-title>Widget History</v-card-title>

      <v-card-text>
        <v-timeline align="start">
          <v-timeline-item
            v-for="version in widget.versions"
            :key="version.id"
            :dot-color="version.id === widget.currentVersionId ? 'primary' : 'secondary'"
            size="small"
          >
            <div class="version-item">
              <div class="version-header">
                <strong>Version {{ formatDate(version.createdAt) }}</strong>
                <v-chip
                  v-if="version.id === widget.currentVersionId"
                  label
                  size="small"
                  color="primary"
                >
                  Active
                </v-chip>
              </div>

              <small class="text-disabled">{{ version.llmModel }} • {{ version.displayLogic.type }}</small>

              <div class="version-actions">
                <v-btn
                  v-if="version.id !== widget.currentVersionId"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="revertTo(version.id)"
                >
                  Restore
                </v-btn>
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
}>()

defineEmits<{
  close: []
  revert: [versionId: string]
}>()

const open = ref(true)

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function close() {
  open.value = false
}

function revertTo(versionId: string) {
  close()
}
</script>

<style scoped>
.version-item {
  padding: 1rem;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.version-actions {
  margin-top: 0.75rem;
}
</style>
