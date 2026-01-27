/**
 * Perplexity Model Selection - Intelligent routing between sonar and sonar-pro
 * 
 * Valid Perplexity models:
 * - sonar: Base search, fast & cost-effective for simple queries
 * - sonar-pro: Advanced search, complex analysis (recommended for widget creation)
 * - sonar-reasoning-pro: Advanced reasoning with search (for deep analysis)
 */

export function usePerplexityModel() {
  /**
   * Select appropriate Perplexity model based on context and query complexity
   * @param query - The user's prompt/question
   * @param options - Additional options to guide model selection
   * @returns The model name to use for the API call
   */
  function selectModel(
    query: string,
    options: {
      forceAdvanced?: boolean
      requiresReasoning?: boolean
      isWidgetCreation?: boolean
      isSimpleQuery?: boolean
    } = {}
  ): string {
    // Explicit model override options
    if (options.requiresReasoning) {
      return 'sonar-reasoning-pro'
    }

    if (options.forceAdvanced || options.isWidgetCreation) {
      return 'sonar-pro'
    }

    if (options.isSimpleQuery) {
      return 'sonar'
    }

    // Auto-detect complexity from query characteristics
    const isComplex = detectComplexity(query)
    return isComplex ? 'sonar-pro' : 'sonar'
  }

  /**
   * Detect if a query requires the advanced model
   * Uses heuristics based on query length, keywords, and structure
   */
  function detectComplexity(query: string): boolean {
    // Complexity indicators that suggest sonar-pro is needed
    const complexityIndicators = [
      // Analytical/creative tasks
      /create|design|build|implement|analyze|evaluate|compare|contrast/i,
      // Reasoning-heavy language
      /explain.*why|how|reasoning|logic|mechanism|process/i,
      // Multi-part queries
      /and|or|also|additionally|moreover/i,
      // Long queries (more context = likely more complex)
      query.length > 150,
      // Specific technical/domain language
      /algorithm|architecture|strategy|framework|methodology/i,
    ]

    // If multiple indicators match, definitely use advanced model
    const matchCount = complexityIndicators.filter((indicator) => {
      if (indicator instanceof RegExp) {
        return indicator.test(query)
      }
      return indicator // boolean indicators like query.length > 150
    }).length

    return matchCount > 0
  }

  /**
   * Get model cost estimate for user feedback
   * Helps users understand why a particular model was selected
   */
  function getModelInfo(model: string): { name: string; tier: 'basic' | 'advanced' | 'reasoning' } {
    switch (model) {
      case 'sonar':
        return { name: 'Sonar (Basic)', tier: 'basic' }
      case 'sonar-pro':
        return { name: 'Sonar Pro (Advanced)', tier: 'advanced' }
      case 'sonar-reasoning-pro':
        return { name: 'Sonar Reasoning Pro (Reasoning)', tier: 'reasoning' }
      default:
        return { name: 'Unknown', tier: 'basic' }
    }
  }

  return {
    selectModel,
    detectComplexity,
    getModelInfo,
  }
}
