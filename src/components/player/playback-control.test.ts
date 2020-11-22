import { o } from 'ramda'
import { Playlist } from '../../types'
import { playbackInSync, playbackOffset } from './playback-control'

describe('playbackInSync()', () => {
  const playlist: Playlist = {
    createdAt: '2020-11-22T18:10:06.431Z',
    tracks: [
      // Each track is 10 seconds long
      { id: 'one', name: 'One', duration_ms: 10000, artists: [] },
      { id: 'two', name: 'Two', duration_ms: 10000, artists: [] },
      { id: 'three', name: 'Three', duration_ms: 10000, artists: [] },
    ],
  }

  it('returns true if the playback is inside acceptable boundary', () => {
    const track = { id: 'two' } as Spotify.Track
    const now = addSeconds(new Date(playlist.createdAt), 10)

    const isInSync = playbackInSync(playlist, { trackOffset: 200, track }, now)

    expect(isInSync).toBe(true)
  })

  it('returns false if the playback is behind the actual', () => {
    // We're still on the first track
    const track = { id: 'one' } as Spotify.Track
    // Even though 10 seconds have already past
    const now = addSeconds(new Date(playlist.createdAt), 10)

    const isInSync = playbackInSync(playlist, { trackOffset: 200, track }, now)

    expect(isInSync).toBe(false)
  })

  it('returns false if the current track is not in the playlist', () => {
    // We're still on the first track
    const track = { id: 'not-in-the-playlist' } as Spotify.Track
    const now = addSeconds(new Date(playlist.createdAt), 0)

    const isInSync = playbackInSync(playlist, { trackOffset: 0, track }, now)

    expect(isInSync).toBe(false)
  })
})

describe('playbackOffset()', () => {
  it.todo('finds the offset to the current position inside the playlist tracks')
})

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000)
}
