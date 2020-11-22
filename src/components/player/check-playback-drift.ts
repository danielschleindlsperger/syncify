import { reduce, reduced } from 'ramda'
import { Playlist } from '../../types'

// TODO: define an acceptable delta
const ACCEPTABLE_OFFSET_MS = 3000 // three seconds

export function playbackInSync(
  playlist: Playlist,
  currentPlayback: { trackOffset: number; track: Spotify.Track },
  now = new Date(),
): boolean {
  const { trackOffset, track } = currentPlayback
  const currentTrackId = track.linked_from?.id ?? track.id

  if (!currentTrackId) return false

  // 1. Check what the current offset (in millis) should be
  const start = new Date(playlist.createdAt)
  const plannedOffset = now.getTime() - start.getTime()

  // 2. Check what the actual offset is
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
