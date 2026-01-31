/**
 * Widget creation tests
 */
import { describe, it, expect } from 'vitest'
import { generateSimpleHTMLWidget, shouldUseAPI, reformulateAsQuestion } from '@/utils/widgetGenerator'

describe('widgetGenerator', () => {
  describe('shouldUseAPI', () => {
    it('should bypass API for simple HTML requests', () => {
      expect(shouldUseAPI('h1 blinthe')).toBe(false)
      expect(shouldUseAPI('H1 test content')).toBe(false)
      expect(shouldUseAPI('heading: blinthe')).toBe(false)
    })

    it('should use API for complex requests', () => {
      expect(shouldUseAPI('create a dashboard showing today\'s news')).toBe(true)
      expect(shouldUseAPI('fetch data from api and display')).toBe(true)
      expect(shouldUseAPI('analyze and display metrics')).toBe(true)
    })
  })

  describe('generateSimpleHTMLWidget', () => {
    it('should generate widget for H1 heading', () => {
      const widget = generateSimpleHTMLWidget('h1 blinthe')
      
      expect(widget).not.toBeNull()
      expect(widget?.title).toBe('blinthe')
      expect(widget?.displayLogic.type).toBe('html')
      expect(widget?.displayLogic.content).toBe('<h1>blinthe</h1>')
    })

    it('should generate widget for H2 heading', () => {
      const widget = generateSimpleHTMLWidget('h2 test title')
      
      expect(widget).not.toBeNull()
      expect(widget?.title).toBe('test title')
      expect(widget?.displayLogic.content).toBe('<h2>test title</h2>')
    })

    it('should generate widget for HTML tags', () => {
      const widget = generateSimpleHTMLWidget('<h1>blinthe</h1>')
      
      expect(widget).not.toBeNull()
      expect(widget?.displayLogic.type).toBe('html')
      expect(widget?.displayLogic.content).toBe('<h1>blinthe</h1>')
    })

    it('should return null for non-simple requests', () => {
      expect(generateSimpleHTMLWidget('create a complex dashboard')).toBeNull()
      expect(generateSimpleHTMLWidget('fetch data and display')).toBeNull()
    })
  })

  describe('reformulateAsQuestion', () => {
    it('should reformulate H1 request as Vue 3 code generation task', () => {
      const reformulated = reformulateAsQuestion('h1 blinthe')
      
      expect(reformulated).toContain('Vue 3')
      expect(reformulated).toContain('blinthe')
      expect(reformulated).toContain('Blinthe')
      expect(reformulated).toContain('<template>')
    })

    it('should reformulate H2 request', () => {
      const reformulated = reformulateAsQuestion('h2 test')
      
      expect(reformulated).toContain('Vue 3')
      expect(reformulated).toContain('h2')
    })

    it('should handle generic widget requests', () => {
      const reformulated = reformulateAsQuestion('card display date')
      
      expect(reformulated).toContain('Vue 3')
      expect(reformulated).toContain('Blinthe')
    })

    it('should pass through questions as-is', () => {
      const question = 'How do I create a widget?'
      expect(reformulateAsQuestion(question)).toBe(question)
    })
  })
})
