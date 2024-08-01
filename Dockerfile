FROM node:20.11.0 as builder

WORKDIR /app

COPY . .

EXPOSE 3333

RUN npm install
RUN npm run build
RUN npm run migration:run

CMD ["npm", "run", "start:prod"]