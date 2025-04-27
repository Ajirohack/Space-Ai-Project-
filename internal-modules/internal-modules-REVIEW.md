> ⚠️ **Before contributing:** Read **REVIEW_GUIDELINES.md** and all `*-REVIEW.md` files.

# Component: internal-modules
Path: the-space/internal-modules
Reviewed by: GitHub Copilot
Date: 2025-04-24

## Key files/folders
- rag-system/
- tools-packages/
- ai-council/

## Dependencies
- langchain.js
- pinecone/milvus
- redis
- mongodb
- docker

## Control Center Integration
- All modules register with Control Center
- Expose APIs for RAG, tools, and AI orchestration

## Strengths & Risks
- Strength: Modular, clear separation of RAG, tools, and AI council
- Risk: Needs robust API contracts, error handling, and resource isolation

## Recommendations
- Enforce API schema validation
- Harden Docker tool isolation
- Add resource monitoring
- Implement error handling for all module APIs

## Action Items
- [ ] Enforce API schema validation
- [ ] Harden Docker tool isolation
- [ ] Add resource monitoring
- [ ] Implement error handling for all module APIs

## System Prompt for AI Agents
You are responsible for internal modules. All code must:
- Use TypeScript with strict mode
- Integrate with Control Center via REST API
- Use LangChain.js for RAG and AI Council
- Use Docker for tool isolation
- Use Redis for queues/context
- Use MongoDB for metadata
- Follow Airbnb style guide
- Include documentation links in code headers
- Pass all lint and test checks before merge
