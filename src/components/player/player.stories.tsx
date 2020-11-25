import React from 'react'
import { storiesOf } from '@storybook/react'
import { Player } from './player'
import { SpotifyPlayerProvider, useSpotifyPlayer } from './spotify-web-player'
import { withSpotifyCredentials } from '../room/create-room/spotify-credentials-decorator'
import { PlayerStoreProvider } from './player-store'

storiesOf('Player', module)
  .addDecorator(withSpotifyCredentials)
  .add('Start of track', () => (
    <PlayerStoreProvider>
      <SpotifyPlayerProvider>
        <PlayTrack uris={['spotify:track:5PTQyBvYT020Bj75v01CDW']} />
        <Player />
      </SpotifyPlayerProvider>
    </PlayerStoreProvider>
  ))
  .add('Change of tracks', () => (
    <PlayerStoreProvider>
      <SpotifyPlayerProvider>
        <PlayTrack
          uris={['spotify:track:5PTQyBvYT020Bj75v01CDW', 'spotify:track:1tQGRq2WOBXjL3JWdWMONg']}
          offset={250000}
        />
        <Player />
      </SpotifyPlayerProvider>
    </PlayerStoreProvider>
  ))
  .add('Last track ends', () => (
    <PlayerStoreProvider>
      <SpotifyPlayerProvider>
        <PlayTrack uris={['spotify:track:5PTQyBvYT020Bj75v01CDW']} offset={250000} />
        <Player />
      </SpotifyPlayerProvider>
    </PlayerStoreProvider>
  ))
  .add('Nothing playing', () => (
    <PlayerStoreProvider>
      <SpotifyPlayerProvider>
        <PlayTrack uris={[]} />
        <Player />
      </SpotifyPlayerProvider>
    </PlayerStoreProvider>
  ))
// 251034
const PlayTrack: React.FC<{ uris: string[]; offset?: number }> = ({ uris, offset = 0 }) => {
  const { play } = useSpotifyPlayer()

  React.useEffect(() => {
    if (play && uris.length > 0) {
      play(uris, offset)
    }
  }, [play, uris, offset])

  return null
}
