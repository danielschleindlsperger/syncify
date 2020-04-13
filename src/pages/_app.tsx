import React from 'react'
import '../styles.css'
import { AppProps } from 'next/app'
import { AuthProvider } from '../components/auth'
import { Navbar } from '../components/nav-bar'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
      <ArnoldAnalytics />
    </>
  )
}

export default App

const ArnoldAnalytics = () => (
  <>
    <script
      src="https://app.usearnold.com/assets/pixel.min.js"
      data-arnold-analytics="f6b56035bb5b7e2da72778b6e76ee780"
      data-arnold-analytics-location="off"
    ></script>
    <noscript>
      <img src="https://app.usearnold.com/hello?key=f6b56035bb5b7e2da72778b6e76ee780" alt="" />
    </noscript>
  </>
)
