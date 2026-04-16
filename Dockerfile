FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 10000

RUN mkdir -p /app/data /app/public/uploads && chmod -R 777 /app/data /app/public/uploads

CMD ["npx", "next", "start", "-H", "0.0.0.0"]
