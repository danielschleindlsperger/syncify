# Syncify

[https://syncify.co](https://syncify.co)

## Requirements

- Node.js 12
- [now CLI](https://zeit.co/download) for deployment
- Docker for the development environment with `docker-compose`

## Commands

```sh
npm start

# start a proxy to receive pusher webhooks on localhost
npm run webhook-proxy

# database migrations
npm run migrate up
npm run migrate down
npm run migrate create my-new-migration
```

## Release (Deployment)

The application is deployed to [zeit now](https://zeit.co)

```bash
# start locally
now dev

# deploy to prod
now --prod
```

## Services used

### Pusher

### Digitalocean hosted postgres

### Spotify Web Playback SDK

### Vercel (Zeit)

### LogDNA
