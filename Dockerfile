FROM node:25-alpine AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install pnpm (corepack not bundled on this Node Alpine image)
RUN npm install -g pnpm@latest

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:25-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3366

ENV PORT=3366
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
