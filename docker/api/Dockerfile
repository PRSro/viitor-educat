# Build stage for both frontend and backend
FROM node:20-alpine AS build

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm ci

# Copy and build backend
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Copy and build frontend
WORKDIR /app
COPY . .
# Remove backend to avoid confusion if necessary, but we need it for some types maybe
# Actually just build the root (frontend)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/package.json ./backend/
COPY --from=build /app/backend/prisma ./backend/prisma

# Copy frontend build to a place backend expects it
# Based on main.ts change: path.join(__dirname, '../../dist')
# If main.js is in backend/dist, then ../../dist is ROOT/dist
COPY --from=build /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/backend
CMD ["node", "dist/main.js"]
