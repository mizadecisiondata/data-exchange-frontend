FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY public ./public
COPY src ./src
COPY scripts ./scripts

EXPOSE 3100

CMD ["npm", "run", "dev"]
