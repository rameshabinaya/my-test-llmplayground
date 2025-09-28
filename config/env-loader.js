const dotenv = require('dotenv');
const path = require('path');

/**
 * Environment Variable Loader
 * Handles loading and validation of environment variables from .env file
 */
class EnvLoader {
    constructor() {
        this.config = {};
        this.isLoaded = false;
        this.errors = [];
    }

    /**
     * Load environment variables from .env file
     * @param {string} envPath - Path to .env file (optional)
     * @returns {Object} Configuration object
     */
    load(envPath = null) {
        try {
            // Determine .env file path
            const envFilePath = envPath || path.join(process.cwd(), '.env');
            
            // Load .env file
            const result = dotenv.config({ path: envFilePath });
            
            if (result.error) {
                throw new Error(`Failed to load .env file: ${result.error.message}`);
            }

            // Validate and parse configuration
            this.config = this.validateAndParseConfig();
            this.isLoaded = true;

            console.log('✅ Environment configuration loaded successfully');
            return this.config;

        } catch (error) {
            this.errors.push(error.message);
            console.error('❌ Failed to load environment configuration:', error.message);
            throw error;
        }
    }

    /**
     * Validate and parse environment variables
     * @returns {Object} Parsed configuration
     */
    validateAndParseConfig() {
        const config = {
            server: this.parseServerConfig(),
            models: this.parseModelConfig(),
            routing: this.parseRoutingConfig(),
            security: this.parseSecurityConfig(),
            logging: this.parseLoggingConfig()
        };

        // Validate required configurations
        this.validateRequiredConfig(config);

        return config;
    }

    /**
     * Parse server configuration
     */
    parseServerConfig() {
        return {
            port: parseInt(process.env.PORT) || 3000,
            nodeEnv: process.env.NODE_ENV || 'development'
        };
    }

    /**
     * Parse AI model configuration
     */
    parseModelConfig() {
        const models = {
            providers: {
                openai: {
                    apiKey: process.env.OPENAI_API_KEY,
                    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
                },
                anthropic: {
                    apiKey: process.env.ANTHROPIC_API_KEY,
                    baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
                },
                google: {
                    apiKey: process.env.GOOGLE_API_KEY,
                    baseUrl: process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1'
                },
                groq: {
                    apiKey: process.env.GROQ_API_KEY,
                    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
                }
            },
            default: {
                model: process.env.DEFAULT_MODEL || 'gpt-4.5-preview',
                provider: process.env.DEFAULT_PROVIDER || 'openai'
            }
        };

        return models;
    }

    /**
     * Parse routing configuration
     */
    parseRoutingConfig() {
        return {
            keywords: {
                coding: this.parseKeywords(process.env.CODING_KEYWORDS),
                reasoning: this.parseKeywords(process.env.REASONING_KEYWORDS),
                creative: this.parseKeywords(process.env.CREATIVE_KEYWORDS),
                fast: this.parseKeywords(process.env.FAST_KEYWORDS)
            },
            models: {
                coding: {
                    model: process.env.CODING_MODEL || 'claude-3.5-sonnet',
                    provider: process.env.CODING_PROVIDER || 'anthropic'
                },
                reasoning: {
                    model: process.env.REASONING_MODEL || 'o3-mini',
                    provider: process.env.REASONING_PROVIDER || 'openai'
                },
                creative: {
                    model: process.env.CREATIVE_MODEL || 'gpt-4.5-preview',
                    provider: process.env.CREATIVE_PROVIDER || 'openai'
                },
                fast: {
                    model: process.env.FAST_MODEL || 'llama-3.3-70b-versatile',
                    provider: process.env.FAST_PROVIDER || 'groq'
                }
            }
        };
    }

    /**
     * Parse security configuration
     */
    parseSecurityConfig() {
        return {
            rateLimitWindow: 60 * 1000, // 1 minute in milliseconds
            rateLimitMax: 1000, // Temporarily disable rate limiting for testing
            requestTimeout: parseInt(process.env.API_TIMEOUT) || 30000,
            corsOrigins: this.parseArray(process.env.ALLOWED_ORIGINS) || ['http://localhost:3000']
        };
    }

    /**
     * Parse logging configuration
     */
    parseLoggingConfig() {
        return {
            level: process.env.LOG_LEVEL || 'info',
            logRequests: process.env.LOG_REQUESTS === 'true'
        };
    }

    /**
     * Parse comma-separated keywords
     * @param {string} keywordsString 
     * @returns {Array} Array of keywords
     */
    parseKeywords(keywordsString) {
        if (!keywordsString) return [];
        return keywordsString.split(',').map(keyword => keyword.trim().toLowerCase());
    }

    /**
     * Parse comma-separated array
     * @param {string} arrayString 
     * @returns {Array} Parsed array
     */
    parseArray(arrayString) {
        if (!arrayString) return [];
        return arrayString.split(',').map(item => item.trim());
    }

    /**
     * Validate required configuration
     * @param {Object} config 
     */
    validateRequiredConfig(config) {
        const errors = [];

        // Check if at least one API key is provided
        const hasApiKey = Object.values(config.models.providers).some(provider => provider.apiKey);
        if (!hasApiKey) {
            errors.push('At least one AI provider API key must be configured');
        }

        // Validate default model configuration
        if (!config.models.default.model || !config.models.default.provider) {
            errors.push('Default model and provider must be specified');
        }

        // Validate port
        if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
            errors.push('Invalid port number specified');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }

    /**
     * Get configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        if (!this.isLoaded) {
            throw new Error('Configuration not loaded. Call load() first.');
        }
        return this.config;
    }

    /**
     * Check if configuration is loaded
     * @returns {boolean} True if loaded
     */
    isConfigLoaded() {
        return this.isLoaded;
    }

    /**
     * Get any errors that occurred during loading
     * @returns {Array} Array of error messages
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Reload configuration
     * @param {string} envPath - Path to .env file (optional)
     * @returns {Object} Reloaded configuration
     */
    reload(envPath = null) {
        this.config = {};
        this.isLoaded = false;
        this.errors = [];
        return this.load(envPath);
    }
}

module.exports = EnvLoader;