<template>
  <div class="dashboard">
    <!-- Top Bar -->
    <v-app-bar color="surface" elevation="1">
      <div class="brand-container">
        <img :src="bardLogo" alt="Blinthe" class="small-bard-logo" />
        <v-app-bar-title class="brand">Blinthe</v-app-bar-title>
      </div>

      <v-spacer />

      <div class="user-info">
        <span v-if="currentUsername">{{ currentUsername }}</span>
      </div>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-menu-down" v-bind="props" />
        </template>

        <v-list>
          <v-list-item @click="handleLogout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-container class="dashboard-content">
      <div class="widgets-grid">
        <!-- Add Widget Card -->
        <v-card class="add-widget-card" @click="openCreateModal">
          <div class="add-widget-content">
            <v-icon size="64">mdi-plus</v-icon>
            <p>Add Widget</p>
          </div>
        </v-card>

        <!-- Widget Cards -->
        <WidgetCard
          v-for="widget in sortedWidgets"
          :key="widget.id"
          :widget="widget"
          @edit="selectWidget"
          @delete="deleteWidget"
          @refresh="refreshWidget"
        />
      </div>

      <!-- Empty State -->
      <v-empty-state
        v-if="widgets.length === 0"
        icon="mdi-chart-box-outline"
        headline="No widgets yet"
        title="Get started by creating your first widget"
        class="mt-8"
      />
    </v-container>

    <!-- Create Widget Modal -->
    <CreateWidgetModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @create="handleCreateWidget"
    />

    <!-- Edit Widget Modal -->
    <EditWidgetModal
      v-if="selectedWidget && showEditModal"
      :widget="selectedWidget"
      @close="showEditModal = false"
      @save="handleUpdateWidget"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWidgets } from '@/composables'
import { useAuth } from '@/composables'
import { useAuthStore } from '@/stores/auth'
import { useWidgetsStore } from '@/stores/widgets'
import type { Widget } from '@/types'
import WidgetCard from './WidgetCard.vue'
import CreateWidgetModal from './CreateWidgetModal.vue'
import EditWidgetModal from './EditWidgetModal.vue'
import bardLogo from '@/assets/GnomeBard.png'

const { session, logout } = useAuth()
const authStore = useAuthStore()
const widgetsStore = useWidgetsStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)

const currentUsername = computed(() => session.value?.username || 'User')

const widgets = computed(() => widgetsStore.widgets)
const selectedWidget = computed(() => widgetsStore.selectedWidget)
const sortedWidgets = computed(() => widgetsStore.sortedWidgets)

// Initialize widgets on mount
onMounted(async () => {
  if (session.value) {
    const { loadWidgets } = useWidgets(session.value.username)
    await loadWidgets()
    widgetsStore.setWidgets((await loadWidgets()) as any)
  }
})

function openCreateModal() {
  showCreateModal.value = true
}

function selectWidget(widgetId: string) {
  widgetsStore.selectWidget(widgetId)
  showEditModal.value = true
}

async function handleCreateWidget(widget: Widget) {
  if (session.value) {
    const { createWidget } = useWidgets(session.value.username)
    await createWidget(widget)
    widgetsStore.addWidget(widget)
    showCreateModal.value = false
  }
}

async function handleUpdateWidget(updates: Partial<Widget>) {
  if (selectedWidget.value && session.value) {
    const { updateWidget } = useWidgets(session.value.username)
    await updateWidget(selectedWidget.value.id, updates)
    widgetsStore.updateWidget(selectedWidget.value.id, updates)
    showEditModal.value = false
  }
}

async function deleteWidget(widgetId: string) {
  if (session.value) {
    const { deleteWidget } = useWidgets(session.value.username)
    await deleteWidget(widgetId)
    widgetsStore.removeWidget(widgetId)
  }
}

async function refreshWidget(widgetId: string) {
  const widget = widgets.value.find((w) => w.id === widgetId)
  if (widget) {
    widget.loading = true
    // TODO: Implement actual data refresh
    setTimeout(() => {
      widget.loading = false
    }, 1000)
  }
}

function handleLogout() {
  logout()
  authStore.logout()
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1a1a2e;
}

.brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #00d4ff;
  letter-spacing: 1px;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.small-bard-logo {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  object-fit: contain;
}

.user-info {
  margin-right: 1rem;
  color: #a0a0a0;
  font-size: 0.9rem;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.add-widget-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  border: 2px dashed #00d4ff;
  background-color: rgba(0, 212, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  color: #00d4ff;
}

.add-widget-card:hover {
  background-color: rgba(0, 212, 255, 0.1);
  transform: translateY(-2px);
}

.add-widget-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.add-widget-content p {
  font-size: 1.1rem;
  margin: 0;
}

@media (max-width: 768px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-content {
    padding: 1rem;
  }
}
</style>
