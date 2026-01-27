/**
 * Grid layout and drag-drop composable
 */

import { ref, computed } from 'vue'

interface GridPosition {
  widgetId: string
  x: number
  y: number
  cols: number
}

const GRID_COLS = 4
const MIN_COLS = 1
const MAX_COLS = 4

export function useGridLayout() {
  const positions = ref<Map<string, GridPosition>>(new Map())
  const draggingId = ref<string | null>(null)

  /**
   * Load positions from localStorage
   */
  function loadPositions(): void {
    try {
      const stored = localStorage.getItem('blinthe_grid_positions')
      if (stored) {
        const data = JSON.parse(stored) as GridPosition[]
        positions.value.clear()
        data.forEach((pos) => {
          positions.value.set(pos.widgetId, pos)
        })
      }
    } catch (err) {
      console.error('Failed to load grid positions:', err)
    }
  }

  /**
   * Save positions to localStorage
   */
  function savePositions(): void {
    try {
      const data = Array.from(positions.value.values())
      localStorage.setItem('blinthe_grid_positions', JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save grid positions:', err)
    }
  }

  /**
   * Set widget position
   */
  function setPosition(widgetId: string, x: number, y: number, cols: number = 1): void {
    positions.value.set(widgetId, {
      widgetId,
      x,
      y,
      cols: Math.min(MAX_COLS, Math.max(MIN_COLS, cols)),
    })
    savePositions()
  }

  /**
   * Get widget position
   */
  function getPosition(widgetId: string): GridPosition | undefined {
    return positions.value.get(widgetId)
  }

  /**
   * Remove widget from grid
   */
  function removePosition(widgetId: string): void {
    positions.value.delete(widgetId)
    savePositions()
  }

  /**
   * Start dragging
   */
  function startDrag(widgetId: string): void {
    draggingId.value = widgetId
  }

  /**
   * End dragging
   */
  function endDrag(): void {
    draggingId.value = null
  }

  /**
   * Get responsive grid cols based on screen width
   */
  function getResponsiveGridCols(): number {
    const width = window.innerWidth

    if (width < 768) return 1 // Mobile
    if (width < 1024) return 2 // Tablet
    return GRID_COLS // Desktop
  }

  /**
   * Reflow grid on window resize
   */
  function reflowGrid(widgetCount: number): void {
    const cols = getResponsiveGridCols()
    let row = 0
    let col = 0

    Array.from(positions.value.values()).forEach((pos) => {
      if (col + pos.cols > cols) {
        col = 0
        row++
      }

      pos.x = col
      pos.y = row

      col += pos.cols
    })

    savePositions()
  }

  /**
   * Get grid gaps and spacing
   */
  function getGridSpacing(): { gap: string; cols: number } {
    return {
      gap: '1rem',
      cols: getResponsiveGridCols(),
    }
  }

  return {
    positions: computed(() => positions.value),
    draggingId: computed(() => draggingId.value),
    loadPositions,
    savePositions,
    setPosition,
    getPosition,
    removePosition,
    startDrag,
    endDrag,
    getResponsiveGridCols,
    reflowGrid,
    getGridSpacing,
    GRID_COLS,
  }
}
