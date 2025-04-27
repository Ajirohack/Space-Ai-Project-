# Nexus LLM Integration Guide

This guide explains how to integrate Nexus with various Language Model (LLM) providers, including:
- Ollama (self-hosted)
- OpenRouter
- Groq
- Open Web UI
- OpenAI
- Anthropic Claude

## Prerequisites

Before integrating with LLM providers, ensure you have:
1. A working Nexus implementation with frontend and backend
2. Docker and Docker Compose installed (for containerized deployment)
3. API keys for any cloud LLM providers you plan to use
4. Sufficient system resources for running local models (if using Ollama)

## Port Management

**Important**: Always check your system's port usage before configuring Nexus and its LLM services.

### Checking Occupied Ports

#### On Linux/macOS:
```bash
# List all listening ports
sudo lsof -i -P -n | grep LISTEN

# Check if a specific port is in use
sudo lsof -i :3001
sudo lsof -i :8080
sudo lsof -i :11434
sudo lsof -i :8000
```

#### On Windows:
```cmd
# List all listening ports
netstat -ano | findstr LISTENING

# Check if a specific port is in use
netstat -ano | findstr :3001
netstat -ano | findstr :8080
netstat -ano | findstr :11434
netstat -ano | findstr :8000
```

### Default Port Configuration

| Service       | Default Port | Environment Variable |
|---------------|-------------|---------------------|
| Nexus Frontend| 8080        | N/A (in docker-compose.yml) |
| Nexus Backend | 3001        | PORT                |
| Ollama       | 11434       | N/A (fixed)         |
| Open Web UI   | 8000        | N/A (fixed)         |

If you need to change these ports due to conflicts, update the corresponding configuration files.

## 1. Setting Up Ollama Integration

Ollama allows you to run open-source LLMs locally. Nexus is configured to connect to Ollama within the Docker network.

### Configuration:

1. Update your `.env` file:
   ```
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://ollama:11434
   OLLAMA_MODEL=llama3
   ```

2. Available models can be listed once Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. To pull a specific model in Ollama:
   ```bash
   docker exec -it nexus-ollama-1 ollama pull llama3
   ```

## 2. Setting Up OpenRouter Integration

OpenRouter provides access to multiple LLM providers through a unified API.

### Configuration:

1. Sign up at [OpenRouter](https://openrouter.ai/) and get your API key

2. Update your `.env` file:
   ```
   LLM_PROVIDER=openrouter
   OPENROUTER_API_KEY=your_openrouter_key_here
   OPENROUTER_MODEL=openai/gpt-4-turbo
   ```

3. Available models can be found in the [OpenRouter documentation](https://openrouter.ai/docs)

## 3. Setting Up Groq Integration

Groq offers high-performance LLM inference.

### Configuration:

1. Sign up at [Groq](https://console.groq.com/) and get your API key

2. Update your `.env` file:
   ```
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_key_here
   GROQ_MODEL=llama3-70b-8192
   ```

3. Available models can be found in the [Groq documentation](https://console.groq.com/docs)

## 4. Setting Up Open Web UI Integration

Open Web UI provides a web interface for interacting with Ollama models, and also exposes OpenAI-compatible API endpoints.

### Configuration:

1. Make sure Open Web UI service is enabled in your docker-compose.yml file

2. Update your `.env` file:
   ```
   LLM_PROVIDER=openwebui
   OPENWEBUI_BASE_URL=http://openwebui:8000
   OPENWEBUI_MODEL=default
   ```

3. The model name should match what you've configured in Open Web UI

4. Open Web UI must be configured with `ENABLE_OPENAI_API=true` in its environment variables

### Using Custom Models in Open Web UI

Open Web UI can connect to various LLM backends including Ollama. To use specific models:

1. Access the Open Web UI interface at http://localhost:8000
2. In the settings, configure your preferred models
3. Update the `OPENWEBUI_MODEL` in your Nexus configuration to match the model name in Open Web UI

## 5. Setting Up OpenAI Integration

### Configuration:

1. Sign up at [OpenAI](https://platform.openai.com/) and get your API key

2. Update your `.env` file:
   ```
   LLM_PROVIDER=openai
   LLM_API_KEY=your_openai_key_here
   OPENAI_MODEL=gpt-4-turbo
   ```

## 6. Setting Up Anthropic Claude Integration

### Configuration:

1. Sign up at [Anthropic](https://console.anthropic.com/) and get your API key

2. Update your `.env` file:
   ```
   LLM_PROVIDER=anthropic
   LLM_API_KEY=your_anthropic_key_here
   ANTHROPIC_MODEL=claude-3-haiku-20240307
   ```

## Running Nexus with Docker Compose

With your LLM provider configured, you can start the entire Nexus stack:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Switching Between LLM Providers

You can easily switch between providers by updating the `LLM_PROVIDER` variable in your `.env` file and restarting the Nexus server:

```bash
# If running without Docker
cd server
npm restart

# If running with Docker
docker-compose restart nexus-server
```

## Troubleshooting

### Connection Issues

If Nexus cannot connect to the LLM provider:

1. Check that the provider is running and accessible
2. Verify that API keys are correct and properly set in the `.env` file
3. Check network connectivity between Nexus and the provider
4. Review the logs for specific error messages:
   ```bash
   # If running without Docker
   cat server/logs/error.log
   
   # If running with Docker
   docker-compose logs nexus-server
   ```

### Ollama-specific Issues

If you're having trouble with Ollama:

1. Ensure the model is properly pulled:
   ```bash
   docker exec -it nexus-ollama-1 ollama list
   ```

2. Check Ollama logs:
   ```bash
   docker-compose logs ollama
   ```

3. Try pulling the model manually:
   ```bash
   docker exec -it nexus-ollama-1 ollama pull llama3
   ```

### Open Web UI Issues

If you're having trouble with Open Web UI:

1. Ensure Open Web UI is properly connected to Ollama
2. Check that the OpenAI-compatible API is enabled
3. Verify the model name matches what's configured in Open Web UI
4. Check Open Web UI logs:
   ```bash
   docker-compose logs openwebui
   ```

## Performance Considerations

When using self-hosted LLMs with Ollama:

1. **Hardware Requirements**: Models like Llama 3 require significant RAM and GPU resources
2. **Response Time**: Local models may be slower than cloud APIs depending on your hardware
3. **Concurrent Requests**: Be mindful of how many simultaneous requests your hardware can handle

For production use, consider:
- Using smaller models for faster responses
- Implementing request queuing for high-traffic scenarios
- Setting appropriate timeouts in the Nexus configuration

## Security Considerations

When using LLM providers, be mindful of:

1. **API Key Security**: Never commit API keys to version control
2. **Data Privacy**: Consider what data is being sent to external APIs
3. **Network Security**: Ensure proper firewalls and access controls are in place
4. **Rate Limiting**: Implement rate limiting to prevent accidental API overuse

## Next Steps

After successfully integrating with your chosen LLM provider, consider:

1. Improving the prompt engineering in Nexus for better responses
2. Implementing caching to reduce API calls for common requests
3. Adding support for streaming responses for a more interactive experience
4. Enhancing the memory system to provide better context to the LLM
