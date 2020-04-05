FROM node:12

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build:server

ENTRYPOINT ["node"]
CMD ["build/app.js"]
