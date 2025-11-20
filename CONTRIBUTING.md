# Contributing to ACA-Py Multi-Tenant Dashboard

Terima kasih atas minat Anda untuk berkontribusi! Kami menyambut kontribusi dari siapa saja.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork dan clone repository**
```bash
git clone https://github.com/your-username/acapy-svelte-dashboard.git
cd acapy-svelte-dashboard
```

2. **Install dependencies**
```bash
yarn install
```

3. **Setup environment**
```bash
cp .env.example .env
```

4. **Start ACA-Py (dari root directory)**
```bash
cd ..
docker compose up -d multi-agent wallet-db
```

5. **Start development server**
```bash
cd acapy-svelte-dashboard
yarn dev
```

## 📝 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Write clean, readable code
- Follow existing code style
- Add comments untuk complex logic
- Update documentation jika diperlukan

3. **Test your changes**
```bash
# Type check
yarn check

# Build test
yarn build
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add amazing feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

5. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**
- Go to GitHub dan create PR
- Describe your changes
- Link related issues
- Wait for review

## 🎨 Code Style

### TypeScript
- Use TypeScript untuk type safety
- Define interfaces untuk data structures
- Avoid `any` type
- Use meaningful variable names

```typescript
// Good
interface WalletConfig {
  wallet_name: string;
  wallet_key: string;
  label: string;
}

// Bad
const data: any = { ... };
```

### Svelte
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Keep components small dan focused
- Extract reusable logic ke functions
- Use proper TypeScript types

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### CSS/Tailwind
- Use Tailwind utility classes
- Follow mobile-first approach
- Use consistent spacing (4, 8, 16, 24, 32)
- Leverage shadcn-svelte components

```svelte
<!-- Good -->
<div class="flex flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-8">
  ...
</div>
```

## 🧪 Testing

Currently, we don't have automated tests. Contributions untuk testing infrastructure sangat diterima!

### Manual Testing Checklist
- [ ] Test di Chrome, Firefox, Safari
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test dark mode
- [ ] Test error scenarios
- [ ] Test dengan real ACA-Py instance

## 📚 Documentation

### Code Comments
- Add comments untuk complex logic
- Explain "why", bukan "what"
- Keep comments up-to-date

### README Updates
- Update README.md jika menambah features
- Add examples untuk new functionality
- Update screenshots jika UI berubah

### API Documentation
- Document new API client methods
- Include parameter types
- Add usage examples

## 🐛 Bug Reports

### Before Submitting
- Check existing issues
- Test dengan latest version
- Reproduce bug consistently

### Bug Report Template
```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 20.10.0]
- Docker version: [e.g. 24.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature requests! Please:
- Check existing feature requests first
- Explain the use case
- Describe expected behavior
- Consider implementation complexity

## 🔍 Code Review Process

### What We Look For
- Code quality dan readability
- Proper error handling
- Type safety
- Performance considerations
- Security implications
- Documentation updates

### Review Timeline
- Initial review: 1-3 days
- Follow-up reviews: 1-2 days
- Merge: After approval dari maintainer

## 🎯 Priority Areas

Contributions sangat dibutuhkan di area:
1. **Testing** - Unit tests, integration tests, e2e tests
2. **Documentation** - Tutorials, guides, API docs
3. **Accessibility** - ARIA labels, keyboard navigation
4. **Performance** - Optimization, caching
5. **Security** - Security audits, best practices
6. **Mobile** - Mobile wallet app
7. **i18n** - Multi-language support

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Chat**: Join our community (if available)

## 📜 Code of Conduct

- Be respectful dan inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## 🙏 Recognition

Contributors akan di-credit di:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉
