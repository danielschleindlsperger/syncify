const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')
const dotenv = require('dotenv')

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    require('dotenv').config({ path: '.env.build' })
  }

  return {
    ...defaultConfig,
    env: {
      ...defaultConfig.env,
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
    },
  }
}
