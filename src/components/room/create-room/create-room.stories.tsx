import React from 'react'
import { storiesOf } from '@storybook/react'
import { CreateRoom, RoomState } from './create-room'
import { PickModeStep } from './steps/pick-mode-step'
import { PlaylistProvider, UserPlaylist } from './steps/create-playlist-step'
import { withSpotifyCredentials } from './spotify-credentials-decorator'
import { FinalizeStep } from './steps/finalize-step'

storiesOf('Create Room', module)
  .addDecorator(withSpotifyCredentials)
  .add('Choose Mode', () => <PickModeStep setMode={() => {}} activeMode="user-playlist" />)
  .add('Wizard', () => <CreateRoom />)
  .add('Finalize Choices', () => <FinalizeStepWithState />)

const FinalizeStepWithState = () => {
  const [roomState, setRoomState] = React.useState<RoomState>({
    name: 'Room Name',
    publiclyListed: true,
    image: undefined,
    trackIds: [],
  })
  return <FinalizeStep roomState={roomState} setRoomState={setRoomState} onSubmit={alert} />
}

storiesOf('Create Room/Modes', module)
  .addDecorator(withSpotifyCredentials)
  .add('User Playlist', () => (
    <PlaylistProvider>
      <UserPlaylist setRoomState={() => {}} />
    </PlaylistProvider>
  ))
