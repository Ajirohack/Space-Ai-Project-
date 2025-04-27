# Nexus Control Center

A comprehensive backend system for managing AI modules, content routing, and user permissions.

## Features

- User authentication and authorization
- Module registry and management
- Content routing system
- RAG (Retrieval-Augmented Generation) capabilities
- Email service integration
- Membership management
- Model performance monitoring

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Winston Logger

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/nexus-control-center.git
   cd nexus-control-center
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create environment variables
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your configuration.

4. Start the development server
   ```bash
   npm run dev
   ```

## Project Structure

```
├── server/
│   ├── gateway/        # API Gateway
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── .env.example        # Example environment variables
├── package.json        # Project dependencies
├── README.md           # Project documentation
└── server.js           # Entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Modules

- `GET /api/modules` - List all modules
- `GET /api/modules/:id` - Get module details
- `POST /api/modules` - Register a new module
- `PUT /api/modules/:id` - Update module
- `DELETE /api/modules/:id` - Remove module

### Content

- `POST /api/content/process` - Process content
- `GET /api/content/types` - List content types

### Admin

- `GET /api/admin/users` - List all users
- `POST /api/admin/invitations` - Create invitation
- `GET /api/admin/metrics` - Get system metrics

## License

MIT