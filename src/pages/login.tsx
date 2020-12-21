import React from 'react'

// TODO: unused page: delete
const LoginUrl = '/api/auth/login'

export default function Login() {
  return (
    <main>
      <h1>Login required</h1>
      <a
        href={LoginUrl}
        className="mt-4 inline-block bg-blue-700 text-gray-100 px-3 py-1 rounded-sm"
      >
        Log in to Spotify
      </a>
    </main>
  )
}
