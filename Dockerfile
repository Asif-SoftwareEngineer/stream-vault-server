# Use the official Node.js 18 image with Alpine Linux as the base image
FROM node:18-alpine

# Install necessary dependencies
RUN apk add --update --no-progress make bash

# Set npm log level to 'error' to reduce log output during npm install
ENV NPM_CONFIG_LOGLEVEL error

# Download and install dumb-init (a simple process supervisor for signal handling)
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Create the /usr/src/app directory and set its ownership to the 'node' user
RUN mkdir -p /usr/src/app
RUN chown node: /usr/src/app

# Switch to the 'node' user for subsequent commands
USER node

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if present) into the container
COPY package*.json ./

# Copy the .env file into the container
COPY .env ./

# Copy the tsconfig.src.json file into the container
COPY tsconfig.json ./


# Install only production dependencies (npm ci is preferred for containerized environments)
RUN npm ci --only=production


# Set environment variables for the Node.js application
ENV HOST "0.0.0.0"
ENV PORT 3000
EXPOSE 3000

# Add the built application code (dist folder) to the container
ADD dist dist

# Use dumb-init as the entry point to properly handle signals and execute the Node.js application
ENTRYPOINT ["dumb-init", "--"]

# Define the command to run the Node.js application (index.js in the dist folder)
CMD ["node", "./dist/index.js"]
