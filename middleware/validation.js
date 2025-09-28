/**
 * Request Validation Schemas
 * Joi validation schemas for API requests
 */
const Joi = require('joi');

// Chat request validation schema
const chatRequestSchema = Joi.object({
    prompt: Joi.string()
        .min(1)
        .max(10000)
        .required()
        .messages({
            'string.empty': 'Prompt cannot be empty',
            'string.min': 'Prompt must be at least 1 character long',
            'string.max': 'Prompt cannot exceed 10,000 characters',
            'any.required': 'Prompt is required'
        }),
    
    options: Joi.object({
        maxTokens: Joi.number()
            .integer()
            .min(1)
            .max(4000)
            .default(1000)
            .messages({
                'number.base': 'maxTokens must be a number',
                'number.integer': 'maxTokens must be an integer',
                'number.min': 'maxTokens must be at least 1',
                'number.max': 'maxTokens cannot exceed 4000'
            }),
        
        temperature: Joi.number()
            .min(0)
            .max(2)
            .default(0.7)
            .messages({
                'number.base': 'temperature must be a number',
                'number.min': 'temperature must be at least 0',
                'number.max': 'temperature cannot exceed 2'
            }),
        
        topP: Joi.number()
            .min(0)
            .max(1)
            .default(0.8)
            .messages({
                'number.base': 'topP must be a number',
                'number.min': 'topP must be at least 0',
                'number.max': 'topP cannot exceed 1'
            }),
        
        topK: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.base': 'topK must be a number',
                'number.integer': 'topK must be an integer',
                'number.min': 'topK must be at least 1',
                'number.max': 'topK cannot exceed 100'
            }),
        
        forceProvider: Joi.string()
            .valid('openai', 'anthropic', 'google', 'groq')
            .optional()
            .messages({
                'any.only': 'forceProvider must be one of: openai, anthropic, google, groq'
            }),
        
        forceModel: Joi.string()
            .optional()
            .messages({
                'string.base': 'forceModel must be a string'
            })
    }).optional().default({})
});

// Health check request schema
const healthRequestSchema = Joi.object({
    detailed: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'detailed must be a boolean'
        })
});

// Provider test request schema
const providerTestSchema = Joi.object({
    provider: Joi.string()
        .valid('openai', 'anthropic', 'google', 'groq')
        .required()
        .messages({
            'any.only': 'provider must be one of: openai, anthropic, google, groq',
            'any.required': 'provider is required'
        })
});

// Model list request schema
const modelListSchema = Joi.object({
    provider: Joi.string()
        .valid('openai', 'anthropic', 'google', 'groq')
        .optional()
        .messages({
            'any.only': 'provider must be one of: openai, anthropic, google, groq'
        })
});

// Configuration validation schema
const configValidationSchema = Joi.object({
    server: Joi.object({
        port: Joi.number().integer().min(1).max(65535).required(),
        host: Joi.string().required(),
        environment: Joi.string().valid('development', 'production', 'test').required()
    }).required(),
    
    models: Joi.object({
        providers: Joi.object({
            openai: Joi.object({
                apiKey: Joi.string().required(),
                baseUrl: Joi.string().uri().required(),
                organization: Joi.string().optional()
            }).optional(),
            
            anthropic: Joi.object({
                apiKey: Joi.string().required(),
                baseUrl: Joi.string().uri().required()
            }).optional(),
            
            google: Joi.object({
                apiKey: Joi.string().required(),
                baseUrl: Joi.string().uri().required()
            }).optional(),
            
            groq: Joi.object({
                apiKey: Joi.string().required(),
                baseUrl: Joi.string().uri().required()
            }).optional()
        }).required(),
        
        default: Joi.object({
            provider: Joi.string().required(),
            model: Joi.string().required()
        }).required()
    }).required(),
    
    routing: Joi.object({
        keywords: Joi.object().pattern(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).required(),
        
        models: Joi.object().pattern(
            Joi.string(),
            Joi.object({
                provider: Joi.string().required(),
                model: Joi.string().required()
            })
        ).required()
    }).required(),
    
    security: Joi.object({
        rateLimitWindow: Joi.number().integer().min(1).required(),
        rateLimitMax: Joi.number().integer().min(1).required(),
        requestTimeout: Joi.number().integer().min(1000).required(),
        corsOrigins: Joi.array().items(Joi.string()).required()
    }).required(),
    
    logging: Joi.object({
        level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
        requests: Joi.boolean().required(),
        responses: Joi.boolean().required()
    }).required()
});

/**
 * Validation helper functions
 */
class ValidationHelpers {
    /**
     * Validate prompt content
     * @param {string} prompt 
     * @returns {Object}
     */
    static validatePrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return {
                isValid: false,
                error: 'Prompt must be a non-empty string'
            };
        }

        if (prompt.trim().length === 0) {
            return {
                isValid: false,
                error: 'Prompt cannot be empty or only whitespace'
            };
        }

        if (prompt.length > 10000) {
            return {
                isValid: false,
                error: 'Prompt cannot exceed 10,000 characters'
            };
        }

        // Check for potentially harmful content
        const harmfulPatterns = [
            /system\s*prompt/i,
            /ignore\s*previous\s*instructions/i,
            /jailbreak/i,
            /override\s*safety/i
        ];

        for (const pattern of harmfulPatterns) {
            if (pattern.test(prompt)) {
                return {
                    isValid: false,
                    error: 'Prompt contains potentially harmful content'
                };
            }
        }

        return {
            isValid: true,
            cleanPrompt: prompt.trim()
        };
    }

    /**
     * Validate model and provider combination
     * @param {string} provider 
     * @param {string} model 
     * @param {Object} config 
     * @returns {Object}
     */
    static validateModelProvider(provider, model, config) {
        const validProviders = ['openai', 'anthropic', 'google', 'groq'];
        
        if (!validProviders.includes(provider)) {
            return {
                isValid: false,
                error: `Invalid provider: ${provider}. Must be one of: ${validProviders.join(', ')}`
            };
        }

        // Check if provider is configured
        const providerConfig = config.models.providers[provider];
        if (!providerConfig || !providerConfig.apiKey) {
            return {
                isValid: false,
                error: `Provider ${provider} is not configured or missing API key`
            };
        }

        // Validate model for provider (basic validation)
        const modelPatterns = {
            openai: /^(gpt-|o1-|o3-)/i,
            anthropic: /^claude-/i,
            google: /^gemini-/i,
            groq: /^(llama-|mixtral-)/i
        };

        const pattern = modelPatterns[provider];
        if (pattern && !pattern.test(model)) {
            return {
                isValid: false,
                error: `Invalid model ${model} for provider ${provider}`
            };
        }

        return {
            isValid: true,
            provider,
            model
        };
    }

    /**
     * Validate API options
     * @param {Object} options 
     * @returns {Object}
     */
    static validateOptions(options = {}) {
        const validatedOptions = {};

        // Validate maxTokens
        if (options.maxTokens !== undefined) {
            const maxTokens = parseInt(options.maxTokens);
            if (isNaN(maxTokens) || maxTokens < 1 || maxTokens > 4000) {
                return {
                    isValid: false,
                    error: 'maxTokens must be a number between 1 and 4000'
                };
            }
            validatedOptions.maxTokens = maxTokens;
        }

        // Validate temperature
        if (options.temperature !== undefined) {
            const temperature = parseFloat(options.temperature);
            if (isNaN(temperature) || temperature < 0 || temperature > 2) {
                return {
                    isValid: false,
                    error: 'temperature must be a number between 0 and 2'
                };
            }
            validatedOptions.temperature = temperature;
        }

        // Validate topP
        if (options.topP !== undefined) {
            const topP = parseFloat(options.topP);
            if (isNaN(topP) || topP < 0 || topP > 1) {
                return {
                    isValid: false,
                    error: 'topP must be a number between 0 and 1'
                };
            }
            validatedOptions.topP = topP;
        }

        // Validate topK
        if (options.topK !== undefined) {
            const topK = parseInt(options.topK);
            if (isNaN(topK) || topK < 1 || topK > 100) {
                return {
                    isValid: false,
                    error: 'topK must be a number between 1 and 100'
                };
            }
            validatedOptions.topK = topK;
        }

        return {
            isValid: true,
            options: validatedOptions
        };
    }

    /**
     * Sanitize user input
     * @param {string} input 
     * @returns {string}
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
            .replace(/\s+/g, ' '); // Normalize whitespace
    }

    /**
     * Check rate limiting requirements
     * @param {Object} req 
     * @returns {Object}
     */
    static checkRateLimit(req) {
        // This would integrate with your rate limiting middleware
        // For now, just return valid
        return {
            isValid: true,
            remaining: 100,
            resetTime: Date.now() + 60000
        };
    }
}

module.exports = {
    chatRequestSchema,
    healthRequestSchema,
    providerTestSchema,
    modelListSchema,
    configValidationSchema,
    ValidationHelpers
};