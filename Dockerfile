FROM node:20.11.0 as builder

WORKDIR /app

COPY . .

EXPOSE 3000

RUN npm install
RUN npm run build

CMD ["npm", "run", "start:prod"]
