#!/bin/bash

# Unified deployment script for Spare Queen
set -e

echo "🚀 Starting unified deployment..."

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.unified.yml down 2>/dev/null || true

# Build and start unified container
echo "🏗️  Building unified container..."
docker compose -f docker-compose.unified.yml build --no-cache

echo "🚀 Starting unified container..."
docker compose -f docker-compose.unified.yml up -d

# Wait for service to be healthy
echo "⏳ Waiting for service to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if docker compose -f docker-compose.unified.yml ps | grep -q "healthy"; then
    echo "✅ Unified deployment successful!"
    echo "🌐 Application available at: http://localhost"
    echo "📊 View logs: docker compose -f docker-compose.unified.yml logs -f"
else
    echo "❌ Service is not healthy. Check logs:"
    docker compose -f docker-compose.unified.yml logs
    exit 1
fi

echo "🎉 Deployment complete!"
echo ""
echo "📝 Notes:"
echo "  - Frontend and backend run in a single container"
echo "  - Nginx serves the frontend and proxies API calls to the backend"
echo "  - All routes are handled by React Router"
echo "  - API endpoints are available at /api/*"