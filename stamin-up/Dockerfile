FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build Next.js application
RUN npm run build

# Expose Next.js port
EXPOSE 3001

# Start Next.js dev server
CMD ["npm", "start"]