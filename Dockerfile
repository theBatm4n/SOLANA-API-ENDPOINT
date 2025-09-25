FROM node:18-alpine

# Update package database and upgrade vulnerable packages
RUN apk update && apk upgrade
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose your API port
EXPOSE 8080

# Start your API
CMD ["npm", "start"]