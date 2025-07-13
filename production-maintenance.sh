#!/bin/bash

# Production maintenance script for Spare Queen
set -e

COMPOSE_FILE="docker-compose.prod.yml"

case "$1" in
    "start")
        echo "🚀 Starting production services..."
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    "stop")
        echo "⏹️  Stopping production services..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    "restart")
        echo "🔄 Restarting production services..."
        docker-compose -f $COMPOSE_FILE restart
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "status")
        echo "📊 Service status:"
        docker-compose -f $COMPOSE_FILE ps
        ;;
    "health")
        echo "🔍 Health check:"
        echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost/health || echo 'FAILED')"
        echo "Backend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/health || echo 'FAILED')"
        ;;
    "backup")
        echo "💾 Creating backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        docker run --rm -v spare-queen_uploads_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/uploads_backup_$timestamp.tar.gz -C /data .
        echo "✅ Backup created: backups/uploads_backup_$timestamp.tar.gz"
        ;;
    "update")
        echo "🔄 Updating production deployment..."
        git pull
        docker-compose -f $COMPOSE_FILE build --no-cache
        docker-compose -f $COMPOSE_FILE up -d
        echo "✅ Update complete"
        ;;
    "cleanup")
        echo "🧹 Cleaning up unused Docker resources..."
        docker system prune -f
        docker volume prune -f
        echo "✅ Cleanup complete"
        ;;
    *)
        echo "🛠️  Spare Queen Production Maintenance"
        echo ""
        echo "Usage: $0 {start|stop|restart|logs|status|health|backup|update|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all production services"
        echo "  stop    - Stop all production services"
        echo "  restart - Restart all production services"
        echo "  logs    - Show live logs"
        echo "  status  - Show service status"
        echo "  health  - Check service health"
        echo "  backup  - Backup uploads data"
        echo "  update  - Pull latest code and rebuild"
        echo "  cleanup - Clean up unused Docker resources"
        exit 1
        ;;
esac