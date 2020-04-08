import React from 'react'
import { AppUrl } from '../config'

const LoginUrl = AppUrl + '/api/auth/login'

export default () => (
  <main>
    <h1>Login required</h1>
    <a href={LoginUrl} className="mt-4 inline-block bg-blue-700 text-gray-100 px-3 py-1 rounded-sm">
      Log in to Spotify
    </a>
  </main>
)
