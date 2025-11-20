# Architecture Documentation

Dokumentasi arsitektur ACA-Py Multi-Tenant Dashboard.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │  Landing   │  │   Login    │  │   Dashboard (Auth)   │  │
│  │    Page    │  │  Register  │  │  - Connections       │  │
│  └────────────┘  └────────────┘  │  - Credentials       │  │
│                                   │  - Schemas           │  │
│                                   │  - Verifications     │  │
│                                   └──────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│                    (SSL Termination)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Dashboard  │  │  ACA-Py     │  │  ACA-Py     │
│  (Port 3000)│  │  Admin API  │  │  Endpoint   │
│             │  │  (Port 8021)│  │  (Port 8001)│
│  SvelteKit  │  │             │  │             │
│  + Vite     │  │  Multi-     │  │  DIDComm    │
│             │  │  Tenancy    │  │  Protocol   │
└──────┬──────┘  └──────┬──────┘  └─────────────┘
       │                │
       │                ▼
       │         ┌─────────────┐
       │         │ PostgreSQL  │
       │         │ (Port 5432) │
       │         │             │
       │         │  Wallets    │
       │         │  Storage    │
       │         └─────────────┘
       │
       ▼
┌─────────────┐
│ LocalStorage│
│  - Token    │
│  - Wallet ID│
└─────────────┘
```

## 🔄 Data Flow

### 1. Registration Flow

```
User → Dashboard → ACA-Py Admin API → PostgreSQL
  │         │              │               │
  │         │              │               ▼
  │         │              │         Create Wallet
  │         │              │               │
  │         │              ◄───────────────┘
  │         │              │
  │         ◄──────────────┘
  │         │ (wallet_id, token)
  │         │
  ◄─────────┘
  │ Save wallet_id + key
  │ Store token
  ▼
Dashboard (Authenticated)
```

### 2. Login Flow

```
User → Dashboard → ACA-Py Admin API
  │         │              │
  │         │              │ Verify wallet_id + key
  │         │              │
  │         ◄──────────────┘
  │         │ (token)
  │         │
  ◄─────────┘
  │ Store token
  ▼
Dashboard (Authenticated)
```

### 3. Credential Issuance Flow

```
Issuer Dashboard → ACA-Py Admin API
       │                  │
       │                  ▼
       │           Create Credential Offer
       │                  │
       │                  ▼
       │           Send to Connection
       │                  │
       │                  ▼
       │           DIDComm Protocol
       │                  │
       │                  ▼
       │           Holder's Wallet
       │                  │
       │                  ▼
       │           Accept & Store
       │                  │
       ◄──────────────────┘
       │ (credential_exchange_id)
       ▼
   Update UI
```

## 🗂️ Component Architecture

### Frontend (SvelteKit)

```
src/
├── lib/
│   ├── acapy/
│   │   └── client.ts              # API Client Layer
│   │       ├── createWallet()
│   │       ├── getWalletToken()
│   │       ├── getConnections()
│   │       ├── createInvitation()
│   │       ├── issueCredential()
│   │       └── ... (other methods)
│   │
│   ├── stores/
│   │   └── auth.svelte.ts         # State Management
│   │       ├── token (reactive)
│   │       ├── walletId (reactive)
│   │       ├── isAuthenticated (derived)
│   │       ├── login()
│   │       └── logout()
│   │
│   ├── components/
│   │   └── ui/                    # UI Components
│   │       ├── button/
│   │       ├── card/
│   │       ├── input/
│   │       └── ... (shadcn-svelte)
│   │
│   └── utils.ts                   # Utility Functions
│
└── routes/                        # Pages & Routing
    ├── +layout.svelte             # Root Layout
    ├── +page.svelte               # Landing Page
    ├── register/                  # Public Routes
    ├── login/
    ├── use-cases/[id]/            # Public Portal
    └── dashboard/                 # Protected Routes
        ├── +layout.svelte         # Dashboard Layout
        ├── connections/
        ├── credentials/
        ├── schemas/
        └── ...
```

### Backend (ACA-Py)

```
ACA-Py Agent
├── Multi-Tenancy Manager
│   ├── Wallet Management
│   ├── Token Management
│   └── Tenant Isolation
│
├── Connection Manager
│   ├── Invitation Creation
│   ├── Connection Protocol
│   └── Connection State
│
├── Credential Manager
│   ├── Schema Management
│   ├── Credential Definition
│   ├── Credential Issuance
│   └── Credential Verification
│
├── DID Manager
│   ├── DID Creation
│   ├── DID Registration
│   └── Public DID
│
└── Wallet Storage (PostgreSQL)
    ├── Wallet Records
    ├── Credentials
    ├── Connections
    └── DIDs
```

## 🔐 Security Architecture

### Authentication & Authorization

```
┌──────────────────────────────────────────────────────────┐
│                    Security Layers                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. HTTPS/TLS                                            │
│     └─ SSL Certificate (Let's Encrypt)                   │
│                                                           │
│  2. Nginx Reverse Proxy                                  │
│     ├─ Rate Limiting                                     │
│     ├─ Security Headers                                  │
│     └─ Request Filtering                                 │
│                                                           │
│  3. Application Layer                                    │
│     ├─ Token-based Auth (JWT)                           │
│     ├─ Wallet ID + Key Verification                     │
│     └─ Session Management                                │
│                                                           │
│  4. ACA-Py Layer                                         │
│     ├─ Multi-tenant Isolation                           │
│     ├─ Wallet Encryption                                │
│     └─ Admin API Key                                     │
│                                                           │
│  5. Database Layer                                       │
│     ├─ PostgreSQL Authentication                        │
│     ├─ Network Isolation                                │
│     └─ Encrypted Storage                                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Data Protection

**At Rest:**
- Wallet keys encrypted in database
- Credentials stored encrypted
- Database backups encrypted

**In Transit:**
- HTTPS for all communications
- TLS for database connections
- DIDComm encryption for agent-to-agent

**In Use:**
- Wallet key never stored on server
- Token expires after configured time
- Memory cleared after use

## 🔌 API Architecture

### REST API Endpoints

**Public Endpoints (No Auth):**
```
GET  /                          # Landing page
GET  /register                  # Registration page
GET  /login                     # Login page
GET  /use-cases/[id]           # Public verification portal
```

**Protected Endpoints (Requires Token):**
```
GET  /dashboard                 # Dashboard home
GET  /dashboard/connections     # List connections
POST /dashboard/connections     # Create invitation
GET  /dashboard/credentials     # List credentials
POST /dashboard/credentials     # Issue credential
GET  /dashboard/schemas         # List schemas
POST /dashboard/schemas         # Create schema
GET  /dashboard/cred-defs       # List cred-defs
POST /dashboard/cred-defs       # Create cred-def
GET  /dashboard/verifications   # List verifications
POST /dashboard/verifications   # Create verification
GET  /dashboard/wallet          # Wallet info
POST /dashboard/wallet/did      # Create DID
```

### ACA-Py Admin API Integration

**Wallet Management:**
```
POST /multitenancy/wallets                    # Create wallet
POST /multitenancy/wallet/{id}/token          # Get token
GET  /multitenancy/wallet/{id}                # Get wallet info
PUT  /multitenancy/wallet/{id}                # Update wallet
DELETE /multitenancy/wallet/{id}              # Delete wallet
```

**Connection Management:**
```
GET  /connections                             # List connections
POST /connections/create-invitation           # Create invitation
POST /connections/{id}/accept-invitation      # Accept invitation
GET  /connections/{id}                        # Get connection
DELETE /connections/{id}                      # Delete connection
```

**Credential Operations:**
```
POST /issue-credential-2.0/send               # Issue credential
GET  /issue-credential-2.0/records            # List credentials
GET  /issue-credential-2.0/records/{id}       # Get credential
DELETE /issue-credential-2.0/records/{id}     # Delete credential
```

## 📊 Database Schema

### PostgreSQL Tables (Simplified)

```sql
-- Wallets
wallets
├── wallet_id (PK)
├── wallet_name
├── wallet_key_hash
├── settings (JSON)
├── created_at
└── updated_at

-- Wallet Items (per tenant)
items
├── id (PK)
├── wallet_id (FK)
├── type (connection, credential, schema, etc)
├── name
├── value (JSON)
├── tags (JSON)
└── created_at

-- Connections
connections
├── connection_id (PK)
├── wallet_id (FK)
├── their_did
├── my_did
├── state
├── invitation (JSON)
└── created_at

-- Credentials
credentials
├── credential_exchange_id (PK)
├── wallet_id (FK)
├── connection_id (FK)
├── schema_id
├── cred_def_id
├── attributes (JSON)
├── state
└── created_at
```

## 🚀 Deployment Architecture

### Development

```
┌─────────────────────────────────────┐
│         Developer Machine            │
│                                      │
│  ┌──────────┐      ┌──────────┐    │
│  │ Vite Dev │      │  Docker  │    │
│  │  Server  │      │ Compose  │    │
│  │ (5173)   │      │          │    │
│  └──────────┘      │ ACA-Py   │    │
│                    │ + DB     │    │
│                    └──────────┘    │
└─────────────────────────────────────┘
```

### Production (Single Server)

```
┌─────────────────────────────────────────────┐
│              VPS/Cloud Server                │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │         Nginx (Port 80/443)        │    │
│  │         SSL Termination            │    │
│  └────────┬───────────────────┬───────┘    │
│           │                   │             │
│  ┌────────▼────────┐  ┌──────▼──────┐     │
│  │   Dashboard     │  │   ACA-Py    │     │
│  │   Container     │  │  Container  │     │
│  │   (Port 3000)   │  │ (Port 8021) │     │
│  └─────────────────┘  └──────┬──────┘     │
│                              │             │
│                       ┌──────▼──────┐     │
│                       │ PostgreSQL  │     │
│                       │  Container  │     │
│                       │ (Port 5432) │     │
│                       └─────────────┘     │
└─────────────────────────────────────────────┘
```

### Production (Scaled)

```
┌──────────────────────────────────────────────────────┐
│                   Load Balancer                       │
│                   (Nginx/HAProxy)                     │
└────────┬─────────────────────────────┬────────────────┘
         │                             │
    ┌────▼────┐                   ┌────▼────┐
    │ Server 1│                   │ Server 2│
    │         │                   │         │
    │Dashboard│                   │Dashboard│
    │ x3      │                   │ x3      │
    └────┬────┘                   └────┬────┘
         │                             │
         └──────────┬──────────────────┘
                    │
            ┌───────▼────────┐
            │    ACA-Py      │
            │   Cluster      │
            └───────┬────────┘
                    │
            ┌───────▼────────┐
            │   PostgreSQL   │
            │   (Managed)    │
            │   + Replicas   │
            └────────────────┘
```

## 🔄 State Management

### Client-Side State (Svelte Runes)

```typescript
// Reactive state
let token = $state<string | null>(null);
let walletId = $state<string | null>(null);

// Derived state
let isAuthenticated = $derived(!!token);

// Effects
$effect(() => {
  if (token) {
    localStorage.setItem('token', token);
  }
});
```

### Server-Side State (ACA-Py)

- Wallet state in PostgreSQL
- Connection state in memory + DB
- Credential exchange state tracked
- DID state persisted

## 📈 Performance Considerations

### Frontend Optimization
- Code splitting (SvelteKit automatic)
- Lazy loading routes
- Image optimization
- CSS purging (Tailwind)
- Vite build optimization

### Backend Optimization
- Database connection pooling
- Query optimization
- Caching (Redis optional)
- Rate limiting
- Load balancing

### Network Optimization
- CDN for static assets
- Gzip compression
- HTTP/2
- Keep-alive connections

## 🔍 Monitoring & Observability

```
┌─────────────────────────────────────────────┐
│            Monitoring Stack                  │
├─────────────────────────────────────────────┤
│                                              │
│  Application Logs                            │
│  ├─ Dashboard logs (stdout)                 │
│  ├─ ACA-Py logs (stdout)                    │
│  └─ Nginx logs (access + error)             │
│                                              │
│  Metrics                                     │
│  ├─ Prometheus (metrics collection)         │
│  ├─ Grafana (visualization)                 │
│  └─ Node Exporter (system metrics)          │
│                                              │
│  Health Checks                               │
│  ├─ Dashboard health endpoint               │
│  ├─ ACA-Py /status endpoint                 │
│  └─ Database connection check               │
│                                              │
│  Alerts                                      │
│  ├─ Service down                            │
│  ├─ High error rate                         │
│  ├─ High response time                      │
│  └─ Disk space low                          │
│                                              │
└─────────────────────────────────────────────┘
```

## 🎯 Design Principles

1. **Separation of Concerns**: Frontend, backend, database clearly separated
2. **Security First**: Multiple security layers, encryption, isolation
3. **Scalability**: Horizontal scaling support, stateless design
4. **Maintainability**: Clean code, documentation, modular architecture
5. **User Experience**: Fast, responsive, intuitive interface
6. **Reliability**: Error handling, logging, monitoring, backups

## 📚 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | SvelteKit | Full-stack framework |
| UI | shadcn-svelte | Component library |
| Styling | Tailwind CSS | Utility-first CSS |
| Language | TypeScript | Type safety |
| Build | Vite | Fast build tool |
| Backend | ACA-Py | SSI agent |
| Database | PostgreSQL | Wallet storage |
| Proxy | Nginx | Reverse proxy |
| Container | Docker | Containerization |
| Orchestration | Docker Compose | Multi-container |
| SSL | Let's Encrypt | Free SSL certs |

## 🔮 Future Architecture Enhancements

- **Microservices**: Split dashboard into microservices
- **Message Queue**: RabbitMQ/Kafka untuk async processing
- **Caching Layer**: Redis untuk performance
- **API Gateway**: Kong/Tyk untuk API management
- **Service Mesh**: Istio untuk advanced networking
- **Kubernetes**: Container orchestration
- **CI/CD**: Automated deployment pipeline
- **Monitoring**: Advanced APM tools

---

This architecture is designed to be scalable, secure, and maintainable while providing excellent user experience.
