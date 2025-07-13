# Unified container using only Node.js (no nginx)
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Build frontend first
WORKDIR /tmp/frontend
COPY frontend/package*.json ./
RUN npm ci && npm cache clean --force
COPY frontend/ ./
RUN npm run build

# Setup backend
WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Copy built frontend to public directory
COPY --from=0 /tmp/frontend/build ./public

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R appuser:nodejs uploads

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# Expose port 5000
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]