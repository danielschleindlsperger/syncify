import React from 'react'
import '../styles.css'
import { AppProps } from 'next/app'
import { AuthProvider } from '../components/auth'
import { Navbar } from '../components/nav-bar'
import { SpotifyPlayerProvider, PlayerStoreProvider } from '../components/spotify-player'
import { Player } from '../components/player'

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <PlayerStoreProvider>
        <SpotifyPlayerProvider>
          <Navbar />
          <Component {...pageProps} />
          <Player />
        </SpotifyPlayerProvider>
      </PlayerStoreProvider>
    </AuthProvider>
  )
}

export default App
