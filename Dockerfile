# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --no-audit --no-fund && npm cache clean --force
COPY frontend/ ./
RUN npm run build

# Stage 2: Production container
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Setup backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/build ./public

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