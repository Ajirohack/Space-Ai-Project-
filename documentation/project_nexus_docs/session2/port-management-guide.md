# Port Management Guide for AI Software Engineers

When developing distributed systems like Project Nexus that involve multiple services running in containers or on bare metal, proper port management is crucial to avoid conflicts and ensure smooth operation. This guide provides best practices for managing ports in AI development environments.

## Why Port Management Matters

Poor port management can lead to:
- Services failing to start due to port conflicts
- Connection errors between services
- Security vulnerabilities if using default ports
- Debugging difficulties when tracing connection issues

## Common Ports Used in AI Development

Before assigning ports to your services, be aware of these commonly used ports:

### AI Model Serving
- **Ollama**: 11434
- **Open Web UI**: 8080 (UI), 1234 (API)
- **Text Generation WebUI**: 7860
- **LM Studio**: 1234 (OpenAI-compatible API)
- **LocalAI**: 8080
- **FastChat**: 8000
- **Hugging Face Text Generation Inference**: 8080

### Web Development
- **Frontend Development Servers**: 3000, 8000, 8080
- **Backend API Servers**: 5000, 8000, 8080, 3001
- **WebSockets**: 8080, 3001

### Databases
- **MongoDB**: 27017
- **PostgreSQL**: 5432
- **MySQL/MariaDB**: 3306
- **Redis**: 6379
- **Elasticsearch**: 9200, 9300

### Infrastructure
- **Docker**: 2375, 2376
- **Kubernetes API**: 6443
- **Prometheus**: 9090
- **Grafana**: 3000

## Checking Occupied Ports

Always check which ports are already in use before configuring your services:

### Linux/macOS
```bash
# List all listening ports with process information
sudo lsof -i -P -n | grep LISTEN

# Check if a specific port is in use
sudo lsof -i :8080

# Get detailed network statistics
netstat -tuln
```

### Windows
```powershell
# List all listening ports (PowerShell)
netstat -ano | findstr LISTENING

# Check specific port
netstat -ano | findstr :8080

# List processes with their port assignments
Get-NetTCPConnection | Where-Object State -eq Listen | Format-Table -Property LocalPort,OwningProcess,@{Name="ProcessName";Expression={(Get-Process -Id $_.OwningProcess).ProcessName}} -AutoSize
```

### Docker
```bash
# List all running containers with port mappings
docker ps --format "{{.Names}} - {{.Ports}}"

# Check port bindings for a specific container
docker port container_name
```

## Best Practices for Port Assignment

1. **Use Environment Variables**: Never hardcode port numbers in your application. Use environment variables to configure ports:
   ```javascript
   const port = process.env.PORT || 5000;
   ```

2. **Document Port Usage**: Maintain a list of ports used by your project in your documentation:
   ```
   Frontend: 3000
   Backend API: 5000
   Ollama: 11434
   MongoDB: 27017
   Redis: 6379
   ```

3. **Use Non-Standard Ports**: Avoid using common ports like 80, 443, 8080 when possible to reduce conflict chances.

4. **Port Ranges**: Assign port ranges for related services:
   ```
   AI Services: 10000-10999
   API Services: 11000-11999
   Databases: 12000-12999
   ```

5. **Check Before Binding**: Implement port availability checks before your service starts:
   ```javascript
   function isPortAvailable(port) {
     const net = require('net');
     return new Promise((resolve) => {
       const server = net.createServer();
       server.once('error', () => resolve(false));
       server.once('listening', () => {
         server.close();
         resolve(true);
       });
       server.listen(port);
     });
   }
   ```

6. **Fallback Ports**: Implement a fallback mechanism if your preferred port is already taken:
   ```javascript
   async function findAvailablePort(startPort) {
     let port = startPort;
     while (!(await isPortAvailable(port))) {
       port++;
       if (port > startPort + 100) {
         throw new Error('No available ports found');
       }
     }
     return port;
   }
   ```

## Docker Port Binding

When using Docker, follow these guidelines:

1. **Host-Container Mapping**: Use the format `HOST_PORT:CONTAINER_PORT` in your Docker Compose files:
   ```yaml
   services:
     nexus-server:
       ports:
         - "5000:5000"  # Maps host port 5000 to container port 5000
   ```

2. **Dynamic Port Assignment**: Let Docker assign available host ports by specifying only the container port:
   ```yaml
   services:
     nexus-server:
       ports:
         - "5000"  # Docker will assign an available host port
   ```

3. **Container Network Communication**: Services in the same Docker network can communicate using their service names and container ports without exposing ports to the host:
   ```yaml
   services:
     nexus-server:
       networks:
         - nexus-network
       # No ports exposed to host needed for internal communication
     
     nexus-client:
       networks:
         - nexus-network
       # Client can reach server at http://nexus-server:5000
   ```

4. **Localhost Binding**: For development environments, bind to all interfaces, not just localhost:
   ```yaml
   services:
     nexus-server:
       ports:
         - "0.0.0.0:5000:5000"  # Accessible from other machines
   ```

## Port Configuration in Project Nexus

For Project Nexus specifically:

1. **Configuration Files**: Update these files when changing ports:
   - `.env`
   - `docker-compose.yml`
   - `server/config.js` (if exists)
   - `client/.env` (for frontend API URL)

2. **Service-Specific Ports**:
   - Nexus Frontend: 3000
   - Nexus Backend: 5000
   - Open Web UI: 8080
   - Open Web UI API: 1234
   - Ollama: 11434
   - MongoDB: 27017
   - Redis: 6379

3. **Check for Conflicts**: Before starting Nexus, verify these ports are available:
   ```bash
   for port in 3000 5000 8080 1234 11434 27017 6379; do
     lsof -i :$port || echo "Port $port is available"
   done
   ```

## Troubleshooting Port Issues

If you encounter port-related issues:

1. **Address Already in Use**:
   ```bash
   # Find the process using the port
   lsof -i :8080  # Linux/macOS
   netstat -ano | findstr :8080  # Windows
   
   # Kill the process
   kill -9 <PID>  # Linux/macOS
   taskkill /PID <PID> /F  # Windows
   ```

2. **Connection Refused**:
   - Verify the service is running
   - Check if the port is correctly exposed in Docker
   - Ensure there are no firewall blocks
   - Verify you're using the correct hostname (localhost vs. container name vs. IP address)

3. **Bind Failed in Docker**:
   - Check if another container or host process is using the port
   - Verify you have sufficient permissions
   - Try binding to a different host port

By following these port management best practices, you'll avoid common configuration issues and create more robust, deployable AI systems like Project Nexus.
