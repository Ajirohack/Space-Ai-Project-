FROM node:16-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy server code
# Note: This copies from the build context's root, assuming the context is the 'server' directory
COPY . .

# Create necessary directories if they don't exist in the source
RUN mkdir -p uploads data logs memory

# Set proper permissions (adjust if needed)
RUN chmod -R 777 uploads data logs memory

EXPOSE 3001
CMD ["npm", "run", "dev"]
