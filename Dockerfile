FROM node:12-alpine

ENV NODE_ENV=production

RUN mkdir -p /app
WORKDIR /app

# copy source files
COPY . /app

# install dependencies
RUN npm install

# build app
RUN npm run build

RUN npm prune --production

# start app
EXPOSE 3000
CMD npm run start
