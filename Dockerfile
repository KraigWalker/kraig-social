FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build (this runs `tsc && cp -R src/public dist/public`)
COPY . ./
RUN npm run build

# Remove dev dependencies to keep image smaller
RUN npm ci --omit=dev

# Set the Node.js environment variables (if needed)
ENV PORT=3000
EXPOSE 3000

# Specify the command to run when starting the container
CMD ["node", "dist/server.js"]