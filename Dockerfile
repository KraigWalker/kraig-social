FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . ./

# Set the Node.js environment variables (if needed)
ENV PORT=3000
EXPOSE 3000

# Specify the command to run when starting the container
CMD ["node", "src/server.js"]