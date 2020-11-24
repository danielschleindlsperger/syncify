import * as React from 'react'
import { render } from '@testing-library/react'
import { Player } from './player'
import { PlayerStoreProvider } from './player-store'
import { Room } from '../../types'

describe('<Player />', () => {
  it.todo('renders title')
  it.todo('renders cover art')
  it.todo('renders cover art')

  it("renders nothing when Spotify player's playback state is not available", () => {
    const { container } = render(
      <PlayerStoreProvider>
        <Player />
      </PlayerStoreProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it.todo('re-syncs playback when drift is detected twice')

  it.todo('switches track when a "track changed" event comes in')
})

const room: Room = {
  admins: [],
  id: '123',
  publiclyListed: true,
  name: 'my room',
  cover_image: 'image.jpg',
  playlist: {
    createdAt: '2020-01-01T12:00:00.000Z',
    tracks: [{ id: '1', duration_ms: 1000, name: 'First Track', artists: ['First Artist'] }],
  },
}
