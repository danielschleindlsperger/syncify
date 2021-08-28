import React from 'react'
import Head from 'next/head'
import { AppProps } from 'next/app'
import '../styles.css'
import { AuthProvider } from '../components/auth'
import { AppErrorBoundary } from '../components/app-error-boundary'
import { ConfigProvider } from '../hooks/use-config'
import { ChakraProvider } from '@chakra-ui/react'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Analytics />
      <ChakraProvider>
        <AppErrorBoundary>
          <AuthProvider>
            <ConfigProvider>
              <Component {...pageProps} />
            </ConfigProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </ChakraProvider>
    </>
  )
}

export default App

const Analytics = () => (
  <Head>
    <script
      key="umami"
      async
      defer
      data-website-id="7a68d7ba-2fc4-425a-870a-17e076095219"
      src="https://umami-analytics.lchthbr.xyz/umami.js"
    />
    <script
      key="analytics"
      async
      defer
      data-domain="syncify.co"
      src="https://plausible.io/js/plausible.js"
    />
  </Head>
)
