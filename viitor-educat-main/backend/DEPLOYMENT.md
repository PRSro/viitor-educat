# Deployment Guide — Zero-Cost Stack

This guide documents how to deploy viitor-educat on the free tiers of Vercel (frontend), Railway (backend), Neon (PostgreSQL), and Upstash (Redis).

---

## 1. Database — Neon (Free PostgreSQL)

1. Sign up at **https://neon.tech** and create a new project.
2. Copy the **connection string** (looks like `postgresql://user:pass@host/dbname?sslmode=require`).
3. You will use this as `DATABASE_URL` in the Railway environment variables (see below).

---

## 2. Redis — Upstash (Free tier)

1. Sign up at **https://upstash.com** and create a new Redis database (select free tier).
2. Copy the **Redis URL** (looks like `redis://default:password@host:port`).
3. You will use this as `REDIS_URL` in the Railway environment variables.

---

## 3. Backend — Railway

> The backend is already configured via `backend/railway.json` and `backend/railway.toml`.
> Railway watches the `backend/` directory and auto-deploys on push to `main`.

### Environment Variables to set in Railway dashboard

| Variable        | Value                                                  |
|-----------------|--------------------------------------------------------|
| `DATABASE_URL`  | Neon connection string from step 1                     |
| `JWT_SECRET`    | A long random string (e.g. `openssl rand -hex 32`)    |
| `REDIS_URL`     | Upstash Redis URL from step 2                          |
| `NODE_ENV`      | `production`                                           |

### Enable auto-deploy
- In Railway project → **Settings → Source** → connect your GitHub repo.
- Set the **branch** to `main` and the **root directory** to `backend`.
- Railway will deploy automatically on every push to `main`.

---

## 4. Frontend — Vercel

### Environment Variables to set in Vercel dashboard

| Variable       | Value                                           |
|----------------|-------------------------------------------------|
| `VITE_API_URL` | Your Railway backend URL, e.g. `https://xyz.up.railway.app` |

### Enable auto-deploy
1. Sign up / log in at **https://vercel.com**.
2. Import the GitHub repo.
3. Set **Framework Preset** to `Vite`.
4. Set **Root Directory** to `.` (repo root, where `vercel.json` lives).
5. Add the `VITE_API_URL` environment variable (Production only).
6. Vercel will auto-deploy on every push to `main`.

---

## 5. First-time deployment checklist

- [ ] Neon project created and `DATABASE_URL` copied
- [ ] Upstash Redis created and `REDIS_URL` copied
- [ ] Railway environment variables set (`DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `NODE_ENV`)
- [ ] Railway auto-deploy enabled from `main` → `backend/`
- [ ] Vercel environment variable `VITE_API_URL` set to Railway URL
- [ ] Vercel auto-deploy enabled from `main`
- [ ] `.env.production` in repo root updated with actual Railway URL (for local prod builds)

---

## 6. Database migrations

Migrations run automatically on every deploy via the Railway start command:

```
npm run db:migrate && npm start
```

which executes `npx prisma migrate deploy` before starting the server.

To run migrations manually:

```bash
cd backend
DATABASE_URL="<neon-url>" npx prisma migrate deploy
```
