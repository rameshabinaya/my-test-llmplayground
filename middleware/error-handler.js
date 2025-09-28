/**
 * Error Handling Middleware
 * Comprehensive error handling for the AI backend service
 */

class ErrorHandler {
    /**
     * Express error handling middleware
     * @param {Error} err 
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static handleError(err, req, res, next) {
        console.error('🚨 Error occurred:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Determine error type and create appropriate response
        const errorResponse = ErrorHandler.createErrorResponse(err);
        
        // Log error details for monitoring
        ErrorHandler.logError(err, req);
        
        res.status(errorResponse.status).json(errorResponse);
    }

    /**
     * Create standardized error response
     * @param {Error} err 
     * @returns {Object}
     */
    static createErrorResponse(err) {
        const baseResponse = {
            success: false,
            timestamp: new Date().toISOString(),
            error: {
                message: err.message || 'An unexpected error occurred',
                type: err.type || 'UNKNOWN_ERROR'
            }
        };

        // Handle different error types
        switch (err.type) {
            case 'VALIDATION_ERROR':
                return {
                    ...baseResponse,
                    status: 400,
                    error: {
                        ...baseResponse.error,
                        details: err.details || null
                    }
                };

            case 'AUTHENTICATION_ERROR':
                return {
                    ...baseResponse,
                    status: 401,
                    error: {
                        ...baseResponse.error,
                        message: 'Authentication failed - invalid API key'
                    }
                };

            case 'RATE_LIMIT_ERROR':
                return {
                    ...baseResponse,
                    status: 429,
                    error: {
                        ...baseResponse.error,
                        message: 'Rate limit exceeded - please try again later',
                        retryAfter: err.retryAfter || 60
                    }
                };

            case 'MODEL_NOT_FOUND':
                return {
                    ...baseResponse,
                    status: 404,
                    error: {
                        ...baseResponse.error,
                        message: `Model not found: ${err.model || 'unknown'}`,
                        provider: err.provider || 'unknown'
                    }
                };

            case 'PROVIDER_UNAVAILABLE':
                return {
                    ...baseResponse,
                    status: 503,
                    error: {
                        ...baseResponse.error,
                        message: `AI provider unavailable: ${err.provider || 'unknown'}`,
                        provider: err.provider || 'unknown'
                    }
                };

            case 'TIMEOUT_ERROR':
                return {
                    ...baseResponse,
                    status: 408,
                    error: {
                        ...baseResponse.error,
                        message: 'Request timeout - the AI service took too long to respond'
                    }
                };

            case 'CONFIG_ERROR':
                return {
                    ...baseResponse,
                    status: 500,
                    error: {
                        ...baseResponse.error,
                        message: 'Configuration error - please check server setup'
                    }
                };

            case 'API_ERROR':
                return {
                    ...baseResponse,
                    status: err.status || 500,
                    error: {
                        ...baseResponse.error,
                        provider: err.provider || 'unknown',
                        model: err.model || 'unknown'
                    }
                };

            default:
                return {
                    ...baseResponse,
                    status: 500,
                    error: {
                        ...baseResponse.error,
                        message: 'Internal server error'
                    }
                };
        }
    }

    /**
     * Log error details for monitoring
     * @param {Error} err 
     * @param {Object} req 
     */
    static logError(err, req) {
        const logData = {
            timestamp: new Date().toISOString(),
            error: {
                message: err.message,
                type: err.type || 'UNKNOWN_ERROR',
                stack: err.stack
            },
            request: {
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip || req.connection.remoteAddress
            },
            provider: err.provider || null,
            model: err.model || null
        };

        // In production, you might want to send this to a logging service
        console.error('📊 Error Log:', JSON.stringify(logData, null, 2));
    }

    /**
     * Handle async errors in Express routes
     * @param {Function} fn 
     * @returns {Function}
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Validate request data
     * @param {Object} schema 
     * @returns {Function}
     */
    static validateRequest(schema) {
        return (req, res, next) => {
            try {
                const { error, value } = schema.validate(req.body);
                
                if (error) {
                    const validationError = new Error('Request validation failed');
                    validationError.type = 'VALIDATION_ERROR';
                    validationError.details = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value
                    }));
                    throw validationError;
                }
                
                req.validatedData = value;
                next();
            } catch (err) {
                next(err);
            }
        };
    }

    /**
     * Handle 404 errors
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static handle404(req, res, next) {
        const error = new Error(`Route not found: ${req.method} ${req.url}`);
        error.type = 'NOT_FOUND';
        error.status = 404;
        next(error);
    }

    /**
     * Create custom error
     * @param {string} message 
     * @param {string} type 
     * @param {number} status 
     * @param {Object} metadata 
     * @returns {Error}
     */
    static createError(message, type = 'CUSTOM_ERROR', status = 500, metadata = {}) {
        const error = new Error(message);
        error.type = type;
        error.status = status;
        
        // Add metadata to error object
        Object.keys(metadata).forEach(key => {
            error[key] = metadata[key];
        });
        
        return error;
    }

    /**
     * Environment configuration error handler
     * @param {string} missingVar 
     * @returns {Error}
     */
    static createConfigError(missingVar) {
        return ErrorHandler.createError(
            `Missing required environment variable: ${missingVar}`,
            'CONFIG_ERROR',
            500,
            { missingVariable: missingVar }
        );
    }

    /**
     * Provider unavailable error
     * @param {string} provider 
     * @param {string} reason 
     * @returns {Error}
     */
    static createProviderError(provider, reason = 'Service unavailable') {
        return ErrorHandler.createError(
            `Provider ${provider} is unavailable: ${reason}`,
            'PROVIDER_UNAVAILABLE',
            503,
            { provider, reason }
        );
    }

    /**
     * Model not found error
     * @param {string} model 
     * @param {string} provider 
     * @returns {Error}
     */
    static createModelError(model, provider) {
        return ErrorHandler.createError(
            `Model ${model} not found for provider ${provider}`,
            'MODEL_NOT_FOUND',
            404,
            { model, provider }
        );
    }

    /**
     * Rate limit error
     * @param {number} retryAfter 
     * @returns {Error}
     */
    static createRateLimitError(retryAfter = 60) {
        return ErrorHandler.createError(
            'Rate limit exceeded',
            'RATE_LIMIT_ERROR',
            429,
            { retryAfter }
        );
    }

    /**
     * Validation error
     * @param {string} message 
     * @param {Array} details 
     * @returns {Error}
     */
    static createValidationError(message, details = []) {
        return ErrorHandler.createError(
            message,
            'VALIDATION_ERROR',
            400,
            { details }
        );
    }

    /**
     * Timeout error
     * @param {number} timeout 
     * @returns {Error}
     */
    static createTimeoutError(timeout) {
        return ErrorHandler.createError(
            `Request timed out after ${timeout}ms`,
            'TIMEOUT_ERROR',
            408,
            { timeout }
        );
    }

    /**
     * Check if error is operational (expected) vs programming error
     * @param {Error} error 
     * @returns {boolean}
     */
    static isOperationalError(error) {
        const operationalTypes = [
            'VALIDATION_ERROR',
            'AUTHENTICATION_ERROR',
            'RATE_LIMIT_ERROR',
            'MODEL_NOT_FOUND',
            'PROVIDER_UNAVAILABLE',
            'TIMEOUT_ERROR',
            'API_ERROR',
            'NOT_FOUND'
        ];
        
        return operationalTypes.includes(error.type);
    }

    /**
     * Get error statistics
     * @returns {Object}
     */
    static getErrorStats() {
        // In a real application, you'd track these metrics
        return {
            totalErrors: 0,
            errorsByType: {},
            errorsByProvider: {},
            lastError: null,
            uptime: process.uptime()
        };
    }
}

module.exports = ErrorHandler;