/**
 * Pinia store for widgets state
 */

import { defineStore } from 'pinia'
import type { Widget } from '@/types'

export const useWidgetsStore = defineStore('widgets', {
  state: () => ({
    widgets: [] as Widget[],
    selectedWidgetId: null as string | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    selectedWidget: (state) => {
      return state.widgets.find((w) => w.id === state.selectedWidgetId) || null
    },

    widgetCount: (state) => state.widgets.length,

    sortedWidgets: (state) => {
      return [...state.widgets].sort((a, b) => b.updatedAt - a.updatedAt)
    },
  },

  actions: {
    setWidgets(widgets: Widget[]) {
      this.widgets = widgets
    },

    addWidget(widget: Widget) {
      this.widgets.unshift(widget)
    },

    updateWidget(widgetId: string, updates: Partial<Widget>) {
      const index = this.widgets.findIndex((w) => w.id === widgetId)
      if (index !== -1) {
        this.widgets[index] = { ...this.widgets[index], ...updates, updatedAt: Date.now() }
      }
    },

    removeWidget(widgetId: string) {
      this.widgets = this.widgets.filter((w) => w.id !== widgetId)
      if (this.selectedWidgetId === widgetId) {
        this.selectedWidgetId = null
      }
    },

    selectWidget(widgetId: string | null) {
      this.selectedWidgetId = widgetId
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },
  },
})
