# Project Nexus Docker Setup Guide

This guide provides instructions for containerizing the Project Nexus application and connecting it to LLM services like Llama running in Docker or OpenRouter.

## Project Structure

First, let's ensure our project is organized in a Docker-friendly way:

```
nexus/
├── client/                # Frontend React application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── Dockerfile         # Frontend container definition
├── server/                # Backend Node.js server
│   ├── controllers/
│   ├── memory/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── uploads/
│   ├── data/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile         # Backend container definition
├── docker-compose.yml     # Defines multi-container setup
└── .env                   # Environment variables
```

## Docker Configuration Files

### 1. Frontend Dockerfile

Create a `Dockerfile` in the `client` directory:

```dockerfile
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Install serve to run the build
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
```

### 2. Backend Dockerfile

Create a `Dockerfile` in the `server` directory:

```dockerfile
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Create uploads and data directories
RUN mkdir -p uploads data

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
```

### 3. Docker Compose File

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  # Frontend service
  nexus-client:
    build:
      context: ./client
    ports:
      - "3000:3000"
    depends_on:
      - nexus-server
    networks:
      - nexus-network
    restart: unless-stopped

  # Backend service
  nexus-server:
    build:
      context: ./server
    ports:
      - "5000:5000"
    volumes:
      - ./server/uploads:/app/uploads
      - ./server/data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=5000
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_PROVIDER=${LLM_PROVIDER}
      - LLM_BASE_URL=${LLM_BASE_URL}
    networks:
      - nexus-network
    restart: unless-stopped

networks:
  nexus-network:
    driver: bridge
```

## Connecting to LLM Services

### Option 1: Using OpenRouter

To connect to OpenRouter, update your `.env` file:

```
LLM_PROVIDER=openrouter
LLM_API_KEY=your_openrouter_api_key
LLM_BASE_URL=https://openrouter.ai/api/v1
```

And modify your `llmService.js` to support OpenRouter:

```javascript
// server/utils/llmService.js
const axios = require('axios');

const callLLM = async (messages, options = {}) => {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  
  if (!apiKey) {
    throw new Error('LLM API key not configured');
  }

  if (provider === 'openrouter') {
    return callOpenRouter(messages, apiKey, baseUrl, options);
  } else if (provider === 'llama') {
    return callLlama(messages, baseUrl, options);
  }
  
  // Default to mock response for development
  return mockResponse(messages);
};

const callOpenRouter = async (messages, apiKey, baseUrl, options) => {
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: options.model || 'anthropic/claude-3-opus', // Can be configured
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

// Implementation for connecting to local Llama
const callLlama = async (messages, baseUrl, options) => {
  try {
    const response = await axios.post(
      `${baseUrl}/completion`,
      {
        prompt: convertMessagesToLlamaPrompt(messages),
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data.content
    };
  } catch (error) {
    console.error('Llama API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

// Helper function to convert chat messages to Llama prompt format
const convertMessagesToLlamaPrompt = (messages) => {
  let prompt = '';
  
  for (const message of messages) {
    if (message.role === 'system') {
      prompt += `System: ${message.content}\n\n`;
    } else if (message.role === 'user') {
      prompt += `User: ${message.content}\n\n`;
    } else if (message.role === 'assistant') {
      prompt += `Assistant: ${message.content}\n\n`;
    }
  }
  
  prompt += 'Assistant: ';
  return prompt;
};

// Mock response for testing without an LLM
const mockResponse = (messages) => {
  const lastMessage = messages[messages.length - 1];
  return {
    success: true,
    data: `This is a mock response from Nexus. You said: "${lastMessage.content}"`
  };
};

module.exports = { callLLM };
```

### Option 2: Running Llama in Docker

If you want to run Llama locally with Docker:

1. Add a Llama service to your docker-compose.yml:

```yaml
# Add this to your docker-compose.yml
llama:
  image: ghcr.io/ggerganov/llama.cpp:full
  restart: unless-stopped
  ports:
    - "8080:8080"
  volumes:
    - ./models:/models
  command: >
    --server --host 0.0.0.0 --port 8080
    --model /models/llama-3-8b.Q4_K_M.gguf
    --ctx-size 4096
  networks:
    - nexus-network
```

2. Set your environment variables:

```
LLM_PROVIDER=llama
LLM_BASE_URL=http://llama:8080
```

## Running the Dockerized Project

1. Create a `.env` file in the root directory with your LLM configuration.

2. Build and start the containers:
```bash
docker-compose up -d
```

3. Access your application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Volumes and Persistence

The docker-compose configuration includes volumes for:
- `uploads`: Stores uploaded files
- `data`: Stores Nexus's memory and other persistent data

This ensures your Nexus instance retains its memory between container restarts.

## Troubleshooting

If you encounter any issues:

1. Check container logs:
```bash
docker-compose logs nexus-server
docker-compose logs nexus-client
```

2. Ensure your API keys are correctly set in the .env file

3. Verify network connectivity between containers:
```bash
docker-compose exec nexus-server ping llama
```
