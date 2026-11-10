# Production Multi-Stage Dockerfile
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy application files
COPY package.json ./
COPY server.js ./
COPY public ./public
COPY test ./test

# Ensure non-root user for enterprise container security
USER node

# Expose HTTP port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/queue', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start production server
CMD ["node", "server.js"]
