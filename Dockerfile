# Use the official Node.js image with the specified version
FROM node:18-alpine

WORKDIR /app

# Copy the application source code to the container
COPY . .

# Install production dependencies only (excluding devDependencies)
RUN npm install --production


# Copy the compiled JavaScript files to the container
COPY dist ./dist


# Set the environment variable for production
ENV NODE_ENV=production
ENV HOST "0.0.0.0"
ENV PORT 3001

# Expose the port on which your application will run
EXPOSE 3001


# Start the Node.js application
CMD ["node", "./dist/index.js"]



