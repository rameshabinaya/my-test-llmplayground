/**
 * AI Backend Service - Main Server
 * Dynamic AI model selection and routing service
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import custom modules
const EnvLoader = require('./config/env-loader');
const ModelRouter = require('./services/model-router');
const APIHandlers = require('./services/api-handlers');
const ErrorHandler = require('./middleware/error-handler');
const chatRoutes = require('./routes/chat');

class AIBackendServer {
    constructor() {
        this.app = express();
        this.config = null;
        this.modelRouter = null;
        this.apiHandlers = null;
        this.server = null;
    }

    /**
     * Initialize the server
     */
    async initialize() {
        try {
            console.log('🚀 Initializing AI Backend Service...');

            // Load and validate configuration
            await this.loadConfiguration();

            // Setup Express middleware
            this.setupMiddleware();

            // Initialize services
            this.initializeServices();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            console.log('✅ Server initialization completed');
        } catch (error) {
            console.error('❌ Server initialization failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Load and validate configuration
     */
    async loadConfiguration() {
        try {
            console.log('📋 Loading configuration...');
            const envLoader = new EnvLoader();
            this.config = envLoader.load();
            console.log('✅ Configuration loaded successfully');
            
            // Log available providers (without API keys)
            const providers = Object.keys(this.config.models.providers)
                .filter(provider => this.config.models.providers[provider].apiKey);
            console.log('🔑 Available providers:', providers.join(', '));
            
        } catch (error) {
            console.error('❌ Configuration loading failed:', error.message);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        console.log('🛡️ Setting up middleware...');

        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: this.config.security.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting - temporarily disabled for testing
        // const limiter = rateLimit({
        //     windowMs: this.config.security.rateLimitWindow,
        //     max: this.config.security.rateLimitMax,
        //     message: {
        //         success: false,
        //         error: {
        //             message: 'Too many requests, please try again later',
        //             type: 'RATE_LIMIT_ERROR'
        //         }
        //     },
        //     standardHeaders: true,
        //     legacyHeaders: false,
        // });
        // this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ 
            limit: '10mb',
            strict: true
        }));
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '10mb' 
        }));

        // Request logging
        if (this.config.logging.requests) {
            this.app.use((req, res, next) => {
                const start = Date.now();
                res.on('finish', () => {
                    const duration = Date.now() - start;
                    console.log(`📝 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
                });
                next();
            });
        }

        // Add config and services to app locals for route access
        this.app.locals.config = this.config;

        console.log('✅ Middleware setup completed');
    }

    /**
     * Initialize core services
     */
    initializeServices() {
        console.log('⚙️ Initializing services...');

        try {
            // Initialize model router
            this.modelRouter = new ModelRouter(this.config);
            this.app.locals.modelRouter = this.modelRouter;
            console.log('✅ Model router initialized');

            // Initialize API handlers
            this.apiHandlers = new APIHandlers(this.config);
            this.app.locals.apiHandlers = this.apiHandlers;
            console.log('✅ API handlers initialized');

            console.log('✅ All services initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        console.log('🛣️ Setting up routes...');

        // Serve static files (CSS, JS, etc.)
        this.app.use(express.static(path.join(__dirname)));

        // Health check endpoint (before rate limiting)
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: require('./package.json').version || '1.0.0'
            });
        });

        // API routes
        this.app.use('/api/chat', chatRoutes);

        // Root endpoint - serve the HTML interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // API info endpoint
        this.app.get('/api', (req, res) => {
            res.json({
                success: true,
                service: 'AI Backend Service',
                version: require('./package.json').version || '1.0.0',
                description: 'Dynamic AI model selection and routing service',
                endpoints: {
                    health: '/health',
                    chat: '/api/chat',
                    models: '/api/chat/models',
                    testProvider: '/api/chat/test-provider',
                    stats: '/api/chat/stats'
                },
                documentation: '/api/docs',
                timestamp: new Date().toISOString()
            });
        });

        // API documentation endpoint
        this.app.get('/api/docs', (req, res) => {
            res.json({
                success: true,
                documentation: {
                    title: 'AI Backend Service API',
                    version: '1.0.0',
                    description: 'RESTful API for dynamic AI model selection and routing',
                    endpoints: [
                        {
                            method: 'POST',
                            path: '/api/chat',
                            description: 'Send a prompt to AI models with automatic routing',
                            parameters: {
                                prompt: 'string (required) - User prompt',
                                options: 'object (optional) - Request options'
                            }
                        },
                        {
                            method: 'GET',
                            path: '/api/chat/models',
                            description: 'Get available models and providers'
                        },
                        {
                            method: 'POST',
                            path: '/api/chat/test-provider',
                            description: 'Test a specific provider',
                            parameters: {
                                provider: 'string (required) - Provider name'
                            }
                        },
                        {
                            method: 'GET',
                            path: '/api/chat/health',
                            description: 'Get detailed service health status'
                        },
                        {
                            method: 'GET',
                            path: '/api/chat/stats',
                            description: 'Get routing and usage statistics'
                        }
                    ]
                }
            });
        });

        console.log('✅ Routes setup completed');
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        console.log('🚨 Setting up error handling...');

        // 404 handler
        this.app.use(ErrorHandler.handle404);

        // Global error handler
        this.app.use(ErrorHandler.handleError);

        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            this.gracefulShutdown('uncaughtException');
        });

        // Unhandled promise rejection handler
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            this.gracefulShutdown('unhandledRejection');
        });

        // Graceful shutdown handlers
        process.on('SIGTERM', () => {
            console.log('📡 SIGTERM received');
            this.gracefulShutdown('SIGTERM');
        });

        process.on('SIGINT', () => {
            console.log('📡 SIGINT received');
            this.gracefulShutdown('SIGINT');
        });

        console.log('✅ Error handling setup completed');
    }

    /**
     * Start the server
     */
    async start() {
        try {
            const { port, host } = this.config.server;
            
            this.server = this.app.listen(port, host, () => {
                console.log('🎉 AI Backend Service started successfully!');
                console.log(`📍 Server running at http://${host}:${port}`);
                console.log(`🏥 Health check: http://${host}:${port}/health`);
                console.log(`📚 API docs: http://${host}:${port}/api/docs`);
                console.log(`🔧 Environment: ${this.config.server.environment}`);
                
                // Log available providers
                const availableProviders = this.apiHandlers.getAvailableProviders();
                console.log(`🤖 Available AI providers: ${availableProviders.join(', ')}`);
            });

            // Handle server errors
            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${port} is already in use`);
                } else {
                    console.error('❌ Server error:', error.message);
                }
                process.exit(1);
            });

        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    gracefulShutdown(signal) {
        console.log(`🛑 Graceful shutdown initiated (${signal})`);
        
        if (this.server) {
            this.server.close((error) => {
                if (error) {
                    console.error('❌ Error during server shutdown:', error.message);
                    process.exit(1);
                } else {
                    console.log('✅ Server closed successfully');
                    process.exit(0);
                }
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⏰ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        } else {
            process.exit(0);
        }
    }

    /**
     * Get server instance
     */
    getApp() {
        return this.app;
    }

    /**
     * Get configuration
     */
    getConfig() {
        return this.config;
    }
}

// Create and start server if this file is run directly
if (require.main === module) {
    const server = new AIBackendServer();
    
    server.initialize()
        .then(() => server.start())
        .catch((error) => {
            console.error('💥 Failed to start AI Backend Service:', error.message);
            process.exit(1);
        });
}

module.exports = AIBackendServer;