# API Usage Examples

This document provides comprehensive examples for testing and using the AI Backend Service API.

## 🚀 Quick Start Examples

### 1. Basic Chat Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is artificial intelligence?"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "response": "Artificial intelligence (AI) refers to the simulation of human intelligence...",
    "model": "gpt-3.5-turbo",
    "provider": "openai",
    "routing_reason": "Selected for general reasoning task",
    "confidence": 0.75
  }
}
```

## 🔧 Coding Examples

### Python Function Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a Python function to calculate the factorial of a number",
    "options": {
      "temperature": 0.2,
      "max_tokens": 300
    }
  }'
```

### JavaScript Code Review
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Review this JavaScript code and suggest improvements:\n\nfunction getData() {\n  var data = [];\n  for (var i = 0; i < 100; i++) {\n    data.push(i);\n  }\n  return data;\n}"
  }'
```

### SQL Query Generation
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a SQL query to find all users who registered in the last 30 days and have made at least 3 purchases"
  }'
```

## 🧠 Reasoning Examples

### Mathematical Problem
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Solve this calculus problem: Find the derivative of f(x) = 3x^2 + 2x - 5"
  }'
```

### Logical Analysis
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze the logical fallacy in this argument: All birds can fly. Penguins are birds. Therefore, penguins can fly."
  }'
```

### Scientific Explanation
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain the process of photosynthesis and its importance in the ecosystem"
  }'
```

## 🎨 Creative Examples

### Story Writing
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short science fiction story about a robot who discovers emotions",
    "options": {
      "temperature": 0.8,
      "max_tokens": 800
    }
  }'
```

### Poetry Generation
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a sonnet about the beauty of autumn leaves"
  }'
```

### Creative Writing Prompt
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a compelling opening paragraph for a mystery novel set in Victorian London"
  }'
```

## ⚡ Fast Response Examples

### Simple Greeting
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, how are you today?"
  }'
```

### Quick Question
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What time is it?"
  }'
```

### Simple Definition
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Define machine learning in one sentence"
  }'
```

## 🎯 Forced Model Selection

### Force OpenAI GPT-4
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "force_model": "gpt-4",
    "force_provider": "openai"
  }'
```

### Force Anthropic Claude
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a detailed analysis of climate change",
    "force_model": "claude-3-opus",
    "force_provider": "anthropic"
  }'
```

### Force Google Gemini
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a marketing strategy for a new product",
    "force_model": "gemini-pro",
    "force_provider": "google"
  }'
```

## 📊 Service Information Examples

### Get Available Models
```bash
curl -X GET http://localhost:3000/api/chat/models \
  -H "Content-Type: application/json"
```

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### Usage Statistics
```bash
curl -X GET http://localhost:3000/api/chat/stats
```

### Test Provider Connectivity
```bash
curl -X POST http://localhost:3000/api/chat/test-provider \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai"
  }'
```

## 🧪 Testing Scenarios

### Error Handling Tests

#### Invalid Prompt (Empty)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": ""
  }'
```

#### Invalid Provider
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "force_provider": "invalid_provider"
  }'
```

#### Invalid Model
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "force_model": "invalid_model",
    "force_provider": "openai"
  }'
```

#### Malformed JSON
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"'
```

### Rate Limiting Test
```bash
# Send multiple requests quickly to test rate limiting
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test request '$i'"}' &
done
wait
```

## 📝 JavaScript/Node.js Examples

### Using Axios
```javascript
const axios = require('axios');

async function chatWithAI(prompt, options = {}) {
  try {
    const response = await axios.post('http://localhost:3000/api/chat', {
      prompt,
      options
    });
    
    console.log('Response:', response.data.data.response);
    console.log('Model used:', response.data.data.model);
    console.log('Provider:', response.data.data.provider);
    console.log('Routing reason:', response.data.data.routing_reason);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Examples
chatWithAI("Write a Python function to reverse a string");
chatWithAI("Explain the theory of relativity", { temperature: 0.3 });
chatWithAI("Write a haiku about programming", { max_tokens: 100 });
```

### Using Fetch API
```javascript
async function sendPrompt(prompt, forceModel = null, forceProvider = null) {
  const payload = { prompt };
  
  if (forceModel) payload.force_model = forceModel;
  if (forceProvider) payload.force_provider = forceProvider;
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('AI Response:', data.data.response);
      return data;
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Usage
sendPrompt("Explain machine learning algorithms");
sendPrompt("Debug this code", "gpt-4", "openai");
```

## 🐍 Python Examples

### Using Requests
```python
import requests
import json

def chat_with_ai(prompt, options=None, force_model=None, force_provider=None):
    url = "http://localhost:3000/api/chat"
    
    payload = {"prompt": prompt}
    if options:
        payload["options"] = options
    if force_model:
        payload["force_model"] = force_model
    if force_provider:
        payload["force_provider"] = force_provider
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        if data["success"]:
            print(f"Response: {data['data']['response']}")
            print(f"Model: {data['data']['model']}")
            print(f"Provider: {data['data']['provider']}")
            return data
        else:
            print(f"Error: {data['error']}")
    
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")

# Examples
chat_with_ai("Write a Python class for a binary tree")
chat_with_ai("Explain quantum mechanics", {"temperature": 0.2})
chat_with_ai("Write a poem about AI", force_model="claude-3-opus", force_provider="anthropic")
```

## 🔍 Monitoring Examples

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "Checking AI Backend Service Health..."

# Basic health check
echo "1. Service Health:"
curl -s http://localhost:3000/health | jq '.'

echo -e "\n2. Available Models:"
curl -s http://localhost:3000/api/chat/models | jq '.data.models'

echo -e "\n3. Usage Statistics:"
curl -s http://localhost:3000/api/chat/stats | jq '.data'

echo -e "\n4. Testing Basic Functionality:"
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, are you working?"}' | jq '.success'
```

### Load Testing Script
```bash
#!/bin/bash
# load-test.sh

echo "Running load test..."

# Test concurrent requests
for i in {1..10}; do
  (
    curl -s -X POST http://localhost:3000/api/chat \
      -H "Content-Type: application/json" \
      -d "{\"prompt\": \"Test request $i\"}" \
      -w "Request $i: %{http_code} - %{time_total}s\n"
  ) &
done

wait
echo "Load test completed"
```

## 🚨 Error Response Examples

### Validation Error
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Prompt is required and must be a non-empty string",
    "details": {
      "field": "prompt",
      "value": "",
      "constraint": "required"
    }
  }
}
```

### Provider Unavailable
```json
{
  "success": false,
  "error": {
    "type": "ProviderUnavailableError",
    "message": "The requested provider 'openai' is currently unavailable",
    "details": {
      "provider": "openai",
      "fallback_used": true,
      "fallback_provider": "anthropic"
    }
  }
}
```

### Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "type": "RateLimitError",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "window": "15 minutes",
      "retry_after": 300
    }
  }
}
```

This comprehensive set of examples should help you test and integrate with the AI Backend Service effectively!