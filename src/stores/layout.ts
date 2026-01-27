/**
 * Pinia store for layout state
 */

import { defineStore } from 'pinia'

interface GridPosition {
  widgetId: string
  x: number
  y: number
  cols: number
}

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    gridPositions: new Map<string, GridPosition>(),
    draggingId: null as string | null,
    responsiveCols: 4,
  }),

  getters: {
    isDragging: (state) => !!state.draggingId,
  },

  actions: {
    setGridPositions(positions: GridPosition[]) {
      this.gridPositions.clear()
      positions.forEach((pos) => {
        this.gridPositions.set(pos.widgetId, pos)
      })
    },

    setPosition(widgetId: string, position: GridPosition) {
      this.gridPositions.set(widgetId, position)
    },

    removePosition(widgetId: string) {
      this.gridPositions.delete(widgetId)
    },

    startDrag(widgetId: string) {
      this.draggingId = widgetId
    },

    endDrag() {
      this.draggingId = null
    },

    setResponsiveCols(cols: number) {
      this.responsiveCols = cols
    },
  },
})
