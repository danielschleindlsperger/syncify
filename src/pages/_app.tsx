import React from 'react'
import Head from 'next/head'
import { AppProps } from 'next/app'
import '../styles.css'
import { AuthProvider } from '../components/auth'
import { AppErrorBoundary } from '../components/app-error-boundary'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Analytics />
      <AuthProvider>
        <AppErrorBoundary>
          <Component {...pageProps} />
        </AppErrorBoundary>
      </AuthProvider>
    </>
  )
}

export default App

const Analytics = () => (
  <Head>
    <script
      key="analytics"
      async
      defer
      data-domain="syncify.co"
      src="https://plausible.io/js/plausible.js"
    />
  </Head>
)
