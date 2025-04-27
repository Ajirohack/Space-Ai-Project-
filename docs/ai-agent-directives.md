# AI Agent Directives for Implementing "the-space"

## Update Instructions & Guidelines

- **Do not delete existing code or start a new project entirely.** All work must be performed on the current codebase.
- **Only update and improve existing code.** Refactor, optimize, or extend functionality without removing core components unless explicitly required.
- **Maintain backward compatibility** wherever possible to avoid breaking existing features.
- **Document all changes**: Clearly comment code updates and update related documentation.
- **Follow project structure and conventions** as established in the current codebase and documentation.
- **Review existing documentation** (README, guidelines, directives) before making changes.
- **Checklist adherence**: Both AI coding models/LLMs and human developers must follow this checklist and these guidelines for all updates and improvements.


This document provides specific directives for AI coding agents to follow when implementing "the-space" architecture. These directives are designed to ensure consistent, high-quality code that avoids common pitfalls and follows best practices.

## General Directives for All AI Agents

### 1. Model-Specific Responsibilities

- **Claude 3.7 Sonnet / Claude 3.5 Sonnet**
  - Focus on backend architecture design, API endpoints, and service interactions
  - Generate robust TypeScript interfaces and type definitions
  - Design database schemas and data models
  - Create comprehensive error handling strategies

- **Gemini 2.5 Pro**
  - Focus on frontend component development and UI/UX implementation
  - Design responsive layouts and interactive elements
  - Implement state management patterns
  - Create accessibility-compliant components

- **Gemini 2.5 Flash Thinking**
  - Focus on system integrations and workflow automation
  - Design event-driven architectures
  - Create data transformation pipelines
  - Implement real-time communication systems

- **o4 mini / o4 mini high**
  - Focus on optimization, performance improvements, and refactoring
  - Identify and eliminate bottlenecks
  - Implement caching strategies
  - Create performance benchmarks

- **GPT-4.1**
  - Focus on testing strategies, documentation, and security implementations
  - Create comprehensive test suites
  - Generate documentation from code
  - Implement security best practices

### 2. Extension Tool Usage

- **Context7**
  - Use for maintaining context across complex, multi-part implementations
  - Store architectural decisions and design patterns
  - Track implementation progress against requirements
  - Reference technical specifications across sessions

- **GitHub Integration**
  - Use for code repository exploration and reference
  - Search for relevant patterns and implementations
  - Reference popular open-source projects for best practices
  - Check package version compatibility

- **VSCode Extensions**
  - ESLint: For code quality and adherence to style guidelines
  - Prettier: For consistent code formatting
  - TypeScript: For type checking and static analysis
  - REST Client: For API testing and documentation

### 3. Documentation Directives

- Maintain clear, comprehensive JSDoc comments for all functions, classes, and modules
- Create README.md files for each component with setup and usage instructions
- Document API endpoints using OpenAPI/Swagger
- Include diagrams (as markdown or links) for complex workflows

### 4. Code Quality Directives

- Follow SOLID principles in all object-oriented code
- Implement proper error handling with custom error classes
- Use asynchronous patterns consistently (Promise, async/await)
- Apply proper logging at appropriate levels
- Add meaningful comments for complex logic

## Component-Specific Directives

### Control Center

```
DIRECTIVE FOR: Control Center Implementation
ASSIGNED TO: Claude 3.7 Sonnet, GPT-4.1
PRIORITY: High
DEPENDENCIES: None

IMPLEMENTATION GUIDELINES:
1. Implement as a standalone Express.js application
2. Use dependency injection for modular component composition
3. Implement a plugin architecture for module registry
4. Use Redis for distributed state management
5. Implement JWT-based authentication with proper key rotation
6. Use TypeScript for all code with strict typing
7. Follow RESTful API design principles
8. Implement comprehensive logging and monitoring
9. Use MongoDB with Mongoose for data models

PITFALLS TO AVOID:
1. DO NOT rely on global state
2. DO NOT use synchronous file operations
3. DO NOT hardcode configuration values
4. DO NOT use deprecated npm packages
5. DO NOT mix authentication strategies
6. DO NOT expose sensitive information in logs
7. DO NOT use MongoDB without proper indexing
8. DO NOT implement authorization checks without proper testing

REFERENCE RESOURCES:
- Express.js: https://expressjs.com/en/5x/api.html
- MongoDB: https://www.mongodb.com/docs/drivers/node/current/
- JWT: https://github.com/auth0/node-jsonwebtoken#readme
- TypeScript: https://www.typescriptlang.org/docs/handbook/intro.html
```

### RAG System

```
DIRECTIVE FOR: RAG System Implementation
ASSIGNED TO: Claude 3.7 Sonnet, Gemini 2.5 Flash Thinking
PRIORITY: High
DEPENDENCIES: Control Center

IMPLEMENTATION GUIDELINES:
1. Use LangChain.js for structured RAG implementation
2. Implement vector database integration with Pinecone or Milvus
3. Create a document processing pipeline with proper chunking
4. Implement embedding generation with configurable models
5. Create a query planning and execution system
6. Implement source retrieval and attribution
7. Use MongoDB for document metadata storage
8. Create a plugin system for custom document processors

PITFALLS TO AVOID:
1. DO NOT use synchronous API calls for vector operations
2. DO NOT mix different embedding models without normalization
3. DO NOT store large documents in MongoDB (use GridFS or S3)
4. DO NOT implement retrieval without relevance scoring
5. DO NOT generate embeddings without batching for efficiency
6. DO NOT neglect error handling for external API calls
7. DO NOT implement without proper rate limiting
8. DO NOT create document chunks without context overlap

REFERENCE RESOURCES:
- LangChain.js: https://js.langchain.com/docs/
- Pinecone: https://docs.pinecone.io/
- Milvus: https://milvus.io/docs
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
```

### Tools/Packages System

```
DIRECTIVE FOR: Tools/Packages System
ASSIGNED TO: o4 mini high, GPT-4.1
PRIORITY: Medium
DEPENDENCIES: Control Center

IMPLEMENTATION GUIDELINES:
1. Implement a registry system for tool registration
2. Use Docker for tool isolation and execution
3. Create a standardized tool interface specification
4. Implement an execution queue with Redis
5. Create a resource management system
6. Implement input validation and schema checking
7. Create standardized error reporting
8. Implement tool versioning and dependency resolution

PITFALLS TO AVOID:
1. DO NOT execute untrusted code without isolation
2. DO NOT implement without resource limits
3. DO NOT create blocking execution workflows
4. DO NOT store tool binary data in the database
5. DO NOT ignore tool execution errors
6. DO NOT implement without proper logging
7. DO NOT create tools without version constraints
8. DO NOT implement without security scanning

REFERENCE RESOURCES:
- Docker Node SDK: https://docs.docker.com/engine/api/sdk/
- Redis Queues: https://github.com/OptimalBits/bull#documentation
- JSON Schema: https://json-schema.org/specification
- Semantic Versioning: https://semver.org/
```

### AI Council

```
DIRECTIVE FOR: AI Council Implementation
ASSIGNED TO: Claude 3.5 Sonnet, Gemini 2.5 Pro
PRIORITY: High
DEPENDENCIES: Control Center, RAG System

IMPLEMENTATION GUIDELINES:
1. Implement model registry with versioning and capabilities
2. Create adapters for different AI providers (OpenAI, Anthropic, etc.)
3. Implement orchestration system for multi-agent workflows
4. Create context sharing mechanism
5. Implement task planning and distribution
6. Create result aggregation and consensus mechanisms
7. Implement fallback and error recovery strategies
8. Create a model performance monitoring system

PITFALLS TO AVOID:
1. DO NOT implement without proper token counting
2. DO NOT create hard dependencies on specific providers
3. DO NOT ignore rate limiting requirements
4. DO NOT implement without proper error handling
5. DO NOT store sensitive data in prompts or contexts
6. DO NOT neglect proper API key management
7. DO NOT implement without cost tracking
8. DO NOT create circular dependencies in agent workflows

REFERENCE RESOURCES:
- OpenAI API: https://platform.openai.com/docs/api-reference
- Anthropic API: https://docs.anthropic.com/claude/reference/getting-started-with-the-api
- LangChain.js Agents: https://js.langchain.com/docs/modules/agents/
- Vector-stores: https://js.langchain.com/docs/modules/data_connection/vectorstores/
```

### API Gateway

```
DIRECTIVE FOR: API Gateway Implementation
ASSIGNED TO: o4 mini, Claude 3.5 Sonnet
PRIORITY: High
DEPENDENCIES: Control Center

IMPLEMENTATION GUIDELINES:
1. Implement as an Express.js application
2. Create routing system for service discovery
3. Implement authentication and token validation
4. Create rate limiting with Redis
5. Implement request validation
6. Create logging and monitoring
7. Implement circuit breaker pattern
8. Create response transformation middleware

PITFALLS TO AVOID:
1. DO NOT implement without proper error handling
2. DO NOT create single points of failure
3. DO NOT neglect security headers
4. DO NOT implement without proper logging
5. DO NOT create excessive middleware chains
6. DO NOT implement without performance monitoring
7. DO NOT neglect proper CORS configuration
8. DO NOT create excessive proxy layers

REFERENCE RESOURCES:
- Express Gateway: https://www.express-gateway.io/docs/
- Node Rate Limiter: https://github.com/animir/node-rate-limiter-flexible#readme
- Opossum Circuit Breaker: https://github.com/nodeshift/opossum#readme
- Express Validator: https://express-validator.github.io/docs/
```

### Nexus Frontend

```
DIRECTIVE FOR: Nexus Frontend Implementation
ASSIGNED TO: Gemini 2.5 Pro, GPT-4.1
PRIORITY: Medium
DEPENDENCIES: API Gateway

IMPLEMENTATION GUIDELINES:
1. Implement using Next.js framework
2. Use React with functional components and hooks
3. Implement state management with React Context or Redux Toolkit
4. Create responsive design with TailwindCSS
5. Implement form handling with React Hook Form
6. Create API client for backend communication
7. Implement authentication flow
8. Create accessibility-compliant components

PITFALLS TO AVOID:
1. DO NOT implement without proper state management
2. DO NOT create prop drilling across multiple components
3. DO NOT neglect loading and error states
4. DO NOT implement without proper form validation
5. DO NOT create excessive re-renders
6. DO NOT neglect responsive design
7. DO NOT implement without proper accessibility
8. DO NOT create client-side-only authentication

REFERENCE RESOURCES:
- Next.js: https://nextjs.org/docs
- React: https://react.dev/
- TailwindCSS: https://tailwindcss.com/docs
- React Hook Form: https://react-hook-form.com/get-started
```

## Testing Directives

### Unit Testing

```
DIRECTIVE FOR: Unit Testing
ASSIGNED TO: All AI Agents
PRIORITY: High

IMPLEMENTATION GUIDELINES:
1. Use Jest as the primary testing framework
2. Create test files with `.test.ts` or `.spec.ts` extension
3. Implement mocking for external dependencies
4. Create test coverage reports
5. Implement snapshot testing where appropriate
6. Create test fixtures and factory functions
7. Implement parameterized tests for edge cases
8. Create separate test configuration

PITFALLS TO AVOID:
1. DO NOT test implementation details
2. DO NOT create tests that depend on each other
3. DO NOT implement without proper assertions
4. DO NOT create tests without clear failure messages
5. DO NOT neglect edge cases and error conditions
6. DO NOT create brittle snapshot tests
7. DO NOT implement tests that access external services
8. DO NOT create tests without proper setup and teardown

REFERENCE RESOURCES:
- Jest: https://jestjs.io/docs/
- Testing Library: https://testing-library.com/docs/
- Test Doubles: https://martinfowler.com/bliki/TestDouble.html
```

### Integration Testing

```
DIRECTIVE FOR: Integration Testing
ASSIGNED TO: GPT-4.1, Claude 3.7 Sonnet
PRIORITY: Medium

IMPLEMENTATION GUIDELINES:
1. Use Supertest for API testing
2. Create docker-compose setup for integration tests
3. Implement database seeding and cleanup
4. Create end-to-end test workflows
5. Implement authentication for protected endpoints
6. Create test reports and logging
7. Implement parallel test execution where possible
8. Create separate test configuration

PITFALLS TO AVOID:
1. DO NOT implement tests that depend on specific environment
2. DO NOT create tests without proper cleanup
3. DO NOT implement without proper assertions
4. DO NOT create tests that are flaky or timing-dependent
5. DO NOT neglect error conditions and edge cases
6. DO NOT implement tests without proper logging
7. DO NOT create tests that are too slow to run regularly
8. DO NOT implement without consideration for CI/CD pipeline

REFERENCE RESOURCES:
- Supertest: https://github.com/ladjs/supertest#readme
- Docker Compose: https://docs.docker.com/compose/
- MongoDB Testing: https://www.mongodb.com/docs/drivers/node/current/fundamentals/testing/
```

## Security Directives

```
DIRECTIVE FOR: Security Implementation
ASSIGNED TO: All AI Agents
PRIORITY: Critical

IMPLEMENTATION GUIDELINES:
1. Implement input validation for all user inputs
2. Create proper authentication and authorization
3. Implement secure password handling with bcrypt
4. Create proper CORS configuration
5. Implement security headers
6. Create rate limiting for authentication endpoints
7. Implement secure session management
8. Create proper error handling without leaking information

PITFALLS TO AVOID:
1. DO NOT store sensitive information in plaintext
2. DO NOT implement without proper input validation
3. DO NOT create security by obscurity
4. DO NOT hardcode secrets or credentials
5. DO NOT implement without proper HTTPS
6. DO NOT create excessive permission grants
7. DO NOT neglect proper dependency management
8. DO NOT implement without security testing

REFERENCE RESOURCES:
- OWASP Top 10: https://owasp.org/Top10/
- Express Security Best Practices: https://expressjs.com/en/advanced/best-practice-security.html
- JWT Security: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- NodeJS Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
```

## Final Implementation Notes

1. Always check the implementation checklist before starting a new component
2. Mark tasks as completed only after tests pass successfully
3. Review all code for security vulnerabilities before submission
4. Use consistent naming conventions across all components
5. Follow semantic versioning for all packages and components
6. Document all decisions and deviations from specifications
7. Create comprehensive API documentation for all endpoints
8. Implement proper error handling and logging throughout

By following these directives, AI agents will be able to implement "the-space" architecture efficiently and with high quality, avoiding common pitfalls and ensuring consistency across components.
