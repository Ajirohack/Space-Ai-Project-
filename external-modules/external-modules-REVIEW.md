> ⚠️ **Before contributing:** Read **REVIEW_GUIDELINES.md** and all `*-REVIEW.md` files.

# Component: external-modules
Path: the-space/external-modules
Reviewed by: GitHub Copilot
Date: 2025-04-24

## Key files/folders
- nexus/
- mis/
- mobile-app/
- browser-extension/
- telegrambot-engine/

## Dependencies
- express
- react/next.js
- flask/fastapi (MIS)
- redis
- mongodb

## Control Center Integration
- All modules connect to Control Center via API Gateway
- Use REST API for all interactions

## Strengths & Risks
- Strength: Modular, clear separation of external interfaces
- Risk: Needs consistent API contracts, robust error handling, and auth integration

## Recommendations
- Enforce OpenAPI schema validation
- Standardize authentication integration
- Add error handling and logging
- Implement integration tests for all modules

## Action Items
- [ ] Enforce OpenAPI schema validation
- [ ] Standardize authentication integration
- [ ] Add error handling/logging
- [ ] Implement integration tests for all modules

## System Prompt for AI Agents
You are responsible for external modules. All code must:
- Use REST API to communicate with Control Center
- Implement authentication and error handling
- Follow Airbnb style guide (JS/TS) or PEP 8 (Python)
- Include documentation links in code headers
- Pass all lint and test checks before merge
