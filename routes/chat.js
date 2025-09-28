/**
 * Chat Routes
 * API routes for AI model interactions
 */
const express = require('express');
const router = express.Router();
const ErrorHandler = require('../middleware/error-handler');
const { chatRequestSchema, ValidationHelpers } = require('../middleware/validation');

/**
 * POST /api/chat
 * Send a prompt to AI models with automatic routing
 */
router.post('/', 
    ErrorHandler.validateRequest(chatRequestSchema),
    ErrorHandler.asyncHandler(async (req, res) => {
        const { prompt, options = {} } = req.validatedData;
        const { modelRouter, apiHandlers } = req.app.locals;

        try {
            console.log('🎯 Processing chat request:', {
                promptLength: prompt.length,
                options: options
            });

            // Additional prompt validation
            const promptValidation = ValidationHelpers.validatePrompt(prompt);
            if (!promptValidation.isValid) {
                throw ErrorHandler.createValidationError(promptValidation.error);
            }

            // Check for forced provider/model
            let routingResult;
            if (options.forceProvider && options.forceModel) {
                // Validate forced provider/model combination
                const validation = ValidationHelpers.validateModelProvider(
                    options.forceProvider, 
                    options.forceModel, 
                    req.app.locals.config
                );
                
                if (!validation.isValid) {
                    throw ErrorHandler.createValidationError(validation.error);
                }

                routingResult = {
                    provider: options.forceProvider,
                    model: options.forceModel,
                    category: 'forced',
                    confidence: 1.0,
                    routingReason: 'Forced by user request'
                };
            } else {
                // Use automatic routing
                routingResult = modelRouter.routePrompt(prompt, options);
            }

            console.log('📍 Routing result:', {
                provider: routingResult.provider,
                model: routingResult.model,
                category: routingResult.category,
                confidence: routingResult.confidence
            });

            // Validate options
            const optionsValidation = ValidationHelpers.validateOptions(options);
            if (!optionsValidation.isValid) {
                throw ErrorHandler.createValidationError(optionsValidation.error);
            }

            // Send request to AI provider
            const startTime = Date.now();
            const aiResponse = await apiHandlers.sendRequest(
                routingResult, 
                promptValidation.cleanPrompt, 
                optionsValidation.options
            );
            const responseTime = Date.now() - startTime;

            console.log('✅ AI response received:', {
                provider: aiResponse.provider,
                model: aiResponse.model,
                responseTime: `${responseTime}ms`,
                tokens: aiResponse.usage.totalTokens
            });

            // Return successful response
            res.json({
                success: true,
                data: {
                    response: aiResponse.response,
                    routing: {
                        provider: routingResult.provider,
                        model: routingResult.model,
                        category: routingResult.category,
                        confidence: routingResult.confidence,
                        reason: routingResult.routingReason
                    },
                    usage: aiResponse.usage,
                    metadata: {
                        responseTime,
                        timestamp: aiResponse.timestamp,
                        requestId: generateRequestId()
                    }
                }
            });

        } catch (error) {
            console.error('❌ Chat request failed:', error.message);
            throw error; // Let error handler middleware handle it
        }
    })
);

/**
 * POST /api/chat/stream
 * Stream AI responses (placeholder for future implementation)
 */
router.post('/stream',
    ErrorHandler.validateRequest(chatRequestSchema),
    ErrorHandler.asyncHandler(async (req, res) => {
        // Set headers for Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Send initial message
        res.write(`data: ${JSON.stringify({
            type: 'info',
            message: 'Streaming not yet implemented. Use /api/chat for regular requests.'
        })}\n\n`);

        // Close connection
        res.write(`data: ${JSON.stringify({
            type: 'done'
        })}\n\n`);
        
        res.end();
    })
);

/**
 * GET /api/chat/models
 * Get available models and providers
 */
router.get('/models', 
    ErrorHandler.asyncHandler(async (req, res) => {
        const { apiHandlers, modelRouter } = req.app.locals;
        
        try {
            const availableProviders = apiHandlers.getAvailableProviders();
            const routingStats = modelRouter.getRoutingStats();
            
            const models = {};
            availableProviders.forEach(provider => {
                models[provider] = apiHandlers.getAvailableModels ? 
                    apiHandlers.getAvailableModels(provider) : 
                    [`${provider}-default-model`];
            });

            res.json({
                success: true,
                data: {
                    providers: availableProviders,
                    models: models,
                    routing: {
                        categories: routingStats.configuredCategories,
                        defaultModel: routingStats.defaultModel,
                        totalKeywords: routingStats.totalKeywords
                    }
                }
            });
        } catch (error) {
            console.error('❌ Failed to get models:', error.message);
            throw error;
        }
    })
);

/**
 * POST /api/chat/test-provider
 * Test a specific provider
 */
router.post('/test-provider',
    ErrorHandler.validateRequest(require('../middleware/validation').providerTestSchema),
    ErrorHandler.asyncHandler(async (req, res) => {
        const { provider } = req.validatedData;
        const { apiHandlers } = req.app.locals;

        try {
            console.log(`🧪 Testing provider: ${provider}`);
            
            const testResult = await apiHandlers.testProvider(provider);
            
            res.json({
                success: true,
                data: testResult
            });
        } catch (error) {
            console.error(`❌ Provider test failed for ${provider}:`, error.message);
            throw error;
        }
    })
);

/**
 * GET /api/chat/health
 * Get service health status
 */
router.get('/health',
    ErrorHandler.asyncHandler(async (req, res) => {
        const { apiHandlers } = req.app.locals;
        const detailed = req.query.detailed === 'true';

        try {
            if (detailed) {
                const healthStatus = await apiHandlers.getHealthStatus();
                res.json({
                    success: true,
                    data: healthStatus
                });
            } else {
                const availableProviders = apiHandlers.getAvailableProviders();
                res.json({
                    success: true,
                    data: {
                        status: availableProviders.length > 0 ? 'healthy' : 'unhealthy',
                        availableProviders: availableProviders.length,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            throw error;
        }
    })
);

/**
 * GET /api/chat/stats
 * Get routing and usage statistics
 */
router.get('/stats',
    ErrorHandler.asyncHandler(async (req, res) => {
        const { modelRouter } = req.app.locals;

        try {
            const routingStats = modelRouter.getRoutingStats();
            
            res.json({
                success: true,
                data: {
                    routing: routingStats,
                    server: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        version: process.version,
                        platform: process.platform
                    },
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Stats request failed:', error.message);
            throw error;
        }
    })
);

/**
 * Generate unique request ID
 * @returns {string}
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = router;