# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all app files
COPY . .

# Build the app with the fixed configuration
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]