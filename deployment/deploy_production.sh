#!/bin/bash
# 2025-01-27: Production deployment script for dirReactFinal
# Handles complete production deployment with safety checks and rollback

set -e  # Exit on any error

# Configuration
PROJECT_NAME="dirReactFinal"
DEPLOYMENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$DEPLOYMENT_DIR/docker"
BACKUP_DIR="$DEPLOYMENT_DIR/backups"
LOG_FILE="$DEPLOYMENT_DIR/deployment.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$DOCKER_DIR/.env" ]; then
        log_error "Environment file not found: $DOCKER_DIR/.env"
        log "Please create the environment file with required variables."
        exit 1
    fi
    
    # Check if SSL certificates exist
    if [ ! -f "$DOCKER_DIR/apache/ssl/cert.pem" ] || [ ! -f "$DOCKER_DIR/apache/ssl/key.pem" ]; then
        log_warning "SSL certificates not found. Deployment will continue but HTTPS will not work."
        log "Please place SSL certificates in $DOCKER_DIR/apache/ssl/"
    fi
    
    log_success "Prerequisites check completed"
}

# Function to create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR/$TIMESTAMP"
    
    # Backup Docker volumes
    if docker volume ls | grep -q "${PROJECT_NAME}_"; then
        log "Backing up Docker volumes..."
        for volume in $(docker volume ls --format "{{.Name}}" | grep "${PROJECT_NAME}_"); do
            docker run --rm -v "$volume:/data" -v "$BACKUP_DIR/$TIMESTAMP:/backup" alpine tar czf "/backup/${volume}.tar.gz" -C /data .
        done
    fi
    
    # Backup configuration files
    log "Backing up configuration files..."
    cp -r "$DOCKER_DIR" "$BACKUP_DIR/$TIMESTAMP/"
    
    log_success "Backup created: $BACKUP_DIR/$TIMESTAMP"
}

# Function to stop current deployment
stop_current_deployment() {
    log "Stopping current deployment..."
    
    if [ -f "$DOCKER_DIR/docker-compose.prod.yml" ]; then
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.prod.yml down --remove-orphans || true
        log_success "Current deployment stopped"
    else
        log_warning "No current deployment found to stop"
    fi
}

# Function to build and deploy
deploy_application() {
    log "Starting production deployment..."
    
    cd "$DOCKER_DIR"
    
    # Pull latest images
    log "Pulling latest base images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Build application images
    log "Building application images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    log "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Production deployment completed"
}

# Function to check service health
check_service_health() {
    log "Checking service health..."
    
    cd "$DOCKER_DIR"
    
    # Check if all services are running
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_error "Some services are not running. Checking logs..."
        docker-compose -f docker-compose.prod.yml logs --tail=50
        exit 1
    fi
    
    # Check health endpoints
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        # Check Django backend health
        if curl -f http://localhost:8000/health/ > /dev/null 2>&1; then
            log_success "Django backend is healthy"
        else
            log_warning "Django backend health check failed (attempt $attempt)"
        fi
        
        # Check React frontend health
        if curl -f http://localhost:3000/ > /dev/null 2>&1; then
            log_success "React frontend is healthy"
        else
            log_warning "React frontend health check failed (attempt $attempt)"
        fi
        
        # Check Apache health
        if curl -f http://localhost/health/ > /dev/null 2>&1; then
            log_success "Apache server is healthy"
            break
        else
            log_warning "Apache health check failed (attempt $attempt)"
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Health checks failed after $max_attempts attempts"
            log "Checking service logs..."
            docker-compose -f docker-compose.prod.yml logs --tail=100
            exit 1
        fi
        
        attempt=$((attempt + 1))
        sleep 10
    done
    
    log_success "All services are healthy"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    log "Running post-deployment tests..."
    
    # Test API endpoints
    log "Testing API endpoints..."
    if curl -f https://localhost/api/ > /dev/null 2>&1; then
        log_success "API endpoints are accessible"
    else
        log_warning "API endpoints test failed"
    fi
    
    # Test frontend
    log "Testing frontend..."
    if curl -f https://localhost/ > /dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend test failed"
    fi
    
    # Test admin interface
    log "Testing admin interface..."
    if curl -f https://localhost/admin/ > /dev/null 2>&1; then
        log_success "Admin interface is accessible"
    else
        log_warning "Admin interface test failed"
    fi
    
    log_success "Post-deployment tests completed"
}

# Function to rollback deployment
rollback_deployment() {
    log_error "Deployment failed. Starting rollback..."
    
    if [ -d "$BACKUP_DIR/$TIMESTAMP" ]; then
        log "Rolling back to backup: $BACKUP_DIR/$TIMESTAMP"
        
        # Stop current deployment
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.prod.yml down --remove-orphans || true
        
        # Restore from backup
        log "Restoring from backup..."
        cp -r "$BACKUP_DIR/$TIMESTAMP"/* "$DOCKER_DIR/"
        
        # Restart previous deployment
        log "Restarting previous deployment..."
        docker-compose -f docker-compose.prod.yml up -d
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Function to display deployment status
show_deployment_status() {
    log "Deployment Status:"
    echo "=================="
    
    cd "$DOCKER_DIR"
    
    # Show running containers
    log "Running containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    # Show service logs
    log "Recent service logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=20
    
    # Show resource usage
    log "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last 5)..."
    
    # Keep only the last 5 backups
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    
    log_success "Old backups cleaned up"
}

# Main deployment function
main() {
    log "🚀 Starting $PROJECT_NAME production deployment..."
    log "Deployment timestamp: $TIMESTAMP"
    log "Deployment directory: $DEPLOYMENT_DIR"
    
    # Create log file
    touch "$LOG_FILE"
    
    # Set trap for error handling
    trap 'log_error "Deployment failed. Check logs at: $LOG_FILE"; rollback_deployment; exit 1' ERR
    
    # Execute deployment steps
    check_prerequisites
    create_backup
    stop_current_deployment
    deploy_application
    run_post_deployment_tests
    cleanup_old_backups
    
    # Show final status
    show_deployment_status
    
    log_success "🎉 Production deployment completed successfully!"
    log "Deployment log: $LOG_FILE"
    log "Backup location: $BACKUP_DIR/$TIMESTAMP"
    
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${BLUE}📄 Logs: $LOG_FILE${NC}"
    echo -e "${BLUE}💾 Backup: $BACKUP_DIR/$TIMESTAMP${NC}"
    echo -e "${BLUE}🌐 Application: https://localhost${NC}"
    echo -e "${BLUE}📊 Monitoring: http://localhost:3000 (Grafana)${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  deploy      Deploy the application (default)"
    echo "  status      Show deployment status"
    echo "  stop        Stop the deployment"
    echo "  restart     Restart the deployment"
    echo "  logs        Show service logs"
    echo "  backup      Create a backup"
    echo "  rollback    Rollback to previous deployment"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy      # Deploy the application"
    echo "  $0 status      # Show current status"
    echo "  $0 logs        # Show service logs"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        cd "$DOCKER_DIR"
        show_deployment_status
        ;;
    "stop")
        log "Stopping production deployment..."
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.prod.yml down
        log_success "Production deployment stopped"
        ;;
    "restart")
        log "Restarting production deployment..."
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.prod.yml restart
        log_success "Production deployment restarted"
        ;;
    "logs")
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "backup")
        create_backup
        ;;
    "rollback")
        rollback_deployment
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        log_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
