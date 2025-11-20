# Quick Reference Guide

Panduan cepat untuk developer yang bekerja dengan ACA-Py Multi-Tenant Dashboard.

## 🚀 Common Commands

### Development
```bash
# Start dev server
yarn dev

# Start dev server dengan network access
yarn dev:host

# Type checking
yarn check

# Type checking (watch mode)
yarn check:watch

# Build for production
yarn build

# Preview production build
yarn preview
```

### Docker
```bash
# Build Docker image
yarn docker:build
# atau
docker build -t acapy-dashboard .

# Run Docker container
yarn docker:run
# atau
docker run -p 3000:3000 -e PUBLIC_ACAPY_API_URL=http://localhost:8021 acapy-dashboard

# Docker Compose (dari root directory)
docker compose up --build
docker compose down
docker compose logs -f acapy-dashboard
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/lib/acapy/client.ts` | ACA-Py API client |
| `src/lib/stores/auth.svelte.ts` | Authentication state |
| `src/routes/+layout.svelte` | Root layout |
| `src/routes/dashboard/+layout.svelte` | Dashboard layout |
| `.env` | Environment variables |
| `Dockerfile` | Docker build config |
| `docker-compose.yml` | Multi-container setup |

## 🔑 Environment Variables

```bash
# Required
PUBLIC_ACAPY_API_URL=http://localhost:8021

# Optional
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
```

## 🎯 API Client Usage

### Import
```typescript
import { acapyClient } from '$lib/acapy/client';
import { authStore } from '$lib/stores/auth.svelte';
```

### Common Operations

#### Create Wallet (Register)
```typescript
const wallet = await acapyClient.createWallet({
  wallet_name: 'my_wallet',
  wallet_key: 'secure_password',
  label: 'My Organization'
});
// Returns: { wallet_id, token, ... }
```

#### Get Token (Login)
```typescript
const { token } = await acapyClient.getWalletToken(
  walletId,
  walletKey
);
```

#### Get Connections
```typescript
const connections = await acapyClient.getConnections(
  authStore.token
);
```

#### Create Invitation
```typescript
const invitation = await acapyClient.createInvitation(
  authStore.token,
  { alias: 'Connection Name' }
);
// Returns: { invitation_url, invitation, ... }
```

#### Issue Credential
```typescript
const credential = await acapyClient.issueCredential(
  authStore.token,
  {
    connection_id: 'conn-123',
    cred_def_id: 'cred-def-456',
    attributes: [
      { name: 'name', value: 'John Doe' },
      { name: 'age', value: '30' }
    ]
  }
);
```

#### Create Schema
```typescript
const schema = await acapyClient.createSchema(
  authStore.token,
  {
    schema_name: 'MySchema',
    schema_version: '1.0',
    attributes: ['name', 'age', 'email']
  }
);
```

## 🎨 UI Components

### Import shadcn-svelte Components
```typescript
import { Button } from '$lib/components/ui/button';
import { Card } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
```

### Usage Example
```svelte
<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>
    <Label for="input">Label</Label>
    <Input id="input" type="text" />
  </Card.Content>
  <Card.Footer>
    <Button>Submit</Button>
  </Card.Footer>
</Card.Root>
```

## 🔐 Authentication Flow

### Registration
1. User fills form (wallet_name, wallet_key, label)
2. Call `acapyClient.createWallet()`
3. Save wallet_id (user must save this!)
4. Store token in authStore
5. Redirect to dashboard

### Login
1. User enters wallet_id + wallet_key
2. Call `acapyClient.getWalletToken()`
3. Store token in authStore
4. Redirect to dashboard

### Logout
```typescript
authStore.logout();
// Clears token and redirects to login
```

## 🛠️ Svelte 5 Runes

### State
```typescript
let count = $state(0);
let user = $state({ name: 'John' });
```

### Derived
```typescript
let doubled = $derived(count * 2);
let fullName = $derived(`${user.firstName} ${user.lastName}`);
```

### Effect
```typescript
$effect(() => {
  console.log('Count changed:', count);
});
```

### Props
```typescript
let { title, description = 'Default' } = $props();
```

## 🐛 Debugging

### Check ACA-Py Status
```bash
curl http://localhost:8021/status
```

### View Logs
```bash
# Dashboard logs (browser console)
# ACA-Py logs
docker compose logs -f multi-agent

# Database logs
docker compose logs -f wallet-db
```

### Common Issues

**Connection refused**
- Check ACA-Py is running: `docker compose ps`
- Verify PUBLIC_ACAPY_API_URL in .env

**Token expired**
- Login again to get new token
- Token lifetime configured in ACA-Py

**Wallet creation failed**
- Check database is running
- Check ACA-Py logs for errors

## 📊 Useful ACA-Py Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/status` | GET | Health check |
| `/multitenancy/wallets` | POST | Create wallet |
| `/multitenancy/wallet/{id}/token` | POST | Get token |
| `/connections` | GET | List connections |
| `/connections/create-invitation` | POST | Create invitation |
| `/issue-credential-2.0/send` | POST | Issue credential |
| `/schemas` | POST | Create schema |
| `/credential-definitions` | POST | Create cred-def |

## 🔗 Quick Links

- [ACA-Py Admin API Docs](http://localhost:8021/api/doc)
- [SvelteKit Docs](https://kit.svelte.dev/)
- [shadcn-svelte](https://www.shadcn-svelte.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 💡 Tips

1. **Use TypeScript**: Leverage type safety
2. **Component Composition**: Break down large components
3. **Error Handling**: Always handle API errors
4. **Loading States**: Show loading indicators
5. **Responsive Design**: Test on mobile
6. **Dark Mode**: Test both themes
7. **Console Logs**: Remove before commit
8. **Git Commits**: Use conventional commits

## 🎓 Learning Resources

- [Hyperledger Aries](https://www.hyperledger.org/use/aries)
- [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [DIDs](https://www.w3.org/TR/did-core/)
- [SvelteKit Tutorial](https://learn.svelte.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
