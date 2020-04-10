import React from 'react'
import '../styles.css'
import { AppProps } from 'next/app'
import { AuthProvider } from '../components/auth'
import { Navbar } from '../components/nav-bar'

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* TODO: Move Navbar into the pages that actually need it */}
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default App
