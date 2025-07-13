#!/bin/bash

# Production deployment script for Spare Queen
set -e

echo "🚀 Starting production deployment..."

# Check if required files exist
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found"
    echo "📝 Please copy .env.production.example to .env.production and update with your values"
    exit 1
fi

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment if you want to always pull fresh)
# echo "🧹 Cleaning up old images..."
# docker image prune -f

# Build and start production containers
echo "🏗️  Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
    echo "✅ Production deployment successful!"
    echo "🌐 Frontend available at: http://localhost"
    echo "🔧 Backend API available at: http://localhost:5000"
    echo "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "❌ Some services are not healthy. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo "🎉 Deployment complete!"