# Base stage
FROM node:18 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY ./src ./src
COPY ./views ./views
COPY ./bin ./bin
COPY ./public ./public

# Production stage
FROM node:18-slim
WORKDIR /app
COPY --from=base /app /app
CMD ["node", "./bin/www"]
