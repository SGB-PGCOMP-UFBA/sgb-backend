ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

USER node

CMD ["node", "dist/main"]
