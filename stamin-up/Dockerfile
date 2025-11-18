FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the code
COPY . .

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js application with env vars
RUN npm run build

# Expose Next.js port
EXPOSE 3001

# Start Next.js dev server
CMD ["npm", "start"]