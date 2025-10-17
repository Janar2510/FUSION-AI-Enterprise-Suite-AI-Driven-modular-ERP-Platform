# FusionAI Enterprise Suite - Deployment Guide

## Overview

This guide covers the deployment of FusionAI Enterprise Suite across different environments, from local development to production.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2

#### Recommended Requirements
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD
- **OS**: Linux (Ubuntu 22.04+)

### Software Dependencies

#### Required
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+
- **Python**: 3.11+
- **Git**: 2.30+

#### Optional
- **Kubernetes**: 1.24+ (for production)
- **Helm**: 3.0+ (for Kubernetes)
- **Terraform**: 1.0+ (for infrastructure)

## Environment Setup

### 1. Development Environment

#### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd fusionai-enterprise-suite

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start the application
docker-compose up -d
```

#### Manual Setup

1. **Backend Setup**
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp ../config/env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

2. **Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp ../config/env.example .env.local
# Edit .env.local with your configuration

# Start the frontend
npm run dev
```

3. **Database Setup**
```bash
# Start database services
docker-compose up -d postgres redis qdrant

# Wait for services to be ready
sleep 10

# Verify services are running
docker-compose ps
```

### 2. Staging Environment

#### Docker Compose Deployment
```bash
# Set environment to staging
export ENVIRONMENT=staging

# Build and start services
docker-compose -f docker-compose.staging.yml up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Verify deployment
curl http://localhost:8000/health
```

#### Environment Variables
```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@postgres:5432/fusionai_staging
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENAI_API_KEY=your_openai_key
JWT_SECRET_KEY=your_jwt_secret
```

### 3. Production Environment

#### Kubernetes Deployment

1. **Prepare Kubernetes Cluster**
```bash
# Create namespace
kubectl create namespace fusionai

# Create secrets
kubectl create secret generic fusionai-secrets \
  --from-literal=database-url="postgresql://user:pass@postgres:5432/fusionai" \
  --from-literal=redis-url="redis://redis:6379/0" \
  --from-literal=openai-api-key="your_openai_key" \
  --from-literal=jwt-secret-key="your_jwt_secret" \
  -n fusionai
```

2. **Deploy with Helm**
```bash
# Add Helm repository
helm repo add fusionai https://charts.fusionai.com
helm repo update

# Install the application
helm install fusionai fusionai/fusionai-enterprise-suite \
  --namespace fusionai \
  --set image.tag=latest \
  --set ingress.enabled=true \
  --set ingress.host=your-domain.com
```

3. **Verify Deployment**
```bash
# Check pods
kubectl get pods -n fusionai

# Check services
kubectl get services -n fusionai

# Check ingress
kubectl get ingress -n fusionai
```

#### Docker Swarm Deployment
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml fusionai

# Check services
docker service ls
```

## Configuration

### Environment Variables

#### Core Configuration
```bash
# Application
APP_NAME=FusionAI Enterprise Suite
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/database
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Redis
REDIS_URL=redis://host:6379/0
REDIS_MAX_CONNECTIONS=20

# Qdrant
QDRANT_URL=http://host:6333
QDRANT_COLLECTION_NAME=fusionai_vectors

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
AI_MODEL=gpt-4-turbo-preview
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000

# Security
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=https://your-domain.com,https://app.your-domain.com
ALLOWED_HOSTS=your-domain.com,app.your-domain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_SIZE=200
```

#### External Services
```bash
# Email
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=fusionai-storage
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=INFO
```

### Database Configuration

#### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE fusionai_erp;

-- Create user
CREATE USER fusionai_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE fusionai_erp TO fusionai_user;

-- Create extensions
\c fusionai_erp;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### Redis Configuration
```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Qdrant Configuration
```yaml
# qdrant.yaml
service:
  host: 0.0.0.0
  http_port: 6333
  grpc_port: 6334

storage:
  storage_path: /qdrant/storage
  snapshots_path: /qdrant/snapshots
  wal_capacity_mb: 32
  wal_segments_ahead: 0

cluster:
  enabled: false
```

## Monitoring & Logging

### 1. Application Monitoring

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fusionai-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'fusionai-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

#### Grafana Dashboards
- Import dashboard JSON files from `monitoring/grafana/dashboards/`
- Configure data sources for Prometheus and PostgreSQL
- Set up alerting rules for critical metrics

### 2. Logging Configuration

#### ELK Stack Setup
```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
```

### 3. Health Checks

#### Application Health
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping

# Qdrant health
curl http://localhost:6333/health
```

#### Kubernetes Health Checks
```yaml
# health-check.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: health-check
data:
  health-check.sh: |
    #!/bin/bash
    curl -f http://localhost:8000/health || exit 1
    curl -f http://localhost:3000/health || exit 1
```

## Security

### 1. Network Security

#### Firewall Configuration
```bash
# UFW rules for Ubuntu
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # Backend API (internal only)
sudo ufw enable
```

#### SSL/TLS Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/fusionai.crt;
    ssl_certificate_key /etc/ssl/private/fusionai.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Application Security

#### Security Headers
```python
# security.py
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}
```

#### Input Validation
```python
# validation.py
from pydantic import BaseModel, validator, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
```

## Backup & Recovery

### 1. Database Backup

#### PostgreSQL Backup
```bash
# Create backup
pg_dump -h localhost -U fusionai_user -d fusionai_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U fusionai_user -d fusionai_erp < backup_20240115_120000.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U fusionai_user -d fusionai_erp | gzip > $BACKUP_DIR/fusionai_$DATE.sql.gz
find $BACKUP_DIR -name "fusionai_*.sql.gz" -mtime +7 -delete
```

#### Redis Backup
```bash
# Create backup
redis-cli --rdb /backups/redis_$(date +%Y%m%d_%H%M%S).rdb

# Restore backup
redis-cli --pipe < /backups/redis_20240115_120000.rdb
```

### 2. Application Backup

#### Docker Volume Backup
```bash
# Backup volumes
docker run --rm -v fusionai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Restore volumes
docker run --rm -v fusionai_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data_20240115_120000.tar.gz -C /data
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### 2. Redis Connection Issues
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Check logs
docker-compose logs redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

#### 3. AI Agent Issues
```bash
# Check agent status
curl http://localhost:8000/api/v1/ai/agents/status

# Check logs
docker-compose logs backend

# Restart AI services
docker-compose restart backend
```

### Performance Issues

#### 1. Slow Database Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

#### 2. High Memory Usage
```bash
# Check memory usage
docker stats

# Check Redis memory
docker-compose exec redis redis-cli INFO memory

# Check application memory
curl http://localhost:8000/metrics | grep memory
```

## Maintenance

### 1. Regular Maintenance Tasks

#### Daily
- Monitor system health and performance
- Check error logs and alerts
- Verify backup completion

#### Weekly
- Review security logs
- Update dependencies
- Clean up old logs and temporary files

#### Monthly
- Security updates and patches
- Performance optimization
- Capacity planning review

### 2. Update Procedures

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Build new images
docker-compose build

# Deploy with zero downtime
docker-compose up -d --no-deps backend
docker-compose up -d --no-deps frontend
```

#### Database Updates
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Verify migration
docker-compose exec backend alembic current
```

## Support

### Getting Help

1. **Documentation**: Check this guide and API documentation
2. **Logs**: Review application and system logs
3. **Community**: Join our Discord server
4. **Support**: Contact support@fusionai.com

### Reporting Issues

When reporting issues, please include:
- Environment details (OS, Docker version, etc.)
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

---

This deployment guide provides comprehensive instructions for deploying FusionAI Enterprise Suite across different environments. For additional support or questions, please refer to our documentation or contact our support team.




