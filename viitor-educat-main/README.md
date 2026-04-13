# Obscuron - Next-Gen Educational Platform

<p align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/PRSro/viitor-educat)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/PRSro/viitor-educat/actions)

</p>

<p align="center">

### Frontend Stack

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=flat&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![React Router](https://img.shields.io/badge/React_Router-6.x-CA4245?style=flat&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![React Query](https://img.shields.io/badge/React_Query-5.x-FF4154?style=flat&logo=tanstack&logoColor=white)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/Zod-3.x-3068B7?style=flat&logo=zod&logoColor=white)](https://zod.dev/)
[![i18next](https://img.shields.io/badge/i18next-26.x-2599DD?style=flat&logo=i18next&logoColor=white)](https://www.i18next.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-22C38E?style=flat&logo=recharts&logoColor=white)](https://recharts.org/)
[![Lucide](https://img.shields.io/badge/Lucide-0.462+-4B5EFA?style=flat&logo=lucide&logoColor=white)](https://lucide.dev/)

### Backend Stack

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?style=flat&logo=fastify&logoColor=white)](https://fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Zod](https://img.shields.io/badge/Zod-4.x-3068B7?style=flat&logo=zod&logoColor=white)](https://zod.dev/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=JSON%20Web%20Tokens&logoColor=white)](https://jwt.io/)

### DevOps & Tools

[![Docker](https://img.shields.io/badge/Docker-24.x-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![ESLint](https://img.shields.io/badge/ESLint-9.x-4B32C3?style=flat&logo=eslint&logoColor=white)](https://eslint.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6BBE5A?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)

</p>

<p align="center">
  <strong>Obscuron</strong> is a modern, feature-rich educational platform built with React, TypeScript, and shadcn/ui. It provides a comprehensive learning management system with course management, progress tracking, admin analytics, and a responsive design that works seamlessly across all devices.
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| ✅ User Authentication System | Secure login/registration with JWT tokens, role-based access control (Student, Teacher, Admin) |
| ✅ Course Management Dashboard | Create, edit, and organize courses with lessons, quizzes, and interactive content |
| ✅ Interactive Learning Modules | Rich multimedia lessons with flashcards, quizzes, and progress tracking |
| ✅ Real-time Progress Tracking | Visual analytics showing completion rates, time spent, and performance metrics |
| ✅ Admin Panel with Analytics | Comprehensive dashboard with user stats, course analytics, and system overview |
| ✅ Responsive Design | Fully responsive UI optimized for Mobile, Tablet, and Desktop |
| ✅ Dark/Light Mode Support | System-preference detection with manual toggle for user convenience |
| ✅ Ambient Music Player | Solfeggio frequency audio tracks for focused learning sessions |
| ✅ Gamification System | Points, achievements, and streak tracking to encourage engagement |
| ✅ Forum & Community | Discussion threads for student-teacher interaction |

---

## Tech Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Context + Hooks
- **HTTP Client:** Custom API client with interceptors

### Backend
- **Runtime:** Node.js
- **Framework:** Fastify
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with refresh tokens
- **API Style:** RESTful endpoints

---

## Project Structure

```
viitor-educat/
├── viitor-educat-main/          # Main application directory
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── [feature]/       # Feature-specific components
│   │   ├── contexts/            # React Context providers
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and helpers
│   │   ├── modules/             # Feature modules
│   │   ├── pages/               # Page components
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── backend/                 # Backend API server
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/         # API routes
│   │       │   ├── core/        # Core services
│   │       │   ├── models/      # Prisma models
│   │       │   ├── schemas/     # Zod schemas
│   │       │   └── services/    # Business logic
│   │       └── index.ts         # Server entry point
│   └── prisma/                  # Database schema
├── .github/                     # GitHub configuration
├── LICENSE                      # MIT License
├── README.md                    # This file
└── package.json                 # Root package configuration
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- (Optional) Docker for containerization

### Installation

```bash
# Clone the deploy branch
git clone -b deploy https://github.com/PRSro/viitor-educat.git
cd viitor-educat/viitor-educat-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Configure environment
cp .env.example .env

# Edit .env with your database and API settings
# Required variables:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (Your JWT secret key)
# - Frontend API URL
```

### Running the Development Server

```bash
# Start frontend (runs on http://localhost:5173)
npm run dev

# Start backend (runs on http://localhost:3000)
cd backend
npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

---

## Deployment

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy with automatic builds

### Option 3: Vercel (Frontend)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Follow prompts to configure

### Option 4: Netlify

1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 3000) | No |
| `VITE_API_URL` | Backend API URL for frontend | Yes |

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icons

---

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues before creating a new one

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/PRSro">PRSro</a>
</p>