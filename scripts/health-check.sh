#!/bin/bash

# Health check script for production monitoring
set -e

# Configuration
FRONTEND_URL=${FRONTEND_URL:-"http://localhost"}
BACKEND_URL=${BACKEND_URL:-"http://localhost/api"}
TIMEOUT=10
RETRY_COUNT=3
ALERT_WEBHOOK=${ALERT_WEBHOOK}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"ChromaGen Health Check Alert: $message\", \"severity\":\"$severity\"}" \
            --silent --max-time 5 || true
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url="$1"
    local name="$2"
    local expected_status="${3:-200}"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$url" -o /dev/null); then
            if [ "$response" = "$expected_status" ]; then
                print_success "$name is healthy (HTTP $response)"
                return 0
            else
                print_warning "$name returned HTTP $response (expected $expected_status)"
            fi
        else
            print_warning "$name check failed (attempt $i/$RETRY_COUNT)"
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            sleep 2
        fi
    done
    
    print_error "$name is unhealthy"
    send_alert "$name health check failed" "critical"
    return 1
}

# Function to check database connectivity
check_database() {
    local container_name="chromagen-db-1"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        if docker exec "$container_name" pg_isready -U "${POSTGRES_USER:-chromagen_user}" > /dev/null 2>&1; then
            print_success "Database is healthy"
            return 0
        else
            print_error "Database is not accepting connections"
            send_alert "Database connectivity failed" "critical"
            return 1
        fi
    else
        print_error "Database container is not running"
        send_alert "Database container is down" "critical"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    local container_name="chromagen-redis-1"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        if docker exec "$container_name" redis-cli ping | grep -q "PONG"; then
            print_success "Redis is healthy"
            return 0
        else
            print_error "Redis is not responding"
            send_alert "Redis connectivity failed" "warning"
            return 1
        fi
    else
        print_error "Redis container is not running"
        send_alert "Redis container is down" "warning"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local threshold=85
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        print_success "Disk space is healthy ($usage% used)"
        return 0
    else
        print_error "Disk space is low ($usage% used, threshold: $threshold%)"
        send_alert "Disk space is low: $usage% used" "warning"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    local threshold=85
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt "$threshold" ]; then
        print_success "Memory usage is healthy ($usage% used)"
        return 0
    else
        print_error "Memory usage is high ($usage% used, threshold: $threshold%)"
        send_alert "Memory usage is high: $usage% used" "warning"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    local required_containers=("chromagen-frontend-1" "chromagen-backend-1" "chromagen-db-1")
    local failed_containers=()
    
    for container in "${required_containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [ "$status" = "healthy" ] || [ "$status" = "unknown" ]; then
                print_success "Container $container is running"
            else
                print_error "Container $container is unhealthy (status: $status)"
                failed_containers+=("$container")
            fi
        else
            print_error "Container $container is not running"
            failed_containers+=("$container")
        fi
    done
    
    if [ ${#failed_containers[@]} -eq 0 ]; then
        return 0
    else
        send_alert "Failed containers: ${failed_containers[*]}" "critical"
        return 1
    fi
}

# Function to check SSL certificate expiry
check_ssl_certificate() {
    local domain="$1"
    
    if [ -z "$domain" ]; then
        print_warning "No domain specified for SSL check"
        return 0
    fi
    
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                       openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    if [ -n "$expiry_date" ]; then
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -gt 30 ]; then
            print_success "SSL certificate is valid ($days_until_expiry days remaining)"
            return 0
        elif [ "$days_until_expiry" -gt 7 ]; then
            print_warning "SSL certificate expires in $days_until_expiry days"
            send_alert "SSL certificate expires in $days_until_expiry days" "warning"
            return 1
        else
            print_error "SSL certificate expires in $days_until_expiry days"
            send_alert "SSL certificate expires in $days_until_expiry days" "critical"
            return 1
        fi
    else
        print_warning "Could not check SSL certificate for $domain"
        return 1
    fi
}

# Function to run comprehensive health check
run_health_check() {
    local exit_code=0
    
    echo "=== ChromaGen Health Check ==="
    echo "Timestamp: $(date)"
    echo "=============================="
    
    # Check endpoints
    check_endpoint "$FRONTEND_URL/health" "Frontend" || exit_code=1
    check_endpoint "$BACKEND_URL/health" "Backend API" || exit_code=1
    
    # Check services
    check_database || exit_code=1
    check_redis || exit_code=1
    
    # Check system resources
    check_disk_space || exit_code=1
    check_memory || exit_code=1
    
    # Check containers
    check_containers || exit_code=1
    
    # Check SSL certificate if domain is provided
    if [ -n "$SSL_DOMAIN" ]; then
        check_ssl_certificate "$SSL_DOMAIN" || exit_code=1
    fi
    
    echo "=============================="
    if [ $exit_code -eq 0 ]; then
        print_success "All health checks passed"
    else
        print_error "Some health checks failed"
        send_alert "Health check completed with failures" "warning"
    fi
    
    return $exit_code
}

# Function to generate health report
generate_report() {
    local report_file="/tmp/chromagen-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "ChromaGen Health Report"
        echo "======================"
        echo "Generated: $(date)"
        echo ""
        
        echo "System Information:"
        echo "- Hostname: $(hostname)"
        echo "- Uptime: $(uptime -p)"
        echo "- Load Average: $(uptime | awk -F'load average:' '{print $2}')"
        echo ""
        
        echo "Docker Information:"
        docker version --format "- Docker Version: {{.Server.Version}}"
        echo "- Running Containers: $(docker ps --format "table {{.Names}}" | wc -l)"
        echo ""
        
        echo "Service Status:"
        run_health_check
        
    } > "$report_file"
    
    echo "Health report generated: $report_file"
}

# Main execution
main() {
    case "${1:-check}" in
        "check")
            run_health_check
            ;;
        "report")
            generate_report
            ;;
        "monitor")
            # Continuous monitoring mode
            while true; do
                run_health_check
                sleep 300  # Check every 5 minutes
            done
            ;;
        *)
            echo "Usage: $0 {check|report|monitor}"
            echo ""
            echo "Commands:"
            echo "  check   - Run health check once"
            echo "  report  - Generate detailed health report"
            echo "  monitor - Continuous monitoring mode"
            exit 1
            ;;
    esac
}

main "$@"