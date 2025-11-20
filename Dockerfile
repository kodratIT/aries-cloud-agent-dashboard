# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Copy source code (includes .env files if present)
COPY . .

# Set build-time environment variable
# This is required for SvelteKit to include PUBLIC_ env vars in build
# Can be overridden via docker-compose build args
ARG PUBLIC_ACAPY_API_URL=http://multi-agent:8021
ENV PUBLIC_ACAPY_API_URL=$PUBLIC_ACAPY_API_URL

# Build the application
RUN yarn build

# Debug: List build output
RUN ls -la && echo "Build directory contents:" && ls -la build/ || echo "Build directory not found"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Runtime environment variable (can be overridden)
ENV PUBLIC_ACAPY_API_URL=http://localhost:8021

# Start the application
CMD ["node", "build"]
