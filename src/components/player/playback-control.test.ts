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
    playback: {
      playbackStartedAt: '2020-11-22T18:10:06.431Z',
      skippedMs: 0,
    },
  }

  const playbackState = (position: number, current_track: Spotify.Track): Spotify.PlaybackState =>
    ({
      position,
      track_window: { current_track },
    } as Spotify.PlaybackState)

  it('returns true if the playback is inside acceptable boundary', () => {
    const track = { id: 'two' } as Spotify.Track
    const now = addSeconds(new Date(playlist.createdAt), 10)

    const isInSync = playbackInSync(playlist, playbackState(200, track), now)

    expect(isInSync).toBe(true)
  })

  it('works when tracks have been skipped before', () => {
    // we're on the second track
    const track = { id: 'two' } as Spotify.Track
    // 10 seconds have past since starting the playback
    const now = addSeconds(new Date(playlist.createdAt), 10)

    // but we've also skipped five seconds (maybe we skipped the first track five seconds before the end)
    const skippedPlaylist: Playlist = {
      ...playlist,
      playback: { ...playlist.playback, skippedMs: 5000 },
    }

    const isInSync = playbackInSync(skippedPlaylist, playbackState(5000, track), now)

    expect(isInSync).toBe(true)
  })

  it('returns false if the playback is behind the actual', () => {
    // We're still on the first track
    const track = { id: 'one' } as Spotify.Track
    // Even though 10 seconds have already past
    const now = addSeconds(new Date(playlist.createdAt), 10)

    const isInSync = playbackInSync(playlist, playbackState(200, track), now)

    expect(isInSync).toBe(false)
  })

  it('returns false if the current track is not in the playlist', () => {
    // We're still on the first track
    const track = { id: 'not-in-the-playlist' } as Spotify.Track
    const now = addSeconds(new Date(playlist.createdAt), 0)

    const isInSync = playbackInSync(playlist, playbackState(0, track), now)

    expect(isInSync).toBe(false)
  })
})

describe('playbackOffset()', () => {
  const playlist: Playlist = {
    createdAt: '2020-11-22T18:10:06.431Z',
    tracks: [
      // Each track is 10 seconds long
      { id: 'one', name: 'One', duration_ms: 10000, artists: [] },
      { id: 'two', name: 'Two', duration_ms: 10000, artists: [] },
      { id: 'three', name: 'Three', duration_ms: 10000, artists: [] },
    ],
    playback: {
      playbackStartedAt: '2020-11-22T18:10:06.431Z',
      skippedMs: 0,
    },
  }

  it('returns the remaining tracks and the offset into the current track', () => {
    const { offset, remainingTracks } = playbackOffset(
      playlist,
      addSeconds(new Date(playlist.createdAt), 15),
    )

    expect(remainingTracks).toEqual(playlist.tracks.slice(1))
    expect(offset).toBe(5000)
  })

  it('returns all tracks and 0 offset initially', () => {
    const { offset, remainingTracks } = playbackOffset(playlist, new Date(playlist.createdAt))

    expect(remainingTracks).toEqual(playlist.tracks)
    expect(offset).toBe(0)
  })

  it('returns no remaining tracks and any offset when playback is over', () => {
    const { offset, remainingTracks } = playbackOffset(
      playlist,
      addSeconds(new Date(playlist.createdAt), 31),
    )

    expect(remainingTracks).toEqual([])
    expect(offset).toBe(1000)
  })

  it('returns correct amount when some time has been skipped forward', () => {
    const skippedPlaylist: Playlist = {
      ...playlist,
      // We've skipped 5 seconds forward
      playback: { ...playlist.playback, skippedMs: 5000 },
    }
    const { offset, remainingTracks } = playbackOffset(
      skippedPlaylist,
      // Ten seconds after the playback started
      addSeconds(new Date(playlist.createdAt), 10),
    )

    expect(remainingTracks).toEqual(playlist.tracks.slice(1))
    expect(offset).toBe(5000)
  })
})

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000)
}
