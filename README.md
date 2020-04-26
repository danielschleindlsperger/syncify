# Syncify

[https://syncify.co](https://syncify.co)

## Requirements

- [Node 12](https://nodejs.org/en/)
- [now CLI](https://zeit.co/download) for deployment
- [Docker](https://www.docker.com/) with `docker-compose` for the development environment

## Commands

```sh
npm start

# start a proxy to receive pusher webhooks on localhost
npm run webhook-proxy

# run development environment
docker-compose up -d

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

We use Pusher's "presence rooms" feature for user interactions.

### DigitalOcean Managed Postgres

Managed Postgres with PGBouncer to allow for more client connections. This is useful because serverless functions can scale horizontally very well and don't work well with the traditional connection poool model. Instead each function will hold a database connection that will be frozen until another request comes in.

### Spotify Web Playback SDK

Allows creation of a Spotify Connect device in the browser that can then subsequently be controlled with the Spotify API.

### Vercel (Zeit)

Serverless paas.

### LogDNA

Integration with Vercel.

## How it works

### Authentication

#### Login Flow

- User sends GET request to `/api/auth/login`
- API redirects to Spotify OAuth login URL (with HTTP referer in OAuth state)
- User grants permissions to scopes
- Spotify redirects to `api/auth/spotify-callback` with a `code` and `state` query parameter
- API trades `code` for access and refresh tokens and requests user data with access token
- API saves user data and refresh token to database
- API generates a JWT with the user id as payload and sets semi-long living cookie `syncify_session` with it
- API redirects user to initial page or a fallback page if none was given

User now sends the cookie with every request and API uses it to authenticate and authorize the user

#### Refresh and User Data

Since the JWT is attached to an HTTP-only cookie (for security reasons), the client cannot access it. Therefore we have to make another request from the browser to get the user data and Spotify access token. This enables the usage of the Spotify API from the browser.

The route `/api/auth/refresh` (TODO: change url?) currently acts threefold:
For one re-generates the Spotify access token and returns it. Secondly it returns the users profile data. Lastly it revalidates the `syncify_session`. It is called from the browser once at app start and then again in intervals to prevent the Spotify access token from expiring.

#### Accessing User Data

Try the `useAuth` hook.

#### Protecting an API Endpoint

Wrap your handler in the `withAuth` HOF.

#### Protecting client-only Components

Wrap part of your component tree in `<AuthenticatedOnly />`. It will only render its children after the initial user data request. It will also render a fallback UI if the user it not logged in or the request failed.

### Making an API Request

Use the `useApiRequest` hook. It uses `useSWR` under the hook and automatically handles `401` error responses. All other errors must be handled manually.
