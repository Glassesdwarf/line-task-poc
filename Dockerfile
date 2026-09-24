FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate

RUN npm run build

RUN mkdir -p dist/generated
RUN cp -r generated/prisma dist/generated/

EXPOSE 3000

CMD ["node", "dist/src/index.js"]