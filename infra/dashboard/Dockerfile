# Standalone CI/CD evidence dashboard (zero-dependency Node server).
# Reads the shared /evidence volume that the Jenkins pipeline writes to.
FROM node:20-slim
WORKDIR /app
COPY server.js .
EXPOSE 4000
CMD ["node", "server.js"]
