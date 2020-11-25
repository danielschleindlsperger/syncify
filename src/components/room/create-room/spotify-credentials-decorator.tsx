import React from 'react'
import { makeDecorator } from '@storybook/addons'
import { AuthContext, AuthState, AuthUser } from '../../auth/auth'
import SpotifyWebApi from 'spotify-web-api-js'

export const withSpotifyCredentials = makeDecorator({
  name: 'withSpotifyCredentials',
  parameterName: 'spotify',
  // eslint-disable-next-line react/display-name
  wrapper: (storyFn, context) => {
    return <Wrapper>{storyFn(context)}</Wrapper>
  },
})

type SpotifyInput = {
  refreshToken: string
  clientSecret: string
}

const StorageKey = 'syncify-spotify-input-vsyhass'

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const [spotifyInput, setSpotifyInput] = React.useState<SpotifyInput | null>(null)
  const [user, setUser] = React.useState<AuthUser | undefined>()

  React.useEffect(() => {
    if (spotifyInput) {
      refreshAccessToken(spotifyInput).then(fetchUser).then(setUser)
    }
  }, [spotifyInput])

  React.useEffect(() => {
    if (spotifyInput) return

    let input: SpotifyInput | null = JSON.parse(window.localStorage.getItem(StorageKey) ?? 'null')

    if (input) {
      setSpotifyInput(input)
      return
    }

    input = {
      refreshToken: window.prompt('Please enter your Spotify OAuth refresh token.') ?? '',
      clientSecret: window.prompt('Please enter the Spotify client secret') ?? '',
    }

    setSpotifyInput(input)
    window.localStorage.setItem(StorageKey, JSON.stringify(input))
  }, [spotifyInput])

  const authState: AuthState = {
    user,
    state: user ? 'logged-in' : 'pending',
  }

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

const clientId = 'b7fbf01f209d452b89428414609933f3'

const refreshAccessToken = async ({
  clientSecret,
  refreshToken,
}: SpotifyInput): Promise<string> => {
  return window
    .fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + window.btoa(clientId + ':' + clientSecret),
      },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    })
    .then((res) => res.json())
    .then((body) => body.access_token)
}

const fetchUser = async (accessToken: string): Promise<AuthUser> => {
  const spotify = new SpotifyWebApi()
  spotify.setAccessToken(accessToken)
  return spotify.getMe().then((body) => ({
    name: body.display_name ?? body.id,
    id: body.id,
    access_token: accessToken,
    avatar: undefined,
  }))
}
