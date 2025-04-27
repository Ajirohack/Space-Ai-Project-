# Open Web UI Integration Guide for Project Nexus

This guide explains how to integrate Open Web UI with Project Nexus to access custom models running in your local Docker environment.

## What is Open Web UI?

[Open Web UI](https://docs.openwebui.com/) is an open-source web interface for AI models, similar to ChatGPT but for open-source models. It provides:

- A user-friendly web interface for interacting with AI models
- API endpoints compatible with the OpenAI API format
- Support for various models via Ollama, including Llama, Mistral, and more
- Advanced features like RAG, multi-modal support, and fine-tuning

## Why Use Open Web UI with Project Nexus?

Integrating Open Web UI with Project Nexus provides several benefits:

1. **Local Model Access**: Run powerful LLMs locally without relying on external APIs
2. **Custom Model Support**: Use fine-tuned models specific to your needs
3. **Cost Savings**: Avoid pay-per-token costs associated with commercial APIs
4. **Privacy**: Keep all data and interactions on your own infrastructure
5. **Compatibility**: Seamless integration due to OpenAI-compatible API

## Setup Instructions

### 1. Running Open Web UI with Docker

The provided Docker Compose file includes Open Web UI and Ollama services pre-configured for Project Nexus. This setup allows Nexus to communicate with Open Web UI's API, which in turn connects to Ollama for model inference.

To start the complete stack:

```bash
docker-compose up -d
```

This will launch:
- Open Web UI at http://localhost:8080
- Ollama model server (not directly accessed)
- Nexus frontend at http://localhost:3000
- Nexus backend at http://localhost:5000

### 2. Setting Up Models in Open Web UI

1. Once Open Web UI is running, visit http://localhost:8080 in your browser
2. Complete the initial setup process
3. Go to Models tab and download the models you want to use (e.g., llama3, mistral, etc.)
4. Configure your preferred default model in Settings

### 3. Configuring Nexus to Use Open Web UI

Update your `.env` file with these settings:

```
LLM_PROVIDER=openwebui
OPENWEBUI_API_URL=http://openwebui:1234/v1
```

If you're running Open Web UI outside of Docker, use:

```
OPENWEBUI_API_URL=http://localhost:1234/v1
```

## How It Works

The integration works as follows:

1. **Nexus Frontend**: The user interface sends messages to the Nexus backend
2. **Nexus Backend**: The backend enriches messages with memory context
3. **LLM Service**: The service routes the request to Open Web UI's API
4. **Open Web UI API**: Processes the request and forwards it to Ollama
5. **Ollama**: Runs the actual model inference and returns the response
6. **Response Flow**: The response travels back through the same path

The integration leverages Open Web UI's OpenAI-compatible API endpoints, making it work smoothly with the existing Nexus architecture.

## Available API Endpoints

Open Web UI exposes these OpenAI-compatible endpoints:

- `/v1/chat/completions`: For chat interactions (used by Nexus)
- `/v1/models`: To list available models
- `/v1/embeddings`: For vector embeddings (if supported by model)

## Custom Models and Fine-tuning

To use custom models with Nexus via Open Web UI:

1. Add custom models to Ollama:
   ```bash
   docker exec -it ollama ollama pull [model-name]
   ```
   
2. Or create custom models with an Ollama model file:
   ```bash
   docker exec -it ollama bash -c 'echo "FROM llama3 
   PARAMETER temperature 0.7
   SYSTEM You are Nexus, a digital entity with persistent identity and memory." > Modelfile'
   
   docker exec -it ollama ollama create nexus-custom:latest -f Modelfile
   ```

3. Then select the custom model in Open Web UI and set it as default

## Troubleshooting

If you encounter issues with the Open Web UI integration:

1. **Check API Connectivity**: Ensure Nexus can reach Open Web UI's API
   ```bash
   curl http://localhost:1234/v1/models
   ```

2. **Check Model Availability**: Verify that models are properly loaded in Ollama
   ```bash
   docker exec -it ollama ollama list
   ```

3. **Review Logs**: Check the logs of each service
   ```bash
   docker-compose logs nexus-server
   docker-compose logs openwebui
   docker-compose logs ollama
   ```

4. **Memory Issues**: If models fail to load, your system might need more RAM or GPU memory
   ```bash
   # Modify the docker-compose.yml file to limit model size:
   environment:
     - OLLAMA_MODEL_SIZE=8B  # Use smaller models
   ```

## Performance Considerations

- **GPU Acceleration**: For optimal performance, ensure NVIDIA drivers and CUDA are properly installed
- **Resource Allocation**: Larger models require more RAM and VRAM
- **Response Time**: Local models may be slower than cloud APIs without sufficient hardware
- **Concurrent Requests**: Open Web UI can handle multiple requests, but performance depends on hardware

## Example Configuration

Here's an example of how to configure Nexus to use different models for different tasks:

```javascript
// In your chatController.js
const { callLLM } = require('../utils/llmService');

// For regular chat messages
const regularResponse = await callLLM(messages, {
  model: 'llama3'
});

// For creative tasks
const creativeResponse = await callLLM(messages, {
  model: 'mistral',
  temperature: 0.8
});

// For reasoning tasks
const reasoningResponse = await callLLM(messages, {
  model: 'wizard-math',
  temperature: 0.2
});
```

This allows Nexus to leverage different specialized models depending on the task at hand.
