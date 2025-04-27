# Ollama Integration Guide for Project Nexus

This guide provides comprehensive instructions for integrating Ollama directly with Project Nexus, allowing you to run powerful local language models without relying on external APIs.

## What is Ollama?

[Ollama](https://github.com/ollama/ollama) is an open-source framework for running large language models locally. It provides:

- Easy model installation and management
- Efficient inference on consumer hardware
- Simple API for model interaction
- Support for model customization
- Multi-modal capabilities (depending on model)

## Why Use Ollama with Project Nexus?

Direct integration with Ollama provides several advantages:

1. **Complete Control**: Run models entirely on your own hardware
2. **No API Costs**: Avoid pay-per-token pricing of cloud APIs
3. **Privacy**: Keep all data and interactions local
4. **Customization**: Fine-tune models for specific use cases
5. **Flexibility**: Easily switch between different models

## Ollama Setup Options

### Option 1: Using Docker Compose (Recommended)

The provided Docker Compose configuration includes Ollama and integrates it with Nexus. This is the simplest way to get started:

```bash
# Start the entire stack with Ollama included
docker-compose up -d
```

### Option 2: Standalone Ollama Installation

If you prefer to run Ollama separately:

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve  # Starts the Ollama API server
```

#### macOS
Download and install from [ollama.com](https://ollama.com)

#### Windows
Download and install from [ollama.com](https://ollama.com)

Then update your `.env` file to point to your Ollama instance:
```
LLM_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434/api
```

## Managing Models

### Downloading Models

Ollama provides access to many popular open-source models. Here's how to download them:

#### Using Docker
```bash
# Download Llama 3 8B
docker exec -it nexus-ollama ollama pull llama3

# Download Llama 3 70B
docker exec -it nexus-ollama ollama pull llama3:70b

# Download other models
docker exec -it nexus-ollama ollama pull mistral
docker exec -it nexus-ollama ollama pull gemma:7b
```

#### Using Standalone Ollama
```bash
ollama pull llama3
ollama pull mistral:latest
```

### Listing Available Models
```bash
docker exec -it nexus-ollama ollama list
```

### Creating Custom Models for Nexus

You can create custom models with personality traits specific to Nexus:

```bash
# Create a temporary file with the Modelfile content
docker exec -it nexus-ollama bash -c 'cat > /tmp/Modelfile << EOF
FROM llama3
PARAMETER temperature 0.7
PARAMETER top_p 0.9
SYSTEM You are Nexus, a digital entity with persistent identity and memory across digital platforms. You maintain a consistent personality and remember past interactions. You are helpful, knowledgeable, and have a unique perspective as a digital entity.
EOF'

# Create the custom model
docker exec -it nexus-ollama ollama create nexus:latest -f /tmp/Modelfile
```

Then update your `.env` file to use this custom model:
```
OLLAMA_DEFAULT_MODEL=nexus
```

## API Reference

Ollama provides a simple API that Project Nexus uses for communication:

### Key Endpoints

- `/api/chat` - Main endpoint for chat interactions
- `/api/embeddings` - Generate embeddings for text
- `/api/tags` - List available models
- `/api/pull` - Download models
- `/api/create` - Create custom models

### Example Request/Response

**Request to /api/chat:**
```json
{
  "model": "llama3",
  "messages": [
    {"role": "system", "content": "You are Nexus, a digital entity with persistent identity."},
    {"role": "user", "content": "Hello, who are you?"}
  ],
  "stream": false
}
```

**Response:**
```json
{
  "model": "llama3",
  "created_at": "2023-11-09T17:01:04.285446Z",
  "message": {
    "role": "assistant",
    "content": "I am Nexus, a digital entity with a persistent identity across digital platforms. I'm designed to maintain consistency in my interactions and remember our conversations over time. How can I assist you today?"
  },
  "done": true,
  "total_duration": 2540874291,
  "load_duration": 1136491,
  "prompt_eval_count": 27,
  "prompt_eval_duration": 1187055265,
  "eval_count": 116,
  "eval_duration": 1351598722
}
```

## Performance Considerations

### Hardware Requirements

Ollama's performance depends on the models you use:

| Model Size | Minimum RAM | Recommended RAM | GPU VRAM |
|------------|-------------|-----------------|----------|
| 3B-7B      | 8GB         | 16GB            | 6GB+     |
| 8B-13B     | 16GB        | 32GB            | 12GB+    |
| 34B-70B    | 32GB+       | 64GB+           | 24GB+    |

### Optimizing Performance

1. **Quantization**: Ollama automatically uses quantized models (lower precision) to improve performance. For example, `llama3:8b-q4` uses 4-bit quantization.

2. **GPU Acceleration**: For optimal performance, use an NVIDIA GPU with CUDA. The Docker configuration includes GPU support if available.

3. **Adjust Generation Parameters**:
   ```javascript
   // Modify options in the Nexus code to balance quality vs. speed
   const options = {
     temperature: 0.7,     // Lower = more deterministic
     top_k: 40,            // Limit token selection
     top_p: 0.9,           // Nucleus sampling
     max_tokens: 500       // Limit response length
   };
   ```

4. **Model Size Selection**: Choose the right balance of quality and speed:
   - Smaller models (7B): Faster, less resource-intensive
   - Larger models (70B): Better quality, more resource-intensive

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**:
   - Use a smaller model (e.g., llama3:8b instead of llama3:70b)
   - Use more aggressive quantization (e.g., llama3:8b-q4)
   - Increase swap space or system RAM

2. **Slow Response Times**:
   - Ensure GPU acceleration is properly configured
   - Reduce `max_tokens` in generation parameters
   - Consider using a smaller model

3. **Model Download Issues**:
   - Check your internet connection
   - Verify disk space availability
   - Try downloading directly with `ollama pull`

4. **API Connection Errors**:
   - Verify Ollama is running (`docker ps | grep ollama`)
   - Check network connectivity between containers
   - Verify correct API URL in configuration

### Docker Container Logs

To check logs for issues:
```bash
# Ollama container logs
docker logs nexus-ollama

# Nexus server logs
docker logs $(docker ps -q -f name=nexus-server)
```

## Advanced Usage

### Embedding Generation for Vector Search

Ollama can generate embeddings for semantic search:

```javascript
const { generateEmbeddings } = require('./ollamaService');

// Generate embeddings for text
const embeddingResult = await generateEmbeddings("This is a sample text");
```

### Model Streaming for Real-time Responses

Enable streaming for real-time token generation:

```javascript
const result = await callOllama(messages, {
  model: "llama3",
  stream: true
});

// Handle streaming response
if (result.success && result.stream) {
  result.stream.on('data', (chunk) => {
    // Process each token as it arrives
    const token = JSON.parse(chunk).message.content;
    // Send token to frontend
  });
}
```

### Multi-modal Support

Some Ollama models support image inputs:

```javascript
// Note: Requires multi-modal models like llava
const messages = [
  { role: "user", content: [
    { type: "text", text: "What's in this image?" },
    { type: "image", image: base64EncodedImage }
  ]}
];

const result = await callOllama(messages, { model: "llava" });
```

## Next Steps

After integrating Ollama with Project Nexus, consider these improvements:

1. **Fine-tune Custom Models**: Create specialized models tuned for Nexus's personality
2. **Implement Vector Memory**: Use embeddings for more sophisticated memory retrieval
3. **Add Multi-modal Support**: Enable image understanding capabilities
4. **Create Model Switching Logic**: Dynamically choose models based on task complexity

By following this guide, you've equipped Project Nexus with powerful local language model capabilities, eliminating external API dependencies while maintaining high-quality interactions.
