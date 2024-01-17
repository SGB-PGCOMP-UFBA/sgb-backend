FROM node:18.12-alpine3.16 as builder

COPY . .

EXPOSE 3000

RUN npm install
RUN npm run build

CMD ["npm", "run", "start:prod"]
