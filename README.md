# ACA-Py Multi-Tenant Dashboard

[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern dashboard for managing Hyperledger Aries Cloud Agent (ACA-Py) multi-tenant wallets built with SvelteKit and shadcn-svelte.

**Key Features:** Multi-tenant wallets • Verifiable credentials • DID management • Public verification portal • Docker-ready

---

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#️-installation)
- [Project Structure](#️-project-structure)
- [Authentication Flow](#-authentication-flow)
- [API Client Usage](#-api-client-usage)
- [UI Components](#-ui-components)
- [Tech Stack](#️-tech-stack)
- [Deployment](#-deployment)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Monitoring & Logging](#-monitoring--logging)
- [Performance Tips](#-performance-tips)
- [Security Best Practices](#-security-best-practices)
- [Roadmap](#️-roadmap)
- [FAQ](#-faq)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Quick Start

Cara tercepat untuk mulai:

```bash
# Clone dan masuk ke directory
git clone <your-repo>
cd multi-demo

# Setup environment
cp .env.example .env

# Jalankan dengan Docker Compose
docker compose up --build

# Akses dashboard
open http://localhost:3000
```

Selesai! Dashboard dan ACA-Py agent sudah running.

## 🚀 Features

### Core Features
- ✅ **Multi-Tenant Support** - Each user gets isolated wallet
- ✅ **Wallet-Based Authentication** - Secure login with wallet ID + key
- ✅ **Connection Management** - Create invitations and manage connections
- ✅ **Credential Operations** - Issue and verify credentials
- ✅ **Schema Management** - Create and manage schemas
- ✅ **Credential Definitions** - Define credential types
- ✅ **DID & Wallet Management** - Manage DIDs and wallet operations
- ✅ **Modern UI** - Built with Tailwind CSS and shadcn-svelte
- ✅ **Dark Mode** - Full dark mode support

### Advanced Features
- ✅ **Public Use Case Portal** - Share verification templates publicly
- ✅ **QR Code Generation** - Generate QR codes untuk connection invitations
- ✅ **Verification Requests** - Create dan manage verification requests
- ✅ **Proof Presentations** - Request dan verify proof presentations
- ✅ **Real-time Updates** - Live status updates untuk connections dan credentials
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Docker Support** - Production-ready Docker setup

### Use Cases
1. **Digital Identity Verification** - Verify user identities dengan verifiable credentials
2. **Educational Credentials** - Issue dan verify academic certificates
3. **Employment Verification** - Verify employment history dan qualifications
4. **KYC/AML Compliance** - Know Your Customer verification
5. **Supply Chain** - Track dan verify product authenticity
6. **Healthcare Records** - Secure sharing medical credentials

## 📋 Prerequisites

- Node.js 18+ or Bun
- Docker & Docker Compose (untuk deployment)
- ACA-Py instance running with multi-tenancy enabled
- Admin API key for ACA-Py

## 🛠️ Installation

### Option 1: Development Mode (Local)

1. **Clone the repository**
```bash
git clone <your-repo>
cd acapy-svelte-dashboard
```

2. **Install dependencies**
```bash
yarn install
# or
npm install
# or
pnpm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PUBLIC_ACAPY_API_URL=http://localhost:8021
```

4. **Run development server**
```bash
yarn dev
# or
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Option 2: Docker Compose (Production-Ready)

Cara termudah untuk menjalankan seluruh stack (ACA-Py + Dashboard):

1. **Dari root directory project**
```bash
cd ..  # Kembali ke root directory (multi-demo)
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

3. **Build dan jalankan semua services**
```bash
docker compose up --build
```

Services yang akan berjalan:
- **wallet-db**: PostgreSQL database (port 5532)
- **multi-agent**: ACA-Py agent (ports 8010, 8001)
- **acapy-dashboard**: Svelte dashboard (port 3000)

4. **Akses aplikasi**
- Dashboard: http://localhost:3000
- ACA-Py Admin API: http://localhost:8021
- ACA-Py Endpoint: http://localhost:8001

5. **Stop services**
```bash
# Stop (data tetap tersimpan)
docker compose down

# Stop dan hapus semua data
docker compose down -v
```

### Option 3: Docker Standalone

Build dan run hanya dashboard:

```bash
# Build image
docker build -t acapy-dashboard .

# Run container
docker run -p 3000:3000 \
  -e PUBLIC_ACAPY_API_URL=http://localhost:8021 \
  acapy-dashboard
```

## 🏗️ Project Structure

```
acapy-svelte-dashboard/
├── src/
│   ├── lib/
│   │   ├── acapy/
│   │   │   └── client.ts          # ACA-Py API client
│   │   ├── components/
│   │   │   └── ui/                # shadcn-svelte components
│   │   ├── stores/
│   │   │   └── auth.svelte.ts     # Auth state management (Svelte 5 runes)
│   │   └── utils.ts               # Utility functions
│   ├── routes/
│   │   ├── +layout.svelte         # Root layout
│   │   ├── +page.svelte           # Landing page
│   │   ├── register/
│   │   │   └── +page.svelte       # Registration page
│   │   ├── login/
│   │   │   └── +page.svelte       # Login page
│   │   ├── use-cases/
│   │   │   └── [id]/              # Public use case portal
│   │   └── dashboard/
│   │       ├── +layout.svelte     # Dashboard layout with navigation
│   │       ├── +page.svelte       # Dashboard overview
│   │       ├── connections/       # Connections management
│   │       ├── credentials/       # Credentials operations
│   │       ├── schemas/           # Schema management
│   │       ├── cred-defs/         # Credential definitions
│   │       ├── verifications/     # Verification requests
│   │       ├── requests/          # Proof requests
│   │       ├── use-cases/         # Use case templates
│   │       └── wallet/            # Wallet & DID management
│   └── app.css                    # Global styles (Tailwind)
├── static/                        # Static assets
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
├── Dockerfile                     # Docker build configuration
├── .dockerignore                  # Docker ignore rules
├── DOCKER_README.md               # Docker setup guide
├── package.json                   # Dependencies & scripts
├── svelte.config.js               # SvelteKit configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite configuration
```

### Key Directories

**`src/lib/acapy/`** - ACA-Py integration
- API client dengan TypeScript types
- Wallet, connection, credential, schema operations
- Error handling dan response parsing

**`src/lib/components/ui/`** - Reusable UI components
- shadcn-svelte components (Button, Card, Input, etc)
- Customized dengan Tailwind CSS
- Dark mode support

**`src/lib/stores/`** - State management
- Auth store dengan Svelte 5 runes
- Reactive state untuk authentication
- LocalStorage persistence

**`src/routes/dashboard/`** - Protected dashboard routes
- Requires authentication
- Full CRUD operations untuk credentials
- Real-time status updates

**`src/routes/use-cases/`** - Public portal
- No authentication required
- Share verification templates
- QR code generation untuk mobile wallets

## 🔐 Authentication Flow

### Registration (Create Wallet)
1. User fills registration form with:
   - Organization name
   - Wallet name (username)
   - Wallet key (password)
2. System calls ACA-Py API to create wallet
3. Returns wallet ID + token
4. User MUST save wallet ID and wallet key (cannot be recovered!)

### Login
1. User enters wallet ID + wallet key
2. System calls ACA-Py to get token
3. Token stored in localStorage
4. User redirected to dashboard

### Security Notes
- ⚠️ Wallet key is NEVER stored on server
- ⚠️ If user loses wallet ID or key, wallet cannot be recovered
- ✅ Each tenant has isolated wallet
- ✅ Token-based authentication for API calls

## 📡 API Client Usage

The `acapyClient` provides methods for all ACA-Py operations:

```typescript
import { acapyClient } from '$lib/acapy/client';
import { authStore } from '$lib/stores/auth.svelte';

// Create wallet (register)
const wallet = await acapyClient.createWallet({
  wallet_name: 'my_wallet',
  wallet_key: 'secure_password',
  label: 'My Organization'
});

// Get token (login)
const { token } = await acapyClient.getWalletToken(walletId, walletKey);

// Get connections (requires token)
const connections = await acapyClient.getConnections(authStore.token);

// Create invitation
const invitation = await acapyClient.createInvitation(authStore.token);

// Issue credential
const credential = await acapyClient.issueCredential(authStore.token, data);
```

## 🎨 UI Components

This project uses [shadcn-svelte](https://www.shadcn-svelte.com/) components:

- Button
- Card
- Input
- Label
- Form
- Table
- Dialog
- Dropdown Menu
- Avatar
- Badge
- Separator
- Tabs
- Alert
- Toast (svelte-sonner)

## 🛠️ Tech Stack

### Frontend
- **SvelteKit** - Full-stack framework dengan Svelte 5
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn-svelte** - UI component library
- **Vite** - Build tool dan dev server
- **svelte-sonner** - Toast notifications
- **QRCode** - QR code generation

### Backend/Infrastructure
- **ACA-Py** - Aries Cloud Agent Python
- **PostgreSQL** - Wallet storage database
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **svelte-check** - Type checking untuk Svelte

## 🗺️ Roadmap

### Current Version (v0.0.1)
- ✅ Multi-tenant wallet management
- ✅ Connection management
- ✅ Credential issuance
- ✅ Schema & credential definition management
- ✅ Public use case portal
- ✅ Docker support

### Planned Features
- 🔄 **Token Refresh** - Auto-refresh expired tokens
- 🔄 **Webhook Support** - Real-time notifications via webhooks
- 🔄 **Bulk Operations** - Issue multiple credentials at once
- 🔄 **Advanced Search** - Filter dan search connections/credentials
- 🔄 **Export/Import** - Export credentials dan connections
- 🔄 **Analytics Dashboard** - Usage statistics dan metrics
- 🔄 **Multi-language Support** - i18n untuk multiple languages
- 🔄 **Role-Based Access** - Admin, issuer, verifier roles
- 🔄 **Audit Logs** - Track all operations
- 🔄 **Mobile App** - React Native atau Flutter mobile wallet

### Future Enhancements
- 📋 **DID Methods** - Support untuk did:web, did:key, dll
- 📋 **Revocation** - Credential revocation support
- 📋 **Backup/Restore** - Wallet backup dan restore UI
- 📋 **Templates** - Credential templates untuk common use cases
- 📋 **API Keys** - Generate API keys untuk external integrations
- 📋 **Notifications** - Email/SMS notifications
- 📋 **2FA** - Two-factor authentication
- 📋 **SSO** - Single sign-on integration

## 🚀 Deployment

### Build for Production (Local)
```bash
yarn build
```

### Preview Production Build
```bash
yarn preview
```

### Deploy dengan Docker

#### 1. Docker Compose (Recommended)
Lihat [DOCKER_README.md](./DOCKER_README.md) untuk panduan lengkap.

```bash
# Dari root directory
docker compose up -d --build
```

#### 2. Docker Standalone
```bash
# Build image
docker build -t acapy-dashboard .

# Run dengan environment variables
docker run -d \
  -p 3000:3000 \
  -e PUBLIC_ACAPY_API_URL=http://your-acapy-host:8021 \
  --name acapy-dashboard \
  acapy-dashboard
```

#### 3. Docker dengan Custom Network
```bash
# Buat network
docker network create acapy-network

# Run dashboard
docker run -d \
  -p 3000:3000 \
  -e PUBLIC_ACAPY_API_URL=http://multi-agent:8021 \
  --network acapy-network \
  --name acapy-dashboard \
  acapy-dashboard
```

### Deploy to Cloud Platforms

#### Vercel/Netlify
Project ini sudah dikonfigurasi untuk deployment otomatis. Cukup connect repository Anda.

**Environment Variables yang diperlukan:**
- `PUBLIC_ACAPY_API_URL`: URL ACA-Py API Anda

#### VPS/Cloud Server
1. Clone repository di server
2. Setup Docker & Docker Compose
3. Configure `.env` file
4. Run `docker compose up -d --build`
5. Setup reverse proxy (Nginx/Caddy) untuk HTTPS

**Contoh Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Configuration

### Environment Variables

**Dashboard (.env)**
```env
# Required
PUBLIC_ACAPY_API_URL=http://localhost:8021

# Optional
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
```

**Docker Compose (.env di root)**
```env
# ACA-Py Configuration
ACAPY_ENDPOINT=https://your-domain.com
ACAPY_AGENT_ACCESS=local

# Network Names
APP_NETWORK_NAME=appnet
ELK_NETWORK_NAME=elknet

# Logging
LOG_LEVEL=INFO
RUST_LOG=ERROR

# Dashboard
PUBLIC_ACAPY_API_URL=http://multi-agent:8021
```

### ACA-Py Setup

Your ACA-Py instance must be configured with:

```bash
# Multi-tenancy enabled
--multitenant
--multitenant-admin
--jwt-secret <your-jwt-secret>

# Admin API
--admin 0.0.0.0 8021
--admin-api-key <your-admin-key>

# Wallet type
--wallet-type askar

# Database
--wallet-storage-type postgres_storage
--wallet-storage-config '{"url":"postgres://user:pass@host:5432/wallets"}'
--wallet-storage-creds '{"account":"postgres","password":"pass"}'

# Endpoint
--endpoint http://your-domain.com:8001

# Auto accept
--auto-accept-invites
--auto-accept-requests
```

### Docker Compose Configuration

File `docker-compose.yml` sudah include:
- PostgreSQL database untuk wallet storage
- ACA-Py multi-tenant agent
- Svelte dashboard
- Network configuration untuk inter-service communication

Lihat [DOCKER_README.md](./DOCKER_README.md) untuk detail lengkap.

## 🐛 Troubleshooting

### Dashboard tidak bisa connect ke ACA-Py

**Problem:** Dashboard menampilkan error connection

**Solution:**
1. Pastikan ACA-Py sudah running
2. Check `PUBLIC_ACAPY_API_URL` di `.env`
3. Jika menggunakan Docker, gunakan service name: `http://multi-agent:8021`
4. Jika local development, gunakan: `http://localhost:8021`

### Port sudah digunakan

**Problem:** Error "port already in use"

**Solution:**
```bash
# Check port yang digunakan
lsof -i :3000

# Atau ubah port di docker-compose.yml
ports:
  - "3001:3000"  # Ubah 3000 ke port lain
```

### Wallet creation failed

**Problem:** Error saat membuat wallet baru

**Solution:**
1. Check ACA-Py logs: `docker compose logs multi-agent`
2. Pastikan database sudah running: `docker compose ps`
3. Verify ACA-Py configuration (multitenant enabled)

### Build error di Docker

**Problem:** Docker build gagal

**Solution:**
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild tanpa cache
docker compose build --no-cache acapy-dashboard
```

### Token expired

**Problem:** Session expired, perlu login ulang

**Solution:**
- Token ACA-Py memiliki expiry time
- User perlu login ulang dengan wallet ID + key
- Implement token refresh jika diperlukan

## 📚 Documentation

### Project Documentation
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick reference untuk developer
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture documentation
- [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - Docker setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
- [CHANGELOG.md](./CHANGELOG.md) - Version history dan changes
- [VERIFICATION_DEBUG_GUIDE.md](../VERIFICATION_DEBUG_GUIDE.md) - Verification debugging
- [PUBLIC_PORTAL_TESTING.md](../PUBLIC_PORTAL_TESTING.md) - Public portal testing

### External Documentation
- [ACA-Py Documentation](https://aca-py.org/)
- [ACA-Py Admin API](https://aca-py.org/latest/api/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [shadcn-svelte Documentation](https://www.shadcn-svelte.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🔒 Security Best Practices

### Production Deployment
1. **HTTPS Only**: Selalu gunakan HTTPS di production
2. **Environment Variables**: Jangan commit `.env` ke repository
3. **Wallet Keys**: Educate users untuk menyimpan wallet key dengan aman
4. **API Keys**: Rotate ACA-Py admin API keys secara berkala
5. **Network Security**: Gunakan firewall dan network isolation
6. **Database**: Secure PostgreSQL dengan strong password
7. **Backup**: Regular backup wallet database

### Development
1. Gunakan `.env.example` sebagai template
2. Jangan hardcode credentials di code
3. Use environment-specific configurations
4. Test dengan data dummy, bukan production data

## 📊 Monitoring & Logging

### Docker Logs
```bash
# View all logs
docker compose logs

# Follow logs
docker compose logs -f

# Specific service
docker compose logs -f acapy-dashboard
docker compose logs -f multi-agent

# Last 100 lines
docker compose logs --tail=100
```

### Application Logs
- Dashboard logs: Browser console & network tab
- ACA-Py logs: Docker logs atau file logs
- Database logs: PostgreSQL logs

### Health Checks
```bash
# Check services status
docker compose ps

# Check ACA-Py health
curl http://localhost:8021/status

# Check dashboard
curl http://localhost:3000
```

## 🚀 Performance Tips

### Production Optimization
1. **Build optimization**: Sudah menggunakan Vite production build
2. **Docker multi-stage**: Menggunakan Alpine Linux untuk image size kecil
3. **Static assets**: Consider CDN untuk static files
4. **Database**: Tune PostgreSQL untuk production workload
5. **Caching**: Implement Redis untuk session/cache jika diperlukan

### Scaling
- Horizontal scaling: Run multiple dashboard instances behind load balancer
- Database: Use managed PostgreSQL service (AWS RDS, etc)
- ACA-Py: Scale dengan multiple agent instances

## ❓ FAQ

### Apa itu ACA-Py?
ACA-Py (Aries Cloud Agent Python) adalah implementasi Hyperledger Aries untuk membangun SSI (Self-Sovereign Identity) solutions. Mendukung DIDComm, verifiable credentials, dan decentralized identifiers (DIDs).

### Apa itu Multi-Tenancy?
Multi-tenancy memungkinkan satu ACA-Py instance melayani multiple wallets yang terisolasi. Setiap tenant (user/organization) memiliki wallet sendiri dengan credentials dan connections terpisah.

### Apakah wallet key bisa di-recover?
**TIDAK**. Wallet key tidak disimpan di server dan tidak bisa di-recover. User harus menyimpan wallet ID dan wallet key dengan aman. Jika hilang, wallet tidak bisa diakses lagi.

### Bagaimana cara backup wallet?
Backup dilakukan di level database (PostgreSQL). Gunakan `pg_dump` untuk backup wallet database secara berkala.

### Apakah bisa digunakan untuk production?
Ya, dengan catatan:
- Gunakan HTTPS
- Secure database dengan strong password
- Implement proper monitoring dan logging
- Regular security updates
- Backup strategy yang baik

### Apa perbedaan dengan Aries Framework JavaScript?
ACA-Py adalah Python-based agent yang berjalan sebagai service. AFJ adalah JavaScript library yang bisa embedded di aplikasi. Dashboard ini menggunakan ACA-Py sebagai backend.

### Bagaimana cara integrate dengan mobile wallet?
Generate QR code dari connection invitation, scan dengan mobile wallet yang support Aries protocol (seperti Trinsic, Lissi, atau custom wallet).

### Apakah support ledger selain Indy?
Ya, ACA-Py support multiple ledgers. Configure genesis file sesuai ledger yang digunakan (Sovrin, BCovrin, Indicio, dll).

### Bagaimana cara menambah custom fields di credential?
1. Buat schema baru dengan attributes yang diinginkan
2. Buat credential definition dari schema tersebut
3. Issue credential dengan values untuk attributes tersebut

### Apakah ada API documentation?
Ya, ACA-Py menyediakan OpenAPI/Swagger documentation di `http://localhost:8021/api/doc`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- Follow existing code style
- Use TypeScript untuk type safety
- Add comments untuk complex logic
- Test changes sebelum submit PR

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- UI components from [shadcn-svelte](https://www.shadcn-svelte.com/)
- Powered by [Hyperledger Aries Cloud Agent Python](https://github.com/hyperledger/aries-cloudagent-python)
