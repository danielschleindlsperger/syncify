import { skipCurrentTrack } from './room-controls'
import { Room } from '../../types'

describe('skipTrack()', () => {
  it('skip first track', () => {
    const roomWithThreeSkippedTracks = skipCurrentTrack(1000, {
      ...room,
      playlist: { ...room.playlist, createdAt: new Date(0).toISOString() },
    })

    expect(roomWithThreeSkippedTracks.playlist.tracks).toEqual([
      {
        id: '222',
        duration_ms: 3000,
      },
      {
        id: '333',
        duration_ms: 3000,
      },
    ])
    expect(Date.parse(roomWithThreeSkippedTracks.playlist.createdAt)).toBe(1000)
  })

  it('skip last track', () => {
    const roomWithThreeSkippedTracks = skipCurrentTrack(8000, {
      ...room,
      playlist: { ...room.playlist, createdAt: new Date(0).toISOString() },
    })

    expect(roomWithThreeSkippedTracks.playlist.tracks).toEqual([
      {
        id: '111',
        duration_ms: 3000,
      },
      {
        id: '222',
        duration_ms: 3000,
      },
    ])
    expect(Date.parse(roomWithThreeSkippedTracks.playlist.createdAt)).toBe(2000)
  })

  const now = 5000
  const room: Room = {
    playlist: {
      createdAt: new Date(now).toISOString(),
      tracks: [
        {
          id: '111',
          duration_ms: 3000,
        },
        {
          id: '222',
          duration_ms: 3000,
        },
        {
          id: '333',
          duration_ms: 3000,
        },
      ],
    },
  } as Room
})
