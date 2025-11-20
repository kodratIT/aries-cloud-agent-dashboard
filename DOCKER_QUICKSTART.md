# Docker Quick Start

Cara tercepat untuk menjalankan dashboard dengan Docker.

## 🚀 Quick Start

### Jalankan Dashboard Standalone

```bash
# 1. Pastikan parent services sudah running
cd ..
docker compose up -d multi-agent wallet-db

# 2. Kembali ke dashboard directory
cd acapy-svelte-dashboard

# 3. Setup environment (optional)
cp .env.docker .env

# 4. Jalankan dashboard
docker compose up -d

# 5. Akses dashboard
open http://localhost:3000
```

### Development Mode

```bash
# Hot reload enabled
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Akses di http://localhost:5173
```

## 📋 Prerequisites

- Docker dan Docker Compose terinstall
- Parent services (multi-agent, wallet-db) sudah running
- Network `appnet` sudah dibuat

## 🛑 Stop Services

```bash
docker compose down
```

## 📚 Full Documentation

Lihat [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) untuk dokumentasi lengkap.
