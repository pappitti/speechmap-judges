FROM node:22-slim

# The base image already has a 'node' user with UID 1000.
USER node

# Set environment variables for the 'node' user's home directory
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

WORKDIR $HOME/app

COPY --chown=node package*.json ./

# Run npm install as the non-root 'node' user.
RUN npm install

# Copy the rest of the application code, again setting ownership.
COPY --chown=node: . .

# Run the build scripts as the 'node' user
RUN npm run build
RUN npm run db:rebuild

# Expose the port
EXPOSE 7860

# Run the final command as the 'node' user
CMD ["npm", "run", "start"]
