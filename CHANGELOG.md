# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Token auto-refresh functionality
- Webhook support for real-time notifications
- Bulk credential issuance
- Advanced search and filtering
- Analytics dashboard
- Multi-language support (i18n)
- Role-based access control
- Audit logs

## [0.0.1] - 2024-11-20

### Added
- Initial release of ACA-Py Multi-Tenant Dashboard
- Multi-tenant wallet management
- Wallet-based authentication (wallet ID + key)
- Connection management
  - Create connection invitations
  - View and manage connections
  - QR code generation for mobile wallets
- Credential operations
  - Issue credentials
  - View issued credentials
  - Credential status tracking
- Schema management
  - Create schemas
  - View and manage schemas
  - Schema attributes configuration
- Credential definition management
  - Create credential definitions
  - Link to schemas
  - View and manage cred-defs
- Verification features
  - Create verification requests
  - Proof presentations
  - Verification status tracking
- Public use case portal
  - Share verification templates publicly
  - No authentication required
  - QR code for mobile verification
- DID and wallet management
  - View wallet DIDs
  - Create new DIDs
  - Set public DID
- Modern UI with shadcn-svelte
  - Responsive design
  - Dark mode support
  - Clean and intuitive interface
- Docker support
  - Multi-stage Dockerfile
  - Docker Compose integration
  - Production-ready setup
- Documentation
  - Comprehensive README
  - Docker setup guide
  - API usage examples
  - Troubleshooting guide

### Technical Stack
- SvelteKit 2.x with Svelte 5
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn-svelte UI components
- Vite for build tooling
- Docker for containerization

### Security
- Wallet key never stored on server
- Token-based authentication
- Isolated tenant wallets
- Secure API communication

## [0.0.0] - 2024-11-01

### Added
- Project initialization
- Basic project structure
- Development environment setup

---

## Version History

### Version Format
- **Major.Minor.Patch** (e.g., 1.2.3)
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Change Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

[Unreleased]: https://github.com/your-repo/acapy-svelte-dashboard/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/your-repo/acapy-svelte-dashboard/releases/tag/v0.0.1
[0.0.0]: https://github.com/your-repo/acapy-svelte-dashboard/releases/tag/v0.0.0
