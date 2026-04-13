# Contributing to Obscuron (Viitor Educat)

Thank you for considering contributing to Obscuron! 🎉 We welcome contributions from the community to make this educational platform even better.

## How Can I Contribute?

### Reporting Bugs

Before reporting a bug, please check if the issue already exists in the [Issues](https://github.com/PRSro/viitor-educat/issues) section.

When creating a bug report, please use the following template:

```markdown
**Bug:** [Short description of the bug]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:** [What should happen]

**Actual Behavior:** [What actually happens]

**Screenshots:** [If applicable, add screenshots]
```

### Suggesting Enhancements

Use this template for feature requests:

```markdown
**Feature:** [Description of the feature]

**Use Case:** [Explain why this feature would be useful]

**Mockups:** [If UI-related, add mockups or sketches]
```

### Pull Requests

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make** your changes with clear, descriptive commit messages
4. **Test** your changes thoroughly
5. **Submit** a pull request with a detailed description

## Code Style

- Follow existing TypeScript patterns in the codebase
- Use ESLint configuration provided in the project
- Write meaningful variable and function names
- Comment complex logic where necessary
- Use functional components with hooks instead of class components

### Naming Conventions

- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities:** camelCase (e.g., `apiClient.ts`)
- **Types/Interfaces:** PascalCase (e.g., `UserType.ts`)

### Git Commit Messages

Use clear and descriptive commit messages:
- `feat: add user authentication`
- `fix: resolve login redirect issue`
- `docs: update README installation steps`
- `style: format code with prettier`

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (for backend)
- Docker (optional, for containerized development)

### Setup Instructions

```bash
# Clone the repository
git clone -b deploy https://github.com/PRSro/viitor-educat.git
cd viitor-educat/viitor-educat-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Copy environment file
cp .env.example .env

# Configure your .env file with:
# - DATABASE_URL
# - JWT_SECRET
# - Other required variables
```

### Running Development Servers

```bash
# Frontend (http://localhost:5173)
npm run dev

# Backend (http://localhost:3000)
cd backend
npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## Testing

Before submitting a pull request:

1. Test your changes in both development and production builds
2. Verify responsive design works on mobile, tablet, and desktop
3. Check that all links and navigation work correctly
4. Ensure no console errors in browser developer tools

## Code Review Process

- All submissions require review before merging
- Be responsive to feedback and suggestions
- Make requested changes or explain why they aren't feasible
- Ensure CI/CD checks pass

## Recognition

Contributors will be recognized in the project documentation. Thank you for your help!

---

**Questions?** Open an issue on GitHub or reach out to the maintainers.