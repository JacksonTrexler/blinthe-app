/**
 * Widgets management composable - CRUD, versioning, evaluation
 */

import { ref, computed } from 'vue'
import type { Widget, WidgetVersion } from '@/types'
import { useStorage } from './useStorage'
import { useLLM } from './useLLM'

export function useWidgets(password: string) {
  const { getEncrypted, setEncrypted, removeEncrypted, getAllKeys } = useStorage()
  const { callLLM } = useLLM()

  const widgets = ref<Widget[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load all widgets from encrypted storage
   */
  async function loadWidgets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const keys = getAllKeys()
      const loadedWidgets: Widget[] = []

      for (const key of keys) {
        if (key.startsWith('widget_')) {
          const widget = await getEncrypted<Widget>(key, password)
          if (widget) {
            loadedWidgets.push(widget)
          }
        }
      }

      widgets.value = loadedWidgets.sort((a, b) => b.createdAt - a.createdAt)
    } catch (err) {
      error.value = `Failed to load widgets: ${String(err)}`
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new widget
   */
  async function createWidget(widget: Widget): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const storageKey = `widget_${widget.id}`
      await setEncrypted(storageKey, widget, password)
      widgets.value.unshift(widget)
    } catch (err) {
      error.value = `Failed to create widget: ${String(err)}`
    } finally {
      loading.value = false
    }
  }

  /**
   * Update widget
   */
  async function updateWidget(id: string, updates: Partial<Widget>): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const index = widgets.value.findIndex((w) => w.id === id)
      if (index === -1) throw new Error('Widget not found')

      const widget = { ...widgets.value[index], ...updates, updatedAt: Date.now() }
      const storageKey = `widget_${id}`

      await setEncrypted(storageKey, widget, password)
      widgets.value[index] = widget
    } catch (err) {
      error.value = `Failed to update widget: ${String(err)}`
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete widget
   */
  async function deleteWidget(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const storageKey = `widget_${id}`
      removeEncrypted(storageKey)
      widgets.value = widgets.value.filter((w) => w.id !== id)
    } catch (err) {
      error.value = `Failed to delete widget: ${String(err)}`
    } finally {
      loading.value = false
    }
  }

  /**
   * Get widget by ID
   */
  function getWidget(id: string): Widget | undefined {
    return widgets.value.find((w) => w.id === id)
  }

  /**
   * Create new version of widget (for branching history)
   */
  function createVersion(widget: Widget): WidgetVersion {
    return {
      id: `v_${Date.now()}`,
      prompt: widget.prompt,
      displayLogic: widget.displayLogic,
      llmModel: widget.llmModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * Add version to widget
   */
  async function addVersion(widgetId: string, version: WidgetVersion): Promise<void> {
    const widget = getWidget(widgetId)
    if (!widget) throw new Error('Widget not found')

    widget.versions.push(version)
    widget.currentVersionId = version.id
    widget.updatedAt = Date.now()

    await updateWidget(widgetId, widget)
  }

  /**
   * Revert to specific version
   */
  async function revertToVersion(widgetId: string, versionId: string): Promise<void> {
    const widget = getWidget(widgetId)
    if (!widget) throw new Error('Widget not found')

    const version = widget.versions.find((v) => v.id === versionId)
    if (!version) throw new Error('Version not found')

    widget.currentVersionId = versionId
    widget.displayLogic = version.displayLogic
    widget.prompt = version.prompt
    widget.llmModel = version.llmModel
    widget.updatedAt = Date.now()

    await updateWidget(widgetId, widget)
  }

  /**
   * Export widget as JSON
   */
  function exportWidget(id: string): string | null {
    const widget = getWidget(id)
    if (!widget) return null

    return JSON.stringify(widget, null, 2)
  }

  /**
   * Import widget from JSON
   */
  async function importWidget(json: string): Promise<void> {
    try {
      const widget = JSON.parse(json) as Widget
      widget.id = `widget_${Date.now()}`
      widget.createdAt = Date.now()
      widget.updatedAt = Date.now()

      await createWidget(widget)
    } catch (err) {
      error.value = `Failed to import widget: ${String(err)}`
    }
  }

  return {
    widgets: computed(() => widgets.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadWidgets,
    createWidget,
    updateWidget,
    deleteWidget,
    getWidget,
    createVersion,
    addVersion,
    revertToVersion,
    exportWidget,
    importWidget,
  }
}
