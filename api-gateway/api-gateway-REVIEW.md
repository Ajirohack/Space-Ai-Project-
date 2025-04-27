# Component: api-gateway
Path: the-space/api-gateway
Reviewed by: GitHub Copilot
Date: 2025-04-24

## Key files/folders
- index.js
- package.json
- IMPLEMENTATION_GUIDELINES.md
- SYSTEM_PROMPT.txt
- TECH_STACK.md
- __tests__/

## Dependencies
- express
- jsonwebtoken
- express-rate-limit
- ioredis
- express-validator

## Control Center Integration
- Forwards validated requests to Control Center endpoints
- Handles authentication, rate limiting, and input validation

## Strengths & Risks
- Strength: Modular, clear separation of concerns, security middleware present
- Risk: Needs robust error handling, circuit breaker, and OpenAPI validation

## Recommendations
- Add OpenAPI validation middleware
- Implement circuit breaker pattern
- Add request/response logging
- Harden CORS and security headers

## Action Items
- [ ] Add OpenAPI validation
- [ ] Implement circuit breaker
- [ ] Add logging middleware
- [ ] Harden CORS/security headers

## System Prompt for AI Agents
You are responsible for maintaining the API Gateway. All code must:
- Use Express.js 4.18.x
- Implement JWT authentication
- Use Redis for rate limiting
- Validate all input with express-validator
- Forward requests to Control Center endpoints
- Follow Airbnb style guide
- Include documentation links in code headers
- Pass all lint and test checks before merge
