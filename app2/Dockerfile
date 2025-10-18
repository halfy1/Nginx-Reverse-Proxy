FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./

RUN npm install --only=production --no-optional --no-audit --no-fund

COPY . .

RUN mkdir -p /app/static

EXPOSE 3000

CMD ["node", "server.js"]