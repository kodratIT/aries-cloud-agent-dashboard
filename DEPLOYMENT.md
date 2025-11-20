# Production Deployment Guide

Panduan lengkap untuk deploy ACA-Py Multi-Tenant Dashboard ke production.

## 📋 Pre-Deployment Checklist

### Security
- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Strong database passwords
- [ ] Firewall configured
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Infrastructure
- [ ] Domain name configured
- [ ] DNS records set up
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Log aggregation set up
- [ ] CDN configured (optional)
- [ ] Load balancer configured (if scaling)

### Application
- [ ] Production build tested
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Health checks working
- [ ] Error tracking configured
- [ ] Performance optimized

## 🚀 Deployment Options

### Option 1: VPS/Cloud Server (Recommended)

Cocok untuk: Full control, custom configuration

#### 1.1 Server Setup

**Minimum Requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD
- Ubuntu 22.04 LTS atau similar

**Install Dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx (reverse proxy)
sudo apt install nginx -y

# Install Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

#### 1.2 Clone dan Setup

```bash
# Clone repository
git clone https://github.com/your-repo/acapy-multi-demo.git
cd acapy-multi-demo

# Setup environment
cp .env.example .env
nano .env  # Edit dengan production values
```

**Production .env:**
```bash
# ACA-Py Configuration
ACAPY_ENDPOINT=https://agent.yourdomain.com
ACAPY_AGENT_ACCESS=public

# Network Names
APP_NETWORK_NAME=appnet
ELK_NETWORK_NAME=elknet

# Logging
LOG_LEVEL=WARNING
RUST_LOG=ERROR

# Dashboard
PUBLIC_ACAPY_API_URL=http://multi-agent:8021

# Database (use strong passwords!)
POSTGRES_USER=acapy_user
POSTGRES_PASSWORD=your_strong_password_here
```

#### 1.3 Start Services

```bash
# Build dan start
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

#### 1.4 Configure Nginx

**Create Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/acapy-dashboard
```

**Nginx configuration:**
```nginx
# Dashboard
server {
    listen 80;
    server_name dashboard.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ACA-Py Admin API
server {
    listen 80;
    server_name agent.yourdomain.com;

    location / {
        proxy_pass http://localhost:8021;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ACA-Py Endpoint
server {
    listen 80;
    server_name endpoint.yourdomain.com;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/acapy-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 1.5 Setup SSL with Let's Encrypt

```bash
# Get SSL certificates
sudo certbot --nginx -d dashboard.yourdomain.com
sudo certbot --nginx -d agent.yourdomain.com
sudo certbot --nginx -d endpoint.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

#### 1.6 Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Option 2: Docker Swarm (Scaling)

Cocok untuk: High availability, load balancing

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml acapy

# Scale services
docker service scale acapy_acapy-dashboard=3

# Check services
docker service ls
docker service ps acapy_acapy-dashboard
```

### Option 3: Kubernetes

Cocok untuk: Enterprise deployment, auto-scaling

**Create Kubernetes manifests:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: acapy-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: acapy-dashboard
  template:
    metadata:
      labels:
        app: acapy-dashboard
    spec:
      containers:
      - name: dashboard
        image: your-registry/acapy-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: PUBLIC_ACAPY_API_URL
          value: "http://multi-agent:8021"
---
apiVersion: v1
kind: Service
metadata:
  name: acapy-dashboard
spec:
  selector:
    app: acapy-dashboard
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

```bash
# Apply manifests
kubectl apply -f deployment.yaml

# Check status
kubectl get pods
kubectl get services
```

### Option 4: Cloud Platforms

#### AWS (ECS/Fargate)
1. Push image ke ECR
2. Create ECS cluster
3. Define task definition
4. Create service
5. Configure ALB

#### Google Cloud (Cloud Run)
```bash
# Build dan push
gcloud builds submit --tag gcr.io/PROJECT_ID/acapy-dashboard

# Deploy
gcloud run deploy acapy-dashboard \
  --image gcr.io/PROJECT_ID/acapy-dashboard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure (Container Instances)
```bash
# Create resource group
az group create --name acapy-rg --location eastus

# Deploy container
az container create \
  --resource-group acapy-rg \
  --name acapy-dashboard \
  --image your-registry/acapy-dashboard:latest \
  --dns-name-label acapy-dashboard \
  --ports 3000
```

## 🔧 Post-Deployment Configuration

### 1. Database Backup

**Automated backup script:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="multi-demo-wallet-db-1"

mkdir -p $BACKUP_DIR

docker exec $CONTAINER pg_dump -U DB_USER > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

**Setup cron job:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 2. Monitoring

**Install monitoring tools:**
```bash
# Prometheus + Grafana
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana
```

**Health check endpoint:**
```bash
# Check dashboard
curl https://dashboard.yourdomain.com

# Check ACA-Py
curl https://agent.yourdomain.com/status
```

### 3. Log Management

**Configure log rotation:**
```bash
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

sudo systemctl restart docker
```

**Centralized logging (optional):**
```bash
# ELK Stack atau Loki
docker compose -f elk-stack/docker-compose.yml up -d
```

### 4. Performance Optimization

**Nginx caching:**
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    # ... other proxy settings
}
```

**Database tuning:**
```sql
-- PostgreSQL optimization
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Restart PostgreSQL
SELECT pg_reload_conf();
```

## 🔒 Security Hardening

### 1. Docker Security

```bash
# Run containers as non-root
# Add to Dockerfile
USER node

# Limit resources
docker update --memory="512m" --cpus="1" acapy-dashboard

# Use secrets for sensitive data
echo "my_secret" | docker secret create db_password -
```

### 2. Network Security

```bash
# Restrict database access
# docker-compose.yml
services:
  wallet-db:
    networks:
      - app-network
    # Don't expose ports publicly
```

### 3. Application Security

**Security headers (Nginx):**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📊 Monitoring & Alerts

### Health Checks

**Create monitoring script:**
```bash
#!/bin/bash
# monitor.sh

DASHBOARD_URL="https://dashboard.yourdomain.com"
AGENT_URL="https://agent.yourdomain.com/status"

# Check dashboard
if curl -f -s $DASHBOARD_URL > /dev/null; then
    echo "Dashboard: OK"
else
    echo "Dashboard: FAILED"
    # Send alert (email, Slack, etc)
fi

# Check ACA-Py
if curl -f -s $AGENT_URL > /dev/null; then
    echo "ACA-Py: OK"
else
    echo "ACA-Py: FAILED"
    # Send alert
fi
```

**Setup monitoring cron:**
```bash
# Every 5 minutes
*/5 * * * * /path/to/monitor.sh
```

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Check logs
docker compose logs -f acapy-dashboard
```

### Database Maintenance

```bash
# Vacuum database
docker exec multi-demo-wallet-db-1 psql -U DB_USER -c "VACUUM ANALYZE;"

# Check database size
docker exec multi-demo-wallet-db-1 psql -U DB_USER -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

## 🆘 Troubleshooting

### Service Down
```bash
# Check container status
docker compose ps

# Restart service
docker compose restart acapy-dashboard

# View logs
docker compose logs --tail=100 acapy-dashboard
```

### High Memory Usage
```bash
# Check resource usage
docker stats

# Limit memory
docker update --memory="1g" acapy-dashboard
```

### Database Connection Issues
```bash
# Check database
docker compose logs wallet-db

# Test connection
docker exec multi-demo-wallet-db-1 psql -U DB_USER -c "SELECT 1;"
```

## 📞 Support

- Documentation: Check README.md dan guides
- Issues: GitHub Issues
- Community: Join discussions

## ✅ Post-Deployment Checklist

- [ ] All services running
- [ ] HTTPS working
- [ ] Database backup configured
- [ ] Monitoring set up
- [ ] Logs accessible
- [ ] Health checks passing
- [ ] Performance acceptable
- [ ] Security headers configured
- [ ] Firewall rules applied
- [ ] DNS records correct
- [ ] SSL certificates valid
- [ ] Documentation updated

Congratulations! Your ACA-Py Multi-Tenant Dashboard is now in production! 🎉
