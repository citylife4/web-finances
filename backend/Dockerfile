# Backend Dockerfile
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Note: Using npm install instead of npm ci due to compatibility issues with npm 11.6.2
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/
COPY healthcheck.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["node", "src/server.js"]
