#
# Stage 1: Builder
# 
FROM node:22-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build (this runs `tsc && cp -R src/public dist/public`)
COPY . ./
RUN npm run build

#
# Stage 2: Runner
#
FROM node:22-alpine

WORKDIR /app

# Copy package files again, but now install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist /app/dist

# Set the Node.js environment variables (if needed)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Specify the command to run when starting the container
CMD ["node", "dist/server.js"]