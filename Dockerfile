FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
COPY .env.example .env

EXPOSE 2000

CMD ["npm", "start"]