# Use a lightweight Node image
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose port
EXPOSE 3000

CMD ["node", "server.js"]