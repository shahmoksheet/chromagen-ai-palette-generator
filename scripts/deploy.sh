#!/bin/bash

# Main deployment script for ChromaGen production
set -e

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_TAG=${IMAGE_TAG:-latest}
COMPOSE_FILE="docker-compose.prod.yml"
MONITORING_COMPOSE_FILE="docker-compose.monitoring.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build frontend image
    docker build -f Dockerfile.frontend -t ${DOCKER_REGISTRY}/chromagen-frontend:${IMAGE_TAG} .
    
    # Build backend image
    docker build -f Dockerfile.backend -t ${DOCKER_REGISTRY}/chromagen-backend:${IMAGE_TAG} .
    
    print_status "Docker images built successfully"
}

# Function to push images to registry
push_images() {
    if [ "$SKIP_PUSH" != "true" ]; then
        print_status "Pushing images to registry..."
        
        docker push ${DOCKER_REGISTRY}/chromagen-frontend:${IMAGE_TAG}
        docker push ${DOCKER_REGISTRY}/chromagen-backend:${IMAGE_TAG}
        
        print_status "Images pushed successfully"
    else
        print_warning "Skipping image push (SKIP_PUSH=true)"
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Start database service first
    docker-compose -f ${COMPOSE_FILE} --env-file .env.production up -d db
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f ${COMPOSE_FILE} --env-file .env.production run --rm backend ./scripts/migrate-database.sh
    
    print_status "Database migrations completed"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Pull latest images
    docker-compose -f ${COMPOSE_FILE} --env-file .env.production pull
    
    # Start services
    docker-compose -f ${COMPOSE_FILE} --env-file .env.production up -d
    
    print_status "Application deployed successfully"
}

# Function to deploy monitoring stack
deploy_monitoring() {
    if [ "$DEPLOY_MONITORING" = "true" ]; then
        print_status "Deploying monitoring stack..."
        
        docker-compose -f ${MONITORING_COMPOSE_FILE} up -d
        
        print_status "Monitoring stack deployed successfully"
    else
        print_warning "Skipping monitoring deployment (DEPLOY_MONITORING not set to true)"
    fi
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost > /dev/null 2>&1; then
        print_status "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_status "All health checks passed"
}

# Function to deploy to CDN
deploy_cdn() {
    if [ "$DEPLOY_CDN" = "true" ]; then
        print_status "Deploying to CDN..."
        ./scripts/deploy-to-cdn.sh
        print_status "CDN deployment completed"
    else
        print_warning "Skipping CDN deployment (DEPLOY_CDN not set to true)"
    fi
}

# Function to cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old images (keep last 3 versions)
    docker images ${DOCKER_REGISTRY}/chromagen-frontend --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi || true
    
    docker images ${DOCKER_REGISTRY}/chromagen-backend --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi || true
    
    print_status "Cleanup completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo "===================="
    
    docker-compose -f ${COMPOSE_FILE} --env-file .env.production ps
    
    echo ""
    print_status "Service URLs:"
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost/api"
    echo "Health Check: http://localhost/api/health"
    
    if [ "$DEPLOY_MONITORING" = "true" ]; then
        echo "Grafana: http://localhost:3000"
        echo "Prometheus: http://localhost:9090"
    fi
}

# Function to rollback deployment
rollback() {
    print_warning "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f ${COMPOSE_FILE} --env-file .env.production down
    
    # Deploy previous version
    PREVIOUS_TAG=$(docker images ${DOCKER_REGISTRY}/chromagen-backend --format "{{.Tag}}" | sed -n '2p')
    
    if [ -n "$PREVIOUS_TAG" ]; then
        IMAGE_TAG=$PREVIOUS_TAG deploy_application
        print_status "Rollback completed to version: $PREVIOUS_TAG"
    else
        print_error "No previous version found for rollback"
        exit 1
    fi
}

# Main deployment function
main() {
    echo "=== ChromaGen Production Deployment ==="
    echo "Environment: $ENVIRONMENT"
    echo "Image Tag: $IMAGE_TAG"
    echo "Registry: $DOCKER_REGISTRY"
    echo "======================================="
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            build_images
            push_images
            run_migrations
            deploy_application
            deploy_monitoring
            deploy_cdn
            run_health_checks
            cleanup
            show_status
            print_status "Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "health")
            run_health_checks
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status|health|cleanup}"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

main "$@"