FROM node:12-alpine

# Install dependencies for node-gyp to work (to compile native extensions)
RUN apk update && apk add python g++ make && rm -rf /var/cache/apk/*

RUN mkdir -p /app
WORKDIR /app

# copy source files
COPY . /app

# install dependencies
RUN npm ci

ENV NODE_ENV=production

# build app
RUN npm run build

RUN npm prune --production

# start app
EXPOSE 3000
CMD npm run start
