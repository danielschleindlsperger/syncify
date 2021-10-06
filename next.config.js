// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
  /**
   * Use environment variables from the local file in development only
   */
  let env = {}

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: '.env.build' })
    env = {
      JWT_SECRET: process.env.JWT_SECRET,
      APP_URL: process.env.APP_URL,
      WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REDIRECT_URL: process.env.SPOTIFY_REDIRECT_URL,
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      PUSHER_APP_KEY: process.env.PUSHER_APP_KEY,
      PUSHER_SECRET: process.env.PUSHER_SECRET,
    }
  }

  return {
    ...defaultConfig,
    env: {
      ...defaultConfig.env,
      ...env,
    },

    async rewrites() {
      return phase === PHASE_DEVELOPMENT_SERVER
        ? {
            beforeFiles: [
              {
                source: '/api/:path*',
                destination: 'http://localhost:4321/api/:path*',
              },
              {
                source: '/oauth2/:path*',
                destination: 'http://localhost:4321/oauth2/:path*',
              },
            ],
          }
        : {}
    },
    async redirects() {
      return [
        {
          // we don't have a landing page yet so redirect to rooms for now
          source: '/',
          destination: '/rooms',
          permanent: false,
        },
      ]
    },
  }
}
