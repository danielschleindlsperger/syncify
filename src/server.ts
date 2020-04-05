require('dotenv').config()
import { createServer } from 'http'
import process from 'process'
import { app } from './api/app'
const { PORT = 4000 } = process.env

let currentHandler = app.callback()
const server = createServer(currentHandler)

server.listen(PORT, () => {
  console.log(`==> Listening on port ${PORT}`)
})

if (module.hot) {
  console.log('Server-side HMR Enabled!')

  module.hot.accept('./api/app', () => {
    console.log('HMR Reloading `./api/app`...')

    try {
      // TODO: change this to dynamic import
      const { app: nextApp } = require('./api/app')
      server.removeListener('request', currentHandler)

      currentHandler = nextApp.callback()
      server.on('request', currentHandler)

      console.log('HttpServer reloaded!')
    } catch (error) {
      console.error(error)
    }
  })
}

process.on('SIGINT', () => {
  console.info('Received SIGINT. Exiting.')
  process.exit(0)
})
