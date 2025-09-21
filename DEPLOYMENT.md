# ChromaGen Production Deployment Guide

This document provides comprehensive instructions for deploying ChromaGen to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Database Setup](#database-setup)
5. [CDN Configuration](#cdn-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **Memory**: Minimum 4GB RAM, Recommended 8GB+ RAM
- **Storage**: Minimum 50GB SSD, Recommended 100GB+ SSD
- **Network**: Stable internet connection with sufficient bandwidth

### Software Dependencies

- Docker 20.10+
- Docker Compose 2.0+
- Git
- AWS CLI (for CDN deployment)
- Node.js 18+ (for local development)

### Installation Commands

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/chromagen.git
cd chromagen
```

### 2. Configure Environment Variables

Copy the production environment template:

```bash
cp .env.production .env.production.local
```

Edit `.env.production.local` with your specific values:

```bash
# Database Configuration
DATABASE_URL=postgresql://chromagen_user:your_secure_password@db:5432/chromagen_prod
POSTGRES_DB=chromagen_prod
POSTGRES_USER=chromagen_user
POSTGRES_PASSWORD=your_secure_password

# API Keys
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Security
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
CORS_ORIGIN=https://yourdomain.com

# CDN Configuration (if using AWS CloudFront)
CDN_BUCKET=your-s3-bucket-name
CDN_REGION=us-east-1
CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
CDN_URL=https://your-cdn-domain.com

# Monitoring (optional)
GRAFANA_PASSWORD=your_grafana_password
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 3. Set File Permissions

```bash
chmod +x scripts/*.sh
chmod 600 .env.production.local
```

## Docker Deployment

### Quick Deployment

For a standard deployment with all services:

```bash
# Deploy everything
ENVIRONMENT=production ./scripts/deploy.sh deploy

# Deploy with monitoring
DEPLOY_MONITORING=true ./scripts/deploy.sh deploy

# Deploy with CDN
DEPLOY_CDN=true ./scripts/deploy.sh deploy
```

### Manual Step-by-Step Deployment

1. **Build Images**:
```bash
docker build -f Dockerfile.frontend -t chromagen-frontend:latest .
docker build -f Dockerfile.backend -t chromagen-backend:latest .
```

2. **Start Database**:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d db redis
```

3. **Run Migrations**:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local run --rm backend ./scripts/migrate-database.sh
```

4. **Start Application**:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

### Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoints
curl http://localhost/api/health
curl http://localhost/health
```

## Database Setup

### PostgreSQL Configuration

The production setup uses PostgreSQL with the following optimizations:

- Connection pooling
- Automated backups
- SSL encryption
- Performance tuning

### Manual Database Setup

If you prefer to use an external database:

1. **Create Database**:
```sql
CREATE DATABASE chromagen_prod;
CREATE USER chromagen_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chromagen_prod TO chromagen_user;
```

2. **Update Connection String**:
```bash
DATABASE_URL=postgresql://chromagen_user:your_password@your-db-host:5432/chromagen_prod
```

### Backup Configuration

Automated backups are configured to run every 6 hours:

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db-backup /scripts/backup-cron.sh

# Restore from backup
docker-compose -f docker-compose.prod.yml exec db-backup /scripts/restore-database.sh backup_file.sql.gz
```

## CDN Configuration

### AWS CloudFront Setup

1. **Deploy Infrastructure**:
```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudfront.yml \
  --stack-name chromagen-cdn \
  --parameter-overrides \
    DomainName=yourdomain.com \
    CertificateArn=arn:aws:acm:us-east-1:account:certificate/cert-id \
    Environment=production
```

2. **Deploy Assets**:
```bash
CDN_BUCKET=your-bucket-name \
CDN_REGION=us-east-1 \
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id \
./scripts/deploy-to-cdn.sh
```

### Alternative CDN Providers

For other CDN providers (Cloudflare, Azure CDN, etc.), modify the `deploy-to-cdn.sh` script accordingly.

## Monitoring Setup

### Prometheus + Grafana Stack

Deploy the monitoring stack:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access Monitoring Dashboards

- **Grafana**: http://localhost:3000 (admin/your_grafana_password)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### Configure Alerts

Edit `monitoring/alertmanager.yml` to configure notification channels:

```yaml
receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'admin@yourdomain.com'
        from: 'alerts@yourdomain.com'
        smarthost: 'smtp.yourdomain.com:587'
        auth_username: 'alerts@yourdomain.com'
        auth_password: 'your_email_password'
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

1. **Install Certbot**:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Obtain Certificate**:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Update Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    # Your existing configuration...
}
```

## Backup and Recovery

### Automated Backup Strategy

1. **Database Backups**: Every 6 hours, retained for 30 days
2. **Application Data**: Daily snapshots of uploaded files
3. **Configuration Backups**: Weekly backups of environment files

### Manual Backup Commands

```bash
# Create database backup
./scripts/backup-cron.sh

# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env.production.local monitoring/
```

### Recovery Procedures

1. **Database Recovery**:
```bash
./scripts/restore-database.sh chromagen_backup_20231201_120000.sql.gz
```

2. **Application Recovery**:
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore files
tar -xzf uploads-backup-20231201.tar.gz

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check database status
docker-compose -f docker-compose.prod.yml logs db

# Test connection
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push
```

#### 2. High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services if needed
docker-compose -f docker-compose.prod.yml restart
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --dry-run
```

### Log Analysis

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend frontend

# System logs
journalctl -u docker.service -f

# Nginx logs
docker-compose -f docker-compose.prod.yml exec frontend tail -f /var/log/nginx/access.log
```

### Performance Monitoring

```bash
# Check system resources
htop
df -h
free -h

# Check Docker resources
docker system df
docker system prune -f
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application logs
- Check system resources
- Verify backup completion

#### Weekly
- Update security patches
- Review monitoring alerts
- Clean up old Docker images

#### Monthly
- Update dependencies
- Review and rotate API keys
- Performance optimization review

### Update Procedures

1. **Application Updates**:
```bash
# Pull latest code
git pull origin main

# Deploy new version
IMAGE_TAG=v1.2.0 ./scripts/deploy.sh deploy
```

2. **Security Updates**:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling Considerations

For high-traffic scenarios:

1. **Horizontal Scaling**:
   - Use Docker Swarm or Kubernetes
   - Implement load balancing
   - Scale database with read replicas

2. **Performance Optimization**:
   - Enable Redis caching
   - Optimize database queries
   - Use CDN for all static assets

### Support and Documentation

- **Application Logs**: `/var/log/chromagen/`
- **Configuration Files**: `/etc/chromagen/`
- **Backup Location**: `/backups/`
- **Monitoring Dashboards**: Available at configured URLs

For additional support, refer to the main README.md or contact the development team.