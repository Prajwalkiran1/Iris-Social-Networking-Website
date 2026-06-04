# Backend image for the local Jenkins CI/CD demo.
# (The cloud deployment on Render does NOT use this — it builds from source.)
FROM node:20-slim

WORKDIR /app

# Install only production deps (jest/supertest are dev-only).
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5001
CMD ["npm", "start"]
