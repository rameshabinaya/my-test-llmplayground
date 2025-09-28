/**
 * AI Model API Handlers
 * Unified interface for different AI model providers
 */
const axios = require('axios');

class APIHandlers {
    constructor(config) {
        this.config = config;
        this.providers = config.models.providers;
        this.timeout = config.security.requestTimeout || 30000;
        
        // Initialize HTTP client with default settings
        this.httpClient = axios.create({
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AI-Backend-Service/1.0'
            }
        });

        // Add request/response interceptors for logging
        this.setupInterceptors();
    }

    /**
     * Setup HTTP interceptors for logging and error handling
     */
    setupInterceptors() {
        // Request interceptor
        this.httpClient.interceptors.request.use(
            (config) => {
                console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Request Error:', error.message);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.httpClient.interceptors.response.use(
            (response) => {
                console.log(`✅ API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                const status = error.response?.status || 'Unknown';
                const url = error.config?.url || 'Unknown URL';
                console.error(`❌ API Error: ${status} ${url} - ${error.message}`);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Send request to appropriate AI model provider
     * @param {Object} routingResult - Result from model router
     * @param {string} prompt - User prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} AI model response
     */
    async sendRequest(routingResult, prompt, options = {}) {
        const { provider, model } = routingResult;

        try {
            // Validate provider availability
            if (!this.isProviderAvailable(provider)) {
                throw new Error(`Provider ${provider} is not available or not configured`);
            }

            // Route to appropriate handler
            switch (provider) {
                case 'openai':
                    return await this.handleOpenAI(model, prompt, options);
                case 'anthropic':
                    return await this.handleAnthropic(model, prompt, options);
                case 'google':
                    return await this.handleGoogle(model, prompt, options);
                case 'groq':
                    return await this.handleGroq(model, prompt, options);
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            console.error(`❌ API Handler Error for ${provider}:`, error.message);
            throw this.createStandardError(error, provider, model);
        }
    }

    /**
     * Handle OpenAI API requests
     * @param {string} model 
     * @param {string} prompt 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async handleOpenAI(model, prompt, options = {}) {
        const config = this.providers.openai;
        
        const requestData = {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            stream: false
        };

        const response = await this.httpClient.post(
            `${config.baseUrl}/chat/completions`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'OpenAI-Organization': config.organization || undefined
                }
            }
        );

        return this.formatOpenAIResponse(response.data, model);
    }

    /**
     * Handle Anthropic API requests
     * @param {string} model 
     * @param {string} prompt 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async handleAnthropic(model, prompt, options = {}) {
        const config = this.providers.anthropic;
        
        const requestData = {
            model: model,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };

        const response = await this.httpClient.post(
            `${config.baseUrl}/messages`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'anthropic-version': '2023-06-01',
                    'anthropic-beta': 'messages-2023-12-15'
                }
            }
        );

        return this.formatAnthropicResponse(response.data, model);
    }

    /**
     * Handle Google AI API requests
     * @param {string} model 
     * @param {string} prompt 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async handleGoogle(model, prompt, options = {}) {
        const config = this.providers.google;
        
        const requestData = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 1000,
                topP: options.topP || 0.8,
                topK: options.topK || 10
            }
        };

        const response = await this.httpClient.post(
            `${config.baseUrl}/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
            requestData
        );

        return this.formatGoogleResponse(response.data, model);
    }

    /**
     * Handle Groq API requests
     * @param {string} model 
     * @param {string} prompt 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async handleGroq(model, prompt, options = {}) {
        const config = this.providers.groq;
        
        const requestData = {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            stream: false
        };

        const response = await this.httpClient.post(
            `${config.baseUrl}/chat/completions`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`
                }
            }
        );

        return this.formatGroqResponse(response.data, model);
    }

    /**
     * Format OpenAI response to standard format
     * @param {Object} data 
     * @param {string} model 
     * @returns {Object}
     */
    formatOpenAIResponse(data, model) {
        return {
            provider: 'openai',
            model: model,
            response: data.choices[0]?.message?.content || '',
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0
            },
            metadata: {
                id: data.id,
                created: data.created,
                finishReason: data.choices[0]?.finish_reason
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format Anthropic response to standard format
     * @param {Object} data 
     * @param {string} model 
     * @returns {Object}
     */
    formatAnthropicResponse(data, model) {
        return {
            provider: 'anthropic',
            model: model,
            response: data.content[0]?.text || '',
            usage: {
                promptTokens: data.usage?.input_tokens || 0,
                completionTokens: data.usage?.output_tokens || 0,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
            },
            metadata: {
                id: data.id,
                role: data.role,
                stopReason: data.stop_reason
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format Google response to standard format
     * @param {Object} data 
     * @param {string} model 
     * @returns {Object}
     */
    formatGoogleResponse(data, model) {
        const candidate = data.candidates?.[0];
        return {
            provider: 'google',
            model: model,
            response: candidate?.content?.parts?.[0]?.text || '',
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount || 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata?.totalTokenCount || 0
            },
            metadata: {
                finishReason: candidate?.finishReason,
                safetyRatings: candidate?.safetyRatings
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format Groq response to standard format
     * @param {Object} data 
     * @param {string} model 
     * @returns {Object}
     */
    formatGroqResponse(data, model) {
        return {
            provider: 'groq',
            model: model,
            response: data.choices[0]?.message?.content || '',
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0
            },
            metadata: {
                id: data.id,
                created: data.created,
                finishReason: data.choices[0]?.finish_reason
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check if provider is available and configured
     * @param {string} provider 
     * @returns {boolean}
     */
    isProviderAvailable(provider) {
        const config = this.providers[provider];
        return config && config.apiKey && config.baseUrl;
    }

    /**
     * Get available providers
     * @returns {Array<string>}
     */
    getAvailableProviders() {
        return Object.keys(this.providers).filter(provider => 
            this.isProviderAvailable(provider)
        );
    }

    /**
     * Create standardized error object
     * @param {Error} error 
     * @param {string} provider 
     * @param {string} model 
     * @returns {Error}
     */
    createStandardError(error, provider, model) {
        const standardError = new Error();
        
        if (error.response) {
            // HTTP error response
            const status = error.response.status;
            const data = error.response.data;
            
            standardError.message = `${provider} API Error (${status}): ${data.error?.message || data.message || error.message}`;
            standardError.status = status;
            standardError.provider = provider;
            standardError.model = model;
            standardError.type = 'API_ERROR';
            
            // Handle specific error types
            if (status === 401) {
                standardError.type = 'AUTHENTICATION_ERROR';
            } else if (status === 429) {
                standardError.type = 'RATE_LIMIT_ERROR';
            } else if (status === 404) {
                standardError.type = 'MODEL_NOT_FOUND';
            }
        } else if (error.code === 'ECONNABORTED') {
            // Timeout error
            standardError.message = `Request timeout for ${provider} (${this.timeout}ms)`;
            standardError.type = 'TIMEOUT_ERROR';
            standardError.provider = provider;
            standardError.model = model;
        } else {
            // Network or other error
            standardError.message = `Network error for ${provider}: ${error.message}`;
            standardError.type = 'NETWORK_ERROR';
            standardError.provider = provider;
            standardError.model = model;
        }
        
        return standardError;
    }

    /**
     * Test provider connectivity
     * @param {string} provider 
     * @returns {Promise<Object>}
     */
    async testProvider(provider) {
        try {
            if (!this.isProviderAvailable(provider)) {
                throw new Error(`Provider ${provider} is not configured`);
            }

            // Send a simple test request
            const testPrompt = "Hello, this is a test message.";
            const routingResult = { provider, model: this.getDefaultModelForProvider(provider) };
            
            const response = await this.sendRequest(routingResult, testPrompt, { maxTokens: 10 });
            
            return {
                provider,
                status: 'available',
                responseTime: Date.now(),
                model: routingResult.model
            };
        } catch (error) {
            return {
                provider,
                status: 'unavailable',
                error: error.message,
                type: error.type || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Get default model for a provider
     * @param {string} provider 
     * @returns {string}
     */
    getDefaultModelForProvider(provider) {
        const defaultModels = {
            openai: 'gpt-4o',
            anthropic: 'claude-3.5-sonnet',
            google: 'gemini-2.0-flash-exp',
            groq: 'llama-3.3-70b-versatile'
        };
        
        return defaultModels[provider] || 'unknown';
    }

    /**
     * Get available models for a provider
     * @param {string} provider 
     * @returns {Array} Available models
     */
    getAvailableModels(provider) {
        if (!this.isProviderAvailable(provider)) {
            return [];
        }

        // Return models based on provider
        const modelMaps = {
            openai: ['gpt-4o', 'gpt-4.5-preview', 'o3-mini', 'o1-preview'],
            anthropic: ['claude-3.5-sonnet', 'claude-4-opus', 'claude-4-sonnet'],
            google: ['gemini-2.0-flash-exp', 'gemini-2.5-pro', 'gemini-1.5-pro'],
            groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
        };

        return modelMaps[provider] || [];
    }

    /**
     * Get service health status
     * @returns {Promise<Object>}
     */
    async getHealthStatus() {
        const providers = this.getAvailableProviders();
        const healthChecks = await Promise.allSettled(
            providers.map(provider => this.testProvider(provider))
        );

        const results = healthChecks.map((result, index) => ({
            provider: providers[index],
            ...result.value
        }));

        const availableCount = results.filter(r => r.status === 'available').length;
        
        return {
            status: availableCount > 0 ? 'healthy' : 'unhealthy',
            availableProviders: availableCount,
            totalProviders: providers.length,
            providers: results,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = APIHandlers;