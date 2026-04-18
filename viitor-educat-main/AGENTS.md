# AGENTS.md - Viitor Educat

## Project Structure

- `viitor-educat-main/` - main project root
  - `src/` - React frontend (Vite + TypeScript + shadcn/ui + Tailwind)
  - `backend/` - Node.js API server (Fastify + Prisma + PostgreSQL)
  - `lessons/` - course content JSON files

## Developer Commands

### Frontend (root directory)
```bash
npm run dev           # Start both frontend + backend concurrently
npm run dev:frontend  # Frontend only (port 5173)
npm run build        # Build frontend, install backend deps, build backend
npm run lint        # ESLint
npm run test        # Vitest
npm run test:watch # Vitest watch mode
```

### Backend (cd backend)
```bash
npm run dev              # Start API server (port 3000)
npm run build            # prisma generate + tsc
npm run test             # Vitest
npm run prisma:generate # Update Prisma client
npm run prisma:migrate   # Run migrations
npm run db:seed         # Seed database
```

## CI Pipeline

Order: `lint -> typecheck -> test -> build`

Jobs defined in `.github/workflows/ci.yml`:
1. lint-and-typecheck - ESLint + tsc --noEmit (both frontend/backend)
2. test - Unit tests with PostgreSQL service
3. build - Production builds
4. docker-build - Docker image

## Environment Variables

Required (`backend/.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Auth secret (generate with `openssl rand -base64 32`)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins
- `NODE_ENV` - development | production

Frontend-only (root `.env`):
- `VITE_API_URL` - Backend URL (leave empty for dev, Vite proxy handles it)

## Key Details

- Frontend build artifact: `dist/`
- Backend build artifact: `backend/dist/`
- Prisma schema: `backend/prisma/schema.prisma`
- API docs: `http://localhost:3000/docs` (Swagger UI in dev)
- Test setup: `src/test/setup.ts` (frontend vitest)
- Backend uses tsx watch for dev with auto-reload