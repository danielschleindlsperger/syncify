import React from 'react'
import Head from 'next/head'
import { AppProps } from 'next/app'
import '../styles.css'
import { AuthProvider } from '../components/auth'
import { AppErrorBoundary } from '../components/app-error-boundary'
import { ConfigProvider } from '../hooks/use-config'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Analytics />
      <AppErrorBoundary>
        <AuthProvider>
          <ConfigProvider>
            <Component {...pageProps} />
          </ConfigProvider>
        </AuthProvider>
      </AppErrorBoundary>
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
