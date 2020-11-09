# spotify-clj

Clojure library for interacting with the Spotify Web API.

Inspiration is taken from Cognitect's [data-driven AWS client](https://github.com/cognitect-labs/aws-api).

## Goals

- Discoverable: Make it easy to explore the myriad of endpoints in Spotify's API
- Data-driven: Configure everything with data. Only write generic functions for HTTP interaction with the API and derive everything else from an [API specification](resources/spotify-web-api-spec.json) (OpenAPI).

## Usage

### Auth

```clojure
(require [spotify-clj.auth :as spotify-auth])

;; Generate an authorization URL for enduser-based flows
(spotify-auth/authorization-url {:client-id "sad9hdsfoaf"
                                 :redirect-uri "https://localhost.com/foo"
                                 :scope "read-user-email,read-user-private"
                                 :show-dialog false})


;; Get an access token for server-side API access (can't read user data)
(spotify-auth/client-credentials spotify-config)

(spotify-auth/refresh-access-token {..})
(spotify-auth/trade-code-for-tokens {..})

```

### Exploring and Querying the API

```clojure
(require [spotify-clj.core :as spotify])

;; Get API meta data
(spotify/meta-data)

;; Get a list of all available enpoints
(spotify/explore)

;; Get more detailed information about an API endpoint
(spotify/explore :get-an-artist)

;; Get information about an artist
(invoke :get-an-artist access-token {:id "0OdUWJ0sBjDrqHygGUXeCF"})
```

## Development

### Credentials

To use the real API you need credentials. These can be set in `resources/secrets.edn`. A template is available in `resources/secrets.edn.example`.

## TODO

- Tests
- Spec public api
  - might use orchestra and expound for this
- Add more endpoints: maybe write a parser for the Spotify docs
- POST parameter (body param) replacement
- Filterable (select returned keys)
- Limit
- Offset
- Pagination (helper to fetch all resources)
- Retries
- Exponential backoff and circuit breaker
