<template>
  <div class="display-renderer">
    <!-- Text Display -->
    <div v-if="widget.displayLogic.type === 'text'" class="text-display">
      <p v-if="widget.data">{{ widget.data }}</p>
      <p v-else class="placeholder">No data yet</p>
    </div>

    <!-- Number Display -->
    <div v-else-if="widget.displayLogic.type === 'number'" class="number-display">
      <div v-if="widget.data" class="metric">
        <div class="value">{{ formatNumber(widget.data) }}</div>
      </div>
      <p v-else class="placeholder">No data yet</p>
    </div>

    <!-- List Display -->
    <div v-else-if="widget.displayLogic.type === 'list'" class="list-display">
      <ul v-if="Array.isArray(widget.data)" class="item-list">
        <li v-for="(item, idx) in widget.data" :key="idx" class="list-item">
          {{ item }}
        </li>
      </ul>
      <p v-else class="placeholder">No data yet</p>
    </div>

    <!-- Table Display -->
    <div v-else-if="widget.displayLogic.type === 'table'" class="table-display">
      <v-table v-if="Array.isArray(widget.data) && widget.data.length > 0" density="compact">
        <thead>
          <tr>
            <th v-for="(key, idx) in getTableHeaders()" :key="idx">{{ key }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in widget.data" :key="idx">
            <td v-for="(key, cidx) in getTableHeaders()" :key="cidx">
              {{ formatTableCell(row[key]) }}
            </td>
          </tr>
        </tbody>
      </v-table>
      <p v-else class="placeholder">No data yet</p>
    </div>

    <!-- Chart Display -->
    <div v-else-if="widget.displayLogic.type === 'chart'" class="chart-display">
      <div v-if="widget.data" class="chart-container">
        <p class="placeholder">Chart rendering would go here</p>
      </div>
      <p v-else class="placeholder">No data yet</p>
    </div>

    <!-- Default -->
    <div v-else class="default-display">
      <p class="placeholder">Unknown display type</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Widget } from '@/types'

defineProps<{
  widget: Widget
}>()

function formatNumber(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

function formatTableCell(value: unknown): string {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function getTableHeaders(): string[] {
  if (!Array.isArray(props.widget.data) || props.widget.data.length === 0) {
    return []
  }

  const first = props.widget.data[0]
  if (typeof first === 'object' && first !== null) {
    return Object.keys(first)
  }

  return []
}
</script>

<style scoped>
.display-renderer {
  width: 100%;
  height: 100%;
}

.text-display,
.number-display,
.list-display,
.table-display,
.chart-display,
.default-display {
  width: 100%;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.value {
  font-size: 3rem;
  font-weight: bold;
  color: #00d4ff;
}

.item-list {
  list-style: none;
  padding: 0;
}

.list-item {
  padding: 0.75rem;
  border-bottom: 1px solid #00d4ff22;
  color: #e0e0e0;
}

.list-item:last-child {
  border-bottom: none;
}

.table-display {
  overflow-x: auto;
}

.chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.placeholder {
  color: #a0a0a0;
  text-align: center;
  padding: 2rem;
  margin: 0;
}
</style>
