FROM node:20-alpine

WORKDIR /app

# Install root dependencies (backend)
COPY package*.json ./
RUN npm ci --omit=dev

# Install and build frontend
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend

COPY . .
RUN npm run build --prefix frontend

# Expose the Express port
EXPOSE 5000

# Add static serving to Express at runtime via env flag
CMD ["node", "backend/index.js"]
