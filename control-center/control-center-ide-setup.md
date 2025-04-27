# Control Center: IDE Setup Guide

This guide provides instructions for setting up your development environment for working on the Nexus Control Center project. It covers IDE configuration, extensions, and settings to optimize your development workflow.

## Recommended IDEs

### Visual Studio Code

Visual Studio Code is the recommended IDE for working with the Nexus Control Center codebase due to its excellent support for Python, JavaScript, and Docker.

#### Installation

1. Download and install VS Code from [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. Install the following essential extensions:

   - **Python** (Microsoft) - For Python language support
   - **Pylance** (Microsoft) - Advanced Python language server
   - **Docker** (Microsoft) - For Docker container management
   - **Remote - Containers** (Microsoft) - For developing inside Docker containers
   - **ESLint** (Microsoft) - JavaScript linting
   - **Prettier** (Prettier) - Code formatting
   - **YAML** (Red Hat) - YAML support for configuration files
   - **REST Client** (Huachao Mao) - For testing API endpoints
   - **GitLens** (GitKraken) - Enhanced Git capabilities
   - **MongoDB for VS Code** (MongoDB) - For working with MongoDB
   - **Redis** (Dunn) - For working with Redis

#### VS Code Settings

Create a `.vscode/settings.json` file in your project root with the following configuration:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "python.formatting.provider": "black",
  "python.formatting.blackArgs": ["--line-length", "88"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "python.testing.nosetestsEnabled": false,
  "python.testing.pytestArgs": ["tests"],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/node_modules": true,
    "**/.venv": true,
    "**/venv": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/*.code-search": true,
    "**/.venv": true,
    "**/venv": true
  }
}
```

#### VS Code Launch Configuration

Create a `.vscode/launch.json` file for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Control Center",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/control_center/main.py",
      "args": ["--debug"],
      "console": "integratedTerminal",
      "justMyCode": false,
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    },
    {
      "name": "Python: API Gateway",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["api.main:app", "--reload"],
      "console": "integratedTerminal",
      "justMyCode": false,
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    },
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal",
      "justMyCode": false,
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    }
  ]
}
```

### PyCharm Professional

PyCharm Professional is an excellent alternative IDE with strong Python support and integrated tools for web development and databases.

#### Installation

1. Download and install PyCharm Professional from [https://www.jetbrains.com/pycharm/](https://www.jetbrains.com/pycharm/)
2. Install the following plugins from Settings/Preferences > Plugins:
   - **Docker**
   - **MongoDB**
   - **Redis**
   - **Prettier**
   - **Env File**
   - **Requirements**

#### PyCharm Configuration

1. **Project Structure**:
   - Set the project Python interpreter to your virtual environment
   - Mark the `control_center` and `api` directories as Sources Root

2. **Run Configurations**:
   - Create a "Python" configuration for `control_center/main.py`
   - Create a "Python" configuration for running API with parameters: `-m uvicorn api.main:app --reload`
   - Set working directory to the project root for both configurations

3. **Code Quality Tools**:
   - Enable Black formatter (Settings > Tools > Black)
   - Enable Pylint (Settings > Tools > Pylint)
   - Configure mypy (Settings > Tools > mypy)

## Virtual Environment Setup

It's recommended to use a virtual environment for development. You can set it up using the following commands:

### Using venv

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
```

### Using Poetry

```bash
pip install poetry
poetry install
poetry shell
```

## Docker Development Environment

For a fully containerized development experience, you can use the provided Docker configuration.

### VS Code Remote Containers

1. Install the "Remote - Containers" extension
2. Press F1 and select "Remote-Containers: Open Folder in Container..."
3. Select the project folder
4. VS Code will build the development container and open the project inside it

### Manual Docker Setup

```bash
# Build the development container
docker build -f docker/Dockerfile.dev -t nexus-control-center-dev .

# Run the container with source code mounted
docker run -it --rm \
  -v $(pwd):/app \
  -p 8000:8000 \
  -p 8080:8080 \
  nexus-control-center-dev
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=true

# Control Center Configuration
CC_HOST=0.0.0.0
CC_PORT=8080
CC_DEBUG=true

# Database Connections
POSTGRES_URI=postgresql://control_center:secure_password@localhost:5432/control_center
REDIS_URI=redis://localhost:6379/0
VECTOR_DB_URL=http://localhost:6333

# AI Models
OPENAI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here

# Tool APIs
SEARCH_API_KEY=your_key_here
```

## Git Hooks

Set up pre-commit hooks for code quality checks:

1. Install pre-commit:
   ```bash
   pip install pre-commit
   ```

2. Create a `.pre-commit-config.yaml` file:
   ```yaml
   repos:
   - repo: https://github.com/pre-commit/pre-commit-hooks
     rev: v4.4.0
     hooks:
     - id: trailing-whitespace
     - id: end-of-file-fixer
     - id: check-yaml
     - id: check-added-large-files

   - repo: https://github.com/psf/black
     rev: 23.3.0
     hooks:
     - id: black

   - repo: https://github.com/charliermarsh/ruff-pre-commit
     rev: 'v0.0.262'
     hooks:
     - id: ruff
       args: [--fix, --exit-non-zero-on-fix]

   - repo: https://github.com/pre-commit/mirrors-mypy
     rev: v1.3.0
     hooks:
     - id: mypy
       additional_dependencies: [types-requests, types-PyYAML]
   ```

3. Install the hooks:
   ```bash
   pre-commit install
   ```

## Development Workflow Tips

### Running Tests

```bash
# Run all tests
pytest

# Run tests with coverage report
pytest --cov=control_center --cov=api

# Run a specific test file
pytest tests/test_ai_council.py
```

### Generating API Documentation

```bash
# Start the API server
uvicorn api.main:app --reload

# Access the Swagger documentation
# Navigate to http://localhost:8000/docs in your browser
```

### Database Management

To set up local databases for development, you can use Docker:

```bash
# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=control_center \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=control_center \
  postgres:14

# Start Redis
docker run -d --name redis -p 6379:6379 redis:latest

# Start Qdrant (vector database)
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant:latest
```

### Troubleshooting Common Issues

#### Import Errors

If you encounter import errors, make sure:
1. Your virtual environment is activated
2. The project root is in your PYTHONPATH
3. The correct directories are marked as Sources Root in your IDE

#### Docker Connection Issues

If you can't connect to services in Docker:
1. Check if the container is running with `docker ps`
2. Verify the port mapping with `docker port container_name`
3. Try connecting with the container IP directly: `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container_name`

#### API Key Errors

If you're getting API key errors:
1. Check that your `.env` file is properly formatted
2. Verify that environment variables are being loaded
3. Ensure your API keys have the correct permissions

## Recommended Extensions

### VS Code Extensions for AI/ML Development

- **Jupyter** - For working with Jupyter notebooks
- **Pylance** - Enhanced Python language server
- **Python Docstring Generator** - Generates docstrings automatically
- **Python Test Explorer** - Visual test runner
- **Better TOML** - TOML file support for Poetry
- **YAML** - YAML file support for configuration
- **Rainbow CSV** - Colorizes CSV files for readability
- **Mermaid Preview** - For viewing architecture diagrams
- **Markdown All in One** - Enhanced markdown support

### Browser Extensions

- **JSON Formatter** - For viewing JSON responses from the API
- **React Developer Tools** - For debugging the React dashboard
- **Redux DevTools** - For state management debugging

This guide should help you set up a productive development environment for working on the Nexus Control Center project. If you encounter any issues not covered here, please check the troubleshooting section of the main documentation or contact the development team.
