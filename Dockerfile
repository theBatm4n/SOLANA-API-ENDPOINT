FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# Copy source code
COPY src/ ./src/

# Debug: Show what files were copied
RUN ls -la && ls -la src/

# Build the project with error output
RUN npm run build || (echo "Build failed!" && exit 1)

# Verify the build
RUN ls -la dist/ || (echo "No dist directory!" && exit 1)

EXPOSE 8080
CMD ["node", "dist/server.js"]
