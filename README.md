# Syncify

[https://syncify.co](https://syncify.co)

Syncify is a web application that lets users listen to the same music in synchrony, via Spotify.

## Requirements

- [Node 12](https://nodejs.org/en/)
- [Docker](https://www.docker.com/) with `docker-compose` for the development environment

## Commands

```sh
npm run dev

npm run debug # same as the dev script, but starts a Node.js debug server

# generate a publicly available url and proxy requests to localhost
npm run webhook-proxy

# run development environment
docker-compose up -d

# database migrations
npm run migrate up
npm run migrate down
npm run migrate create my-new-migration

# run app in production
npm run build
npm start
```

## Nomenclature (Domain Language)

This is how we name certain things:

### Track or Song

Always use the name **track**. Spotify uses this naming scheme in all their APIs and doing it differently would increase complexity.

## Logging

Syncify uses the logging library [https://github.com/winstonjs/winston](winston).  
To create a pre-configured instance, use the `createLogger()` function in `utils/logger.ts`.

## Release (Deployment)

The application is continuously deployed on every master push to [zeit now](https://zeit.co) via Github Actions.
In the future we might want to take advantage of the now Github Integration and have staging environments for each pull request.

## Services used

### [Pusher](https://pusher.com/)

We use Pusher's "presence rooms" feature for user interactions.

### Spotify Web Playback SDK

Allows creation of a Spotify Connect device in the browser that can then subsequently be controlled with the Spotify API.

### [LogDNA](https://logdna.com/)

Integration with Vercel.

### [Plausible.io](https://plausible.io/)

Ethical analytics.

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
