FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
# We also copy backend package.json to install backend dependencies properly if workspace setup
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend

# Copy source code
COPY backend ./backend

WORKDIR /app/backend

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
