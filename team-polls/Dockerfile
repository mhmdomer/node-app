FROM node:18-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies for build
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production image
FROM node:18-alpine

# Set NODE_ENV
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Run the application
CMD ["npx", "ts-node", "dist/server.js"]