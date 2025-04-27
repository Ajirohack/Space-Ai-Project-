# Nexus Control Center: Installation and Setup Guide

This guide provides step-by-step instructions for installing and setting up the Nexus Control Center, including all necessary dependencies, configuration, and initial system setup.

## System Requirements

### Minimum Requirements
- **CPU**: 8 cores (16 cores recommended for production)
- **RAM**: 32GB (64GB recommended for production)
- **Storage**: 100GB SSD
- **GPU**: NVIDIA GPU with at least 8GB VRAM (for AI model hosting)
- **Operating System**: Ubuntu 20.04 LTS or newer

### Recommended Requirements for Production
- **CPU**: 32+ cores
- **RAM**: 128GB+
- **Storage**: 500GB+ SSD
- **GPU**: Multiple NVIDIA A100/A10G/RTX 4090 GPUs
- **Network**: 1Gbps+ connection

## Prerequisites Installation

### 1. Install System Dependencies

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install required system packages
sudo apt install -y build-essential curl wget git python3-pip python3-dev \
  python3-venv nodejs npm docker.io docker-compose nginx certbot python3-certbot-nginx

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER
```

Log out and back in for the group changes to take effect.

### 2. Install NVIDIA Drivers and CUDA (for GPU support)

```bash
# Add NVIDIA repository
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-ubuntu2004.pin
sudo mv cuda-ubuntu2004.pin /etc/apt/preferences.d/cuda-repository-pin-600
sudo apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/7fa2af80.pub
sudo add-apt-repository "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/ /"

# Install NVIDIA drivers and CUDA
sudo apt update
sudo apt install -y cuda-drivers cuda

# Install nvidia-docker
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update
sudo apt install -y nvidia-docker2

# Restart Docker
sudo systemctl restart docker
```

### 3. Set Up Python Virtual Environment

```bash
# Create a directory for the project
mkdir -p ~/nexus-control-center
cd ~/nexus-control-center

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

## Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/nexus-control-center.git .

# If you're using a private repository, you might need to authenticate:
# git clone https://username:token@github.com/yourusername/nexus-control-center.git .
```

### 2. Install Python Dependencies

```bash
# Install dependencies
pip install -e ".[dev]"

# Or if using Poetry
poetry install
```

### 3. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit the environment file with your settings
nano .env
```

Example `.env` file content:

```
# System Configuration
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RATE_LIMIT=100
API_TIMEOUT=30

# Control Center
CC_HOST=0.0.0.0
CC_PORT=8080

# Database Connections
POSTGRES_URI=postgresql://postgres:password@localhost:5432/nexus
REDIS_URI=redis://localhost:6379/0
VECTOR_DB_URL=http://localhost:6333
MONGODB_URI=mongodb://localhost:27017/nexus

# AI Model Configuration
MODEL_CACHE_DIR=./models
TEXT_MODEL=gpt-3.5-turbo
THINKING_MODEL=claude-3-haiku-20240307
REASONING_MODEL=claude-3-opus-20240229
TOOL_USE_MODEL=gpt-4-turbo

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Tool APIs
SEARCH_API_KEY=your_search_api_key
```

### 4. Set Up Databases

#### Using Docker Compose (for development)

```bash
# Start database containers
docker-compose -f docker-compose.dev.yml up -d postgres redis mongodb qdrant
```

#### Manual Setup (for production or custom configurations)

**PostgreSQL:**

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER nexus WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE nexus OWNER nexus;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nexus TO nexus;"
```

**Redis:**

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis to accept remote connections if needed
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**MongoDB:**

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh --eval "db = db.getSiblingDB('nexus'); db.createUser({user: 'nexus', pwd: 'your_secure_password', roles: [{role: 'readWrite', db: 'nexus'}]})"
```

**Qdrant (Vector Database):**

```bash
# Run Qdrant using Docker
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

### 5. Initialize the Database

```bash
# Run database migrations
python -m control_center.db.migrations

# Seed the database with initial data (if needed)
python -m control_center.db.seed
```

### 6. Set Up Web UI

```bash
# Change to dashboard directory
cd dashboard

# Install Node.js dependencies
npm install

# Build the dashboard for production
npm run build

# Change back to project root
cd ..
```

## Running the System

### Development Mode

```bash
# Start the API server
python -m api.main --debug

# In a separate terminal, start the Control Center
python -m control_center.main --debug

# In a separate terminal, start the dashboard development server
cd dashboard && npm run dev
```

### Production Mode using Docker Compose

```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Manual Production Deployment

1. **Set up Nginx as a reverse proxy:**

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/nexus-control-center

# Add the following configuration:
server {
    listen 80;
    server_name api.nexus-control.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name dashboard.nexus-control.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/nexus-control-center /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

2. **Set up SSL with Certbot:**

```bash
sudo certbot --nginx -d api.nexus-control.example.com -d dashboard.nexus-control.example.com
```

3. **Set up systemd services:**

```bash
# Create API service
sudo nano /etc/systemd/system/nexus-api.service

# Add the following:
[Unit]
Description=Nexus Control Center API
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/nexus-control-center
Environment="PATH=/home/ubuntu/nexus-control-center/venv/bin"
EnvironmentFile=/home/ubuntu/nexus-control-center/.env
ExecStart=/home/ubuntu/nexus-control-center/venv/bin/python -m api.main

[Install]
WantedBy=multi-user.target

# Create Control Center service
sudo nano /etc/systemd/system/nexus-control-center.service

# Add the following:
[Unit]
Description=Nexus Control Center
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/nexus-control-center
Environment="PATH=/home/ubuntu/nexus-control-center/venv/bin"
EnvironmentFile=/home/ubuntu/nexus-control-center/.env
ExecStart=/home/ubuntu/nexus-control-center/venv/bin/python -m control_center.main

[Install]
WantedBy=multi-user.target

# Enable and start the services
sudo systemctl daemon-reload
sudo systemctl enable nexus-api.service
sudo systemctl enable nexus-control-center.service
sudo systemctl start nexus-api.service
sudo systemctl start nexus-control-center.service
```

## Post-Installation Configuration

### 1. Create Admin User

```bash
# Run the admin creation script
python -m control_center.scripts.create_admin

# Follow the prompts to create the first admin user
```

### 2. Download AI Models

For self-hosted models, you need to download the model files:

```bash
# Run the model download script
python -m control_center.scripts.download_models

# This will download models specified in your configuration
```

### 3. Configure AI Council

Edit the AI Council configuration file to customize the models and behaviors:

```bash
# Edit the configuration file
nano config/ai_council.yaml
```

Example configuration:

```yaml
decision_maker:
  model: "claude-3-haiku-20240307"
  temperature: 0.7
  max_tokens: 2000

specialists:
  text:
    enabled: true
    model: "gpt-3.5-turbo"
    temperature: 0.7
    max_tokens: 1000
    
  thinking:
    enabled: true
    count: 2
    model: "claude-3-opus-20240229"
    temperature: 0.5
    max_tokens: 4000
    
  reasoning:
    enabled: true
    count: 2
    model: "claude-3-sonnet-20240229"
    temperature: 0.2
    max_tokens: 3000
    
  tool_use:
    enabled: true
    count: 2
    model: "gpt-4-turbo"
    temperature: 0.2
    max_tokens: 2000
    
  image:
    enabled: true
    model: "gpt-4-vision-preview"
    temperature: 0.7
    max_tokens: 1000
    
  speech:
    enabled: true
    model: "whisper-large-v3"
    temperature: 0.0
    max_tokens: 1000
    
  multimodal:
    enabled: true
    model: "gpt-4-vision-preview"
    temperature: 0.7
    max_tokens: 2000
    
  instruction:
    enabled: true
    model: "claude-3-haiku-20240307"
    temperature: 0.5
    max_tokens: 2000
```

### 4. Configure Tools

To enable external tools, edit the tools configuration:

```bash
# Edit the tools configuration file
nano config/tools.yaml
```

Example configuration:

```yaml
tools:
  web_search:
    enabled: true
    provider: "google"  # or "bing", "duckduckgo"
    api_key: "${SEARCH_API_KEY}"
    cse_id: "your_custom_search_engine_id"  # For Google
    
  file_manager:
    enabled: true
    storage_path: "/data/files"
    allowed_extensions: ["pdf", "docx", "txt", "csv", "xlsx"]
    max_file_size: 10485760  # 10MB
    
  data_analyzer:
    enabled: true
    libraries:
      - "pandas"
      - "numpy"
      - "matplotlib"
      - "seaborn"
    
  code_executor:
    enabled: true
    timeout: 10  # seconds
    max_memory: 512  # MB
    allowed_modules:
      - "math"
      - "random"
      - "datetime"
      - "json"
      - "re"
    blocked_modules:
      - "os"
      - "sys"
      - "subprocess"
      - "socket"
```

### 5. Configure Memory System

To customize the memory system, edit the memory configuration:

```bash
# Edit the memory configuration file
nano config/memory.yaml
```

Example configuration:

```yaml
memory:
  vector_store:
    provider: "qdrant"  # or "pinecone", "milvus", etc.
    url: "${VECTOR_DB_URL}"
    collection_name: "nexus_memories"
    dimension: 1536  # For OpenAI embeddings
    
  embedding_model: "text-embedding-3-small"
  
  episodic_memory:
    enabled: true
    retention_period: 90  # days
    importance_threshold: 0.5
    
  working_memory:
    max_items: 50
    window_size: 10  # conversations
    
  semantic_memory:
    enabled: true
    knowledge_bases:
      - name: "general"
        path: "data/knowledge/general"
      - name: "technical"
        path: "data/knowledge/technical"
```

## Verification and Testing

### 1. Check System Status

```bash
# Check API server status
curl http://localhost:8000/status

# Expected output:
# {"status":"ok","version":"1.0.0","components":{"database":"ok","redis":"ok","vector_db":"ok"}}
```

### 2. Test AI Council Components

```bash
# Run the AI Council test script
python -m control_center.scripts.test_ai_council

# This will test each specialist and verify they're working correctly
```

### 3. Monitor Logs

```bash
# View API logs
tail -f logs/api.log

# View Control Center logs
tail -f logs/control_center.log

# View specialist model logs
tail -f logs/specialists/*.log
```

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Errors

**Symptoms:**
- "Could not connect to database" errors in logs
- Application fails to start

**Solutions:**
1. Verify database services are running:
   ```bash
   sudo systemctl status postgresql
   sudo systemctl status redis
   sudo systemctl status mongod
   ```

2. Check connection strings in `.env` file
3. Ensure database users have correct permissions
4. Check firewall rules if using remote databases

#### AI Model Loading Issues

**Symptoms:**
- "Failed to load model" errors
- Slow response times or timeouts

**Solutions:**
1. Verify model files exist in the configured directory
2. Check API keys for cloud-based models
3. Verify GPU is properly configured with `nvidia-smi`
4. Check model configuration in `config/ai_council.yaml`

#### Memory System Errors

**Symptoms:**
- "Vector store connection failed" errors
- Memory retrieval or storage failures

**Solutions:**
1. Verify vector database is running
2. Check embedding model configuration
3. Ensure proper index creation in the vector database
4. Verify environment variables for database connections

#### Tool Execution Failures

**Symptoms:**
- Tool-related errors in specialist logs
- "Tool execution failed" messages

**Solutions:**
1. Check API keys for external tools
2. Verify tool configurations in `config/tools.yaml`
3. Check network connectivity for web-based tools
4. Review file permissions for file-related tools

## Security Recommendations

1. **API Keys and Secrets:**
   - Never commit API keys to version control
   - Use environment variables or a secrets manager
   - Rotate API keys regularly

2. **Network Security:**
   - Enable HTTPS with valid certificates
   - Use firewalls to restrict access to admin interfaces
   - Implement proper authentication for all endpoints

3. **Data Protection:**
   - Enable encryption for databases
   - Implement proper user data handling policies
   - Consider data anonymization for sensitive information

4. **Model Security:**
   - Validate and sanitize all inputs to AI models
   - Implement rate limiting and monitoring
   - Use sandboxing for code execution tools

## Next Steps

1. **System Integration:**
   - Connect to your existing frontends
   - Configure authentication systems
   - Set up monitoring and alerts

2. **Content Setup:**
   - Populate knowledge bases
   - Train custom models if needed
   - Configure personality parameters

3. **User Management:**
   - Set up user roles and permissions
   - Configure access controls
   - Create documentation for end users

4. **Performance Tuning:**
   - Optimize database configurations
   - Adjust caching parameters
   - Fine-tune AI model settings

By following this guide, you should have a fully functional Nexus Control Center with the AI Council architecture. If you encounter any issues not covered in the troubleshooting section, refer to the detailed documentation or contact the development team for support.