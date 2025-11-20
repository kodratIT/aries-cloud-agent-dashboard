# Docker Setup Guide

Panduan lengkap untuk menjalankan ACA-Py Svelte Dashboard dengan Docker.

## 📁 Struktur File

File-file Docker yang telah dibuat:
- `Dockerfile` - Multi-stage build untuk production
- `Dockerfile.dev` - Development build dengan hot reload
- `docker-compose.yml` - Dashboard standalone (menggunakan network parent)
- `docker-compose.dev.yml` - Development override
- `.dockerignore` - Mengecualikan file yang tidak perlu dalam image
- `.env.docker` - Template environment variables

## 🚀 Cara Menjalankan

### Option 1: Menggunakan Parent Docker Compose (Recommended)

Dashboard sudah terintegrasi di parent docker-compose.yml. Dari root directory (multi-demo):

```bash
# Build dan jalankan semua services (ACA-Py + Dashboard)
docker compose up --build

# Atau jalankan di background
docker compose up -d --build
```

**Services yang akan berjalan:**
- **wallet-db**: PostgreSQL database (port 5532)
- **multi-agent**: ACA-Py agent (ports 8010, 8001, 8021)
- **acapy-dashboard**: Svelte dashboard (port 3000)

### Option 2: Menjalankan Dashboard Saja (Standalone)

Jika ACA-Py agent sudah running di parent, Anda bisa menjalankan dashboard saja:

**Prerequisites:**
- ACA-Py agent dan database sudah running di parent
- Network `appnet` sudah dibuat

```bash
# Dari directory acapy-svelte-dashboard
cd acapy-svelte-dashboard

# Setup environment (optional)
cp .env.docker .env

# Build dan jalankan dashboard saja
docker compose up --build

# Atau di background
docker compose up -d --build
```

### Option 3: Development Mode dengan Hot Reload

```bash
# Dari directory acapy-svelte-dashboard
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Dashboard akan running di port 5173 dengan hot reload
# Perubahan code akan langsung ter-reload
```

## 🌐 Akses Aplikasi

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard (Production) | http://localhost:3000 | Production build |
| Dashboard (Development) | http://localhost:5173 | Dev server dengan hot reload |
| ACA-Py Admin API | http://localhost:8021 | Admin API endpoint |
| ACA-Py Endpoint | http://localhost:8001 | DIDComm endpoint |

## ⚙️ Environment Variables

### Untuk Standalone Dashboard

Buat file `.env` dengan menyalin dari `.env.docker`:

```bash
cp .env.docker .env
```

**Konfigurasi:**
```env
# Network name (harus sama dengan parent)
APP_NETWORK_NAME=appnet

# Dashboard port
DASHBOARD_PORT=3000

# ACA-Py API URL (gunakan service name dari parent)
PUBLIC_ACAPY_API_URL=http://multi-agent:8021
```

### Untuk Parent Docker Compose

Environment variables sudah dikonfigurasi di parent `.env` file di root directory.

## 🛑 Menghentikan Services

```bash
# Stop dashboard saja (dari acapy-svelte-dashboard directory)
docker compose down

# Stop semua services (dari parent directory)
cd ..
docker compose down

# Stop dan hapus volumes (hapus semua data)
docker compose down -v
```

## 🔧 Docker Commands Berguna

### Melihat Status Container

```bash
# List running containers
docker compose ps

# List all containers (including stopped)
docker compose ps -a
```

### Melihat Logs

```bash
# View logs
docker compose logs acapy-dashboard

# Follow logs (real-time)
docker compose logs -f acapy-dashboard

# Last 100 lines
docker compose logs --tail=100 acapy-dashboard
```

### Rebuild Container

```bash
# Rebuild dashboard
docker compose up --build acapy-dashboard

# Force rebuild (no cache)
docker compose build --no-cache acapy-dashboard
docker compose up acapy-dashboard
```

### Exec ke Container

```bash
# Open shell in container
docker compose exec acapy-dashboard sh

# Run command in container
docker compose exec acapy-dashboard node --version
```

### Clean Up

```bash
# Remove stopped containers
docker compose rm

# Remove images
docker compose down --rmi all

# Remove everything (containers, networks, volumes, images)
docker compose down -v --rmi all
```

## 🐛 Troubleshooting

### Dashboard tidak bisa connect ke ACA-Py

**Problem:** Dashboard menampilkan connection error

**Solution:**

1. Pastikan ACA-Py agent sudah running:
```bash
# Dari parent directory
docker compose ps
```

2. Pastikan network sudah dibuat:
```bash
docker network ls | grep appnet
```

3. Pastikan `PUBLIC_ACAPY_API_URL` menggunakan service name yang benar:
```env
PUBLIC_ACAPY_API_URL=http://multi-agent:8021
```

4. Test connection dari dalam container:
```bash
docker compose exec acapy-dashboard wget -O- http://multi-agent:8021/status
```

### Network appnet not found

**Problem:** Error "network appnet not found"

**Solution:**

Jalankan parent docker-compose terlebih dahulu untuk membuat network:
```bash
# Dari parent directory (multi-demo)
cd ..
docker compose up -d multi-agent wallet-db
```

Atau buat network manual:
```bash
docker network create appnet
```

### Port sudah digunakan

**Problem:** Error "port already in use"

**Solution:**

Ubah port di `.env`:
```env
DASHBOARD_PORT=3001
```

Atau langsung di command:
```bash
DASHBOARD_PORT=3001 docker compose up
```

### Container tidak bisa start

**Problem:** Container exit dengan error

**Solution:**

Check logs untuk detail error:
```bash
docker compose logs acapy-dashboard

# Atau follow logs
docker compose logs -f acapy-dashboard
```

Common issues:
- Missing environment variables
- Network not found
- Port conflict
- Build errors

### Build error

**Problem:** Docker build gagal

**Solution:**

1. Clear Docker cache:
```bash
docker builder prune -a
```

2. Rebuild tanpa cache:
```bash
docker compose build --no-cache
```

3. Check Dockerfile syntax
4. Verify dependencies di package.json

### Hot reload tidak bekerja (Development mode)

**Problem:** Perubahan code tidak ter-reload

**Solution:**

1. Pastikan menggunakan docker-compose.dev.yml:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

2. Verify volume mounts di docker-compose.dev.yml
3. Restart container:
```bash
docker compose restart acapy-dashboard
```

### Permission denied

**Problem:** Error permission denied saat build atau run

**Solution:**

1. Check file permissions:
```bash
ls -la Dockerfile
```

2. Fix permissions:
```bash
chmod 644 Dockerfile
chmod 755 .
```

3. Run dengan sudo (not recommended):
```bash
sudo docker compose up
```

## 📊 Monitoring

### Resource Usage

```bash
# View resource usage
docker stats acapy-dashboard

# View all containers
docker stats
```

### Health Check

```bash
# Check container health
docker compose ps

# Manual health check
curl http://localhost:3000
curl http://localhost:8021/status
```

## 🔒 Security Notes

### Production Deployment

1. **Don't expose unnecessary ports**
```yaml
# Remove port mapping jika tidak perlu akses dari host
# ports:
#   - "3000:3000"
```

2. **Use secrets untuk sensitive data**
```bash
echo "my_secret" | docker secret create api_key -
```

3. **Run as non-root user**
```dockerfile
USER node
```

4. **Limit resources**
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

5. **Use specific image versions**
```dockerfile
FROM node:20-alpine  # Good
# FROM node:latest   # Bad
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## 💡 Tips

1. **Use .dockerignore** untuk exclude unnecessary files
2. **Multi-stage builds** untuk smaller images
3. **Layer caching** untuk faster builds
4. **Health checks** untuk monitoring
5. **Named volumes** untuk data persistence
6. **Networks** untuk service isolation
7. **Environment variables** untuk configuration
8. **Logs** untuk debugging

---

Happy Dockerizing! 🐳
