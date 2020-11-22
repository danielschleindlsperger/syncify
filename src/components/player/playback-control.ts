import { dropWhile, reduce, reduced } from 'ramda'
import { Playlist, PlaylistTrack } from '../../types'

// If the current playback is before (for whatever reason) or behind the real playback by more than
// five seconds it's considered unacceptable and we have to resync
const ACCEPTABLE_OFFSET_MS = 5000

export function playbackInSync(
  playlist: Playlist,
  currentPlayback: { trackOffset: number; track: Spotify.Track },
  now = new Date(),
): boolean {
  const { trackOffset, track } = currentPlayback
  const currentTrackId = track.linked_from?.id ?? track.id

  if (!currentTrackId) return false

  // Check what the current offset (in millis) should be
  const start = new Date(playlist.createdAt)
  const plannedOffset = now.getTime() - start.getTime()

  // Check what the actual offset is
  const actualOffset = reduce(
    (offset, t) => {
      if (t.id === currentTrackId) {
        // we found the current track
        return reduced<number>(offset + trackOffset)
      }
      return offset + t.duration_ms
    },
    0,
    playlist.tracks,
  )

  const diff = Math.abs(plannedOffset - actualOffset)

  return diff <= ACCEPTABLE_OFFSET_MS
}

export type PlaybackOffset = {
  remainingTracks: PlaylistTrack[]
  /**
   * Playback offset in the currently playing track
   */
  offset: number
}

export const playbackOffset = (playlist: Playlist): PlaybackOffset => {
  let offset = Date.now() - Date.parse(playlist.createdAt)

  const remainingTracks = dropWhile((t) => {
    const trackIsOver = offset > t.duration_ms
    if (trackIsOver) {
      offset = offset - t.duration_ms
      return true
    }
    return false
  }, playlist.tracks)

  return { remainingTracks, offset }
}
