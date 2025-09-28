# AI Backend Service

A dynamic backend service that intelligently routes user prompts to appropriate AI models based on content analysis. The service supports multiple AI providers and automatically selects the best model for each type of request.

## 🚀 Features

- **Dynamic Model Selection**: Automatically chooses the best AI model based on prompt content and context
- **Multi-Provider Support**: Integrates with OpenAI, Anthropic, Google AI, and Groq
- **Intelligent Routing**: Categorizes prompts (coding, reasoning, creative, fast) for optimal model selection
- **Comprehensive Error Handling**: Robust error management for all failure scenarios
- **Security First**: Secure environment variable handling, rate limiting, and input validation
- **RESTful API**: Clean, well-documented API endpoints
- **Health Monitoring**: Built-in health checks and usage statistics
- **Modular Architecture**: Clean, maintainable code structure

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API keys for desired AI providers

## 🛠️ Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy the `.env` file and update with your actual API keys:
   ```bash
   # Update the .env file with your real API keys
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

The service is configured via environment variables in the `.env` file:

### Server Settings
- `SERVER_PORT`: Port number (default: 3000)
- `NODE_ENV`: Environment (development/production)

### AI Provider Settings
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `GOOGLE_API_KEY`: Google AI API key
- `GROQ_API_KEY`: Groq API key

### Model Routing
- `CODING_KEYWORDS`: Keywords that trigger coding models
- `REASONING_KEYWORDS`: Keywords that trigger reasoning models
- `CREATIVE_KEYWORDS`: Keywords that trigger creative models
- `FAST_KEYWORDS`: Keywords that trigger fast response models

### Security & Performance
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `REQUEST_TIMEOUT_MS`: Request timeout duration

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Chat Completion
**POST** `/api/chat`

Send a prompt and get an AI-generated response with automatic model selection.

**Request Body**:
```json
{
  "prompt": "Explain quantum computing",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "response": "Quantum computing is a revolutionary computing paradigm...",
    "model": "gpt-4",
    "provider": "openai",
    "routing_reason": "Selected for reasoning task based on content analysis",
    "confidence": 0.85,
    "usage": {
      "prompt_tokens": 15,
      "completion_tokens": 150,
      "total_tokens": 165
    }
  },
  "metadata": {
    "request_id": "req_123456",
    "timestamp": "2024-01-15T10:30:00Z",
    "processing_time_ms": 1250
  }
}
```

#### 2. Force Model Selection
**POST** `/api/chat`

Force a specific model/provider combination.

**Request Body**:
```json
{
  "prompt": "Write a Python function",
  "force_model": "gpt-4",
  "force_provider": "openai"
}
```

#### 3. Get Available Models
**GET** `/api/chat/models`

Retrieve all available models and providers.

**Response**:
```json
{
  "success": true,
  "data": {
    "providers": ["openai", "anthropic", "google", "groq"],
    "models": {
      "openai": ["gpt-4", "gpt-3.5-turbo"],
      "anthropic": ["claude-3-opus", "claude-3-sonnet"],
      "google": ["gemini-pro"],
      "groq": ["llama2-70b-chat", "mixtral-8x7b"]
    }
  }
}
```

#### 4. Health Check
**GET** `/health`

Check service health and status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "providers": {
    "openai": "available",
    "anthropic": "available",
    "google": "available",
    "groq": "available"
  }
}
```

#### 5. Usage Statistics
**GET** `/api/chat/stats`

Get usage statistics and routing information.

**Response**:
```json
{
  "success": true,
  "data": {
    "total_requests": 1250,
    "requests_by_provider": {
      "openai": 500,
      "anthropic": 300,
      "google": 250,
      "groq": 200
    },
    "requests_by_category": {
      "coding": 400,
      "reasoning": 350,
      "creative": 300,
      "fast": 200
    },
    "average_response_time_ms": 1100,
    "uptime_hours": 24.5
  }
}
```

#### 6. Test Provider
**POST** `/api/chat/test-provider`

Test connectivity to a specific provider.

**Request Body**:
```json
{
  "provider": "openai"
}
```

## 🧠 How Model Selection Works

The service uses intelligent routing based on multiple factors:

### 1. Content Analysis
- **Coding**: Detects code-related keywords, programming languages, technical terms
- **Reasoning**: Identifies analytical, mathematical, or logical reasoning tasks
- **Creative**: Recognizes creative writing, storytelling, artistic requests
- **Fast**: Simple questions, greetings, or quick responses

### 2. Context Evaluation
- Prompt length and complexity
- Technical depth indicators
- Language patterns and structure

### 3. Model Matching
- Each category maps to optimized models
- Fallback options for unavailable providers
- Confidence scoring for routing decisions

### Example Routing:
```
"Write a Python function to sort an array" → Coding → GPT-4 (OpenAI)
"Explain the theory of relativity" → Reasoning → Claude-3-Opus (Anthropic)
"Write a short story about dragons" → Creative → Gemini-Pro (Google)
"Hello, how are you?" → Fast → Llama2-70B (Groq)
```

## 🔒 Security Features

- **Environment Variable Protection**: Secure handling of API keys
- **Input Validation**: Comprehensive request validation using Joi schemas
- **Rate Limiting**: Configurable rate limits to prevent abuse
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers and protection
- **Request Sanitization**: Input cleaning and validation
- **Error Handling**: Secure error responses without sensitive data exposure

## 🏗️ Architecture

```
├── server.js                 # Main server entry point
├── config/
│   └── env-loader.js        # Environment configuration loader
├── services/
│   ├── model-router.js      # Intelligent model routing logic
│   └── api-handlers.js      # AI provider API integrations
├── middleware/
│   ├── error-handler.js     # Comprehensive error handling
│   └── validation.js        # Request validation schemas
├── routes/
│   └── chat.js             # API route definitions
├── .env                    # Environment configuration
└── package.json           # Dependencies and scripts
```

## 🧪 Testing

Run the test validation:
```bash
node test-service.js
```

## 📊 Monitoring

The service provides built-in monitoring through:
- Health check endpoints
- Usage statistics tracking
- Error logging and reporting
- Performance metrics
- Provider availability monitoring

## 🚨 Error Handling

The service handles various error scenarios:

- **Missing .env file**: Graceful startup failure with clear error message
- **Invalid API keys**: Provider-specific error handling
- **Malformed prompts**: Input validation with helpful error messages
- **Provider unavailable**: Automatic fallback to alternative providers
- **Rate limiting**: Clear rate limit exceeded responses
- **Timeout errors**: Configurable timeout handling

## 🔄 Development

### Adding New Providers

1. Update `.env` with new provider configuration
2. Add provider handler in `services/api-handlers.js`
3. Update model routing logic in `services/model-router.js`
4. Add validation schemas in `middleware/validation.js`

### Customizing Routing Logic

Modify the routing algorithms in `services/model-router.js`:
- Update keyword lists
- Adjust confidence scoring
- Add new categorization rules
- Implement custom routing strategies

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the error logs in the console
2. Verify your `.env` configuration
3. Ensure all API keys are valid
4. Check provider status and availability

## 🎯 Example Usage

### Basic Chat Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain machine learning in simple terms"
  }'
```

### Coding Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a JavaScript function to validate email addresses",
    "options": {
      "temperature": 0.3,
      "max_tokens": 500
    }
  }'
```

### Creative Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about artificial intelligence"
  }'
```

The service will automatically select the most appropriate model for each request and provide detailed routing information in the response.