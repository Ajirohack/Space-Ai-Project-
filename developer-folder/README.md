> ⚠️ **Before contributing:** Read **REVIEW_GUIDELINES.md** and all `*-REVIEW.md` files.

## Update Instructions & Guidelines

- **Do not delete existing code or start a new project entirely.** All work must be performed on the current codebase.
- **Only update and improve existing code.** Refactor, optimize, or extend functionality without removing core components unless explicitly required.
- **Maintain backward compatibility** wherever possible to avoid breaking existing features.
- **Document all changes**: Clearly comment code updates and update related documentation.
- **Follow project structure and conventions** as established in the current codebase and documentation.
- **Review existing documentation** (README, guidelines, directives) before making changes.
- **Checklist adherence**: Both AI coding models/LLMs and human developers must follow this checklist and these guidelines for all updates and improvements.


# The Space

The Space is a web-based platform that allows users to create, share, and explore virtual spaces. It is built using a microservices architecture centered around a Control Center that orchestrates communication between various modules and services.

## Architecture Overview

The Space follows a hub-and-spoke architecture with these key components:

### Core Components
- **Control Center**: Central orchestration system that manages modules, authentication, and system-wide functionality
- **API Gateway**: Interface layer that handles external API requests and routes them to the appropriate services

### Internal Modules
- **RAG System**: Retrieval-augmented generation system for knowledge management
- **Tools/Packages**: Library of utilities and tools available throughout the platform
- **AI Council**: Orchestration system for AI models and capabilities

### External Modules
- **Nexus**: Primary user interface for interacting with the platform
- **Membership Initiation System (MIS)**: Handles user onboarding and authentication
- **Mobile App**: Native mobile application for on-the-go access
- **Browser Extension**: Integration with web browsers for enhanced functionality

## Getting Started

To get started with The Space, you will need to clone this repository and install the dependencies.

```bash
git clone https://github.com/username/the-space.git
cd the-space
npm install
```

### Development Workflow

This project uses npm workspaces to manage the monorepo structure. To work on a specific component:

```bash
# Install all dependencies
npm install

# Run a specific component in development mode
npm run dev --workspace=control-center
# or
cd control-center && npm run dev
```

### Building for Production

```bash
# Build all components
npm run build

# Build a specific component
npm run build --workspace=api-gateway
```

## Project Structure

```
the-space/
├── api-gateway/         # API Gateway implementation
├── control-center/      # Control Center core implementation
├── internal-modules/    # Internal functionality modules
│   ├── rag-system/
│   ├── tools-packages/
│   └── ai-council/
├── external-modules/    # User-facing application modules
│   ├── nexus/
│   ├── mis/
│   ├── mobile-app/
│   └── browser-extension/
└── config/              # Shared configuration
```

## Contributing

We welcome contributions to The Space! Please read our [contribution guidelines](CONTRIBUTING.md) for more information on how to get involved.

## License

The Space is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.