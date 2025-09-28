/**
 * AI Model Router Service
 * Analyzes user prompts and routes them to appropriate AI models
 */
class ModelRouter {
    constructor(config) {
        this.config = config;
        this.routingConfig = config.routing;
        this.modelConfig = config.models;
    }

    /**
     * Route a user prompt to the most appropriate AI model
     * @param {string} prompt - User input prompt
     * @param {Object} options - Additional routing options
     * @returns {Object} Selected model and provider information
     */
    routePrompt(prompt, options = {}) {
        try {
            // Validate input
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Invalid prompt: must be a non-empty string');
            }

            // Clean and normalize prompt for analysis
            const normalizedPrompt = this.normalizePrompt(prompt);

            // Determine prompt category based on content analysis
            const category = this.analyzePromptCategory(normalizedPrompt);

            // Get model configuration for the determined category
            const modelInfo = this.getModelForCategory(category);

            // Add routing metadata
            const routingResult = {
                ...modelInfo,
                category,
                confidence: this.calculateConfidence(normalizedPrompt, category),
                prompt: prompt,
                normalizedPrompt,
                timestamp: new Date().toISOString(),
                routingReason: this.getRoutingReason(category, normalizedPrompt)
            };

            console.log(`🎯 Routed prompt to ${modelInfo.provider}/${modelInfo.model} (category: ${category})`);
            return routingResult;

        } catch (error) {
            console.error('❌ Model routing failed:', error.message);
            
            // Fallback to default model
            return this.getDefaultModel(error.message);
        }
    }

    /**
     * Normalize prompt for analysis
     * @param {string} prompt 
     * @returns {string} Normalized prompt
     */
    normalizePrompt(prompt) {
        return prompt
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')  // Remove special characters
            .replace(/\s+/g, ' ');     // Normalize whitespace
    }

    /**
     * Analyze prompt to determine category
     * @param {string} normalizedPrompt 
     * @returns {string} Prompt category
     */
    analyzePromptCategory(normalizedPrompt) {
        const categories = ['coding', 'reasoning', 'creative', 'fast'];
        const scores = {};

        // Initialize scores
        categories.forEach(category => {
            scores[category] = 0;
        });

        // Score based on keyword matching
        categories.forEach(category => {
            const keywords = this.routingConfig.keywords[category] || [];
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = normalizedPrompt.match(regex);
                if (matches) {
                    scores[category] += matches.length;
                }
            });
        });

        // Apply contextual analysis
        this.applyContextualAnalysis(normalizedPrompt, scores);

        // Apply length-based heuristics
        this.applyLengthHeuristics(normalizedPrompt, scores);

        // Find category with highest score
        const bestCategory = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        // If no clear winner, use additional heuristics
        if (scores[bestCategory] === 0) {
            return this.fallbackCategoryAnalysis(normalizedPrompt);
        }

        return bestCategory;
    }

    /**
     * Apply contextual analysis to improve categorization
     * @param {string} prompt 
     * @param {Object} scores 
     */
    applyContextualAnalysis(prompt, scores) {
        // Coding context indicators
        if (prompt.includes('error') || prompt.includes('bug') || prompt.includes('fix')) {
            scores.coding += 2;
        }
        
        if (prompt.match(/\b(function|class|method|variable|array|object)\b/)) {
            scores.coding += 3;
        }

        // Reasoning context indicators
        if (prompt.includes('why') || prompt.includes('how') || prompt.includes('explain')) {
            scores.reasoning += 2;
        }

        if (prompt.match(/\b(because|therefore|thus|hence|consequently)\b/)) {
            scores.reasoning += 2;
        }

        // Creative context indicators
        if (prompt.includes('story') || prompt.includes('creative') || prompt.includes('imagine')) {
            scores.creative += 3;
        }

        if (prompt.match(/\b(write|create|generate|compose|design)\b/)) {
            scores.creative += 2;
        }

        // Fast context indicators
        if (prompt.includes('quick') || prompt.includes('brief') || prompt.includes('short')) {
            scores.fast += 3;
        }

        if (prompt.length < 50) {
            scores.fast += 1;
        }
    }

    /**
     * Apply length-based heuristics
     * @param {string} prompt 
     * @param {Object} scores 
     */
    applyLengthHeuristics(prompt, scores) {
        const length = prompt.length;

        if (length < 30) {
            scores.fast += 2;
        } else if (length > 200) {
            scores.reasoning += 1;
            scores.creative += 1;
        }
    }

    /**
     * Fallback category analysis when no keywords match
     * @param {string} prompt 
     * @returns {string} Category
     */
    fallbackCategoryAnalysis(prompt) {
        // Simple heuristics for fallback
        if (prompt.length < 50) {
            return 'fast';
        }

        if (prompt.includes('?')) {
            return 'reasoning';
        }

        if (prompt.match(/\b(tell|write|create|make)\b/)) {
            return 'creative';
        }

        return 'reasoning'; // Default fallback
    }

    /**
     * Get model configuration for a category
     * @param {string} category 
     * @returns {Object} Model information
     */
    getModelForCategory(category) {
        const categoryModel = this.routingConfig.models[category];
        
        if (!categoryModel) {
            console.warn(`⚠️ No model configured for category: ${category}, using default`);
            return this.getDefaultModel();
        }

        return {
            model: categoryModel.model,
            provider: categoryModel.provider,
            category
        };
    }

    /**
     * Get default model configuration
     * @param {string} reason - Reason for using default
     * @returns {Object} Default model information
     */
    getDefaultModel(reason = 'No specific routing determined') {
        return {
            model: this.modelConfig.default.model,
            provider: this.modelConfig.default.provider,
            category: 'default',
            confidence: 0.5,
            routingReason: reason,
            isDefault: true
        };
    }

    /**
     * Calculate confidence score for routing decision
     * @param {string} prompt 
     * @param {string} category 
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(prompt, category) {
        const keywords = this.routingConfig.keywords[category] || [];
        let matches = 0;
        
        keywords.forEach(keyword => {
            if (prompt.includes(keyword)) {
                matches++;
            }
        });

        // Base confidence on keyword matches and prompt characteristics
        let confidence = Math.min(matches / Math.max(keywords.length * 0.3, 1), 1);
        
        // Adjust based on prompt length and clarity
        if (prompt.length > 100) confidence += 0.1;
        if (prompt.includes('?')) confidence += 0.1;
        
        return Math.min(Math.max(confidence, 0.1), 1.0);
    }

    /**
     * Get human-readable routing reason
     * @param {string} category 
     * @param {string} prompt 
     * @returns {string} Routing reason
     */
    getRoutingReason(category, prompt) {
        const reasons = {
            coding: 'Detected programming/development related content',
            reasoning: 'Identified analytical or problem-solving request',
            creative: 'Recognized creative writing or generation task',
            fast: 'Optimized for quick, simple responses'
        };

        return reasons[category] || 'Routed based on content analysis';
    }

    /**
     * Get available models for a provider
     * @param {string} provider 
     * @returns {Array} Available models
     */
    getAvailableModels(provider) {
        const providerConfig = this.modelConfig.providers[provider];
        if (!providerConfig || !providerConfig.apiKey) {
            return [];
        }

        // Return models based on provider
        const modelMaps = {
            openai: ['gpt-4.5-preview', 'gpt-4o', 'o3-mini', 'o1-preview'],
            anthropic: ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-sonnet'],
            google: ['gemini-2.5-pro', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'],
            groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
        };

        return modelMaps[provider] || [];
    }

    /**
     * Validate if a model is available
     * @param {string} model 
     * @param {string} provider 
     * @returns {boolean} True if available
     */
    isModelAvailable(model, provider) {
        const availableModels = this.getAvailableModels(provider);
        return availableModels.includes(model);
    }

    /**
     * Get routing statistics
     * @returns {Object} Routing statistics
     */
    getRoutingStats() {
        return {
            availableProviders: Object.keys(this.modelConfig.providers).filter(
                provider => this.modelConfig.providers[provider].apiKey
            ),
            configuredCategories: Object.keys(this.routingConfig.models),
            defaultModel: this.modelConfig.default,
            totalKeywords: Object.values(this.routingConfig.keywords)
                .reduce((total, keywords) => total + keywords.length, 0)
        };
    }
}

module.exports = ModelRouter;