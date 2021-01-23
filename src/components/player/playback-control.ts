import { dropWhile, reduce, reduced } from 'ramda'
import { Playlist, PlaylistTrack, Room } from '../../types'

// If the current playback is before (for whatever reason) or behind the real playback by more than
// five seconds it's considered out-of-sync and we have to resync
const ACCEPTABLE_OFFSET_MS = 5000

/**
 * Given a playlist object and the Spotify player's current playback object, determine if the playback
 * is still in sync (within a margin).
 */
export function playbackInSync(
  playlist: Playlist,
  playbackState: Spotify.PlaybackState,
  now = new Date(),
): boolean {
  const { position, track_window } = playbackState
  const { current_track } = track_window
  const currentTrackId = current_track.linked_from?.id ?? current_track.id

  if (!currentTrackId) return false

  // Check what the current offset (in millis) should be
  const start = new Date(playlist.playback.playbackStartedAt)
  // TODO: incorporate skippedMs
  const plannedOffset = now.getTime() - start.getTime()

  // Check what the actual offset is
  const actualOffset = reduce(
    (offset, t) => {
      if (t.id === currentTrackId) {
        // we found the current track
        return reduced<number>(offset + position)
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
   * Playback offset in the currently playing track in milliseconds.
   */
  offset: number
}

/**
 * Given the static playlist of a room determine the remaining tracks (including the current track)
 * as well as the offset in the current track.
 */
export const playbackOffset = (playlist: Playlist, now = new Date()): PlaybackOffset => {
  let offset = now.getTime() - Date.parse(playlist.createdAt) + playlist.playback.skippedMs

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

/**
 * Send API request to skip the playback for all users in a room to a track.
 *
 * @param room
 * @param toTrackId Track to skip to. If omitted, skips to next track.
 */
export const skipTrack = async (room: Room, toTrackId?: string) => {
  const query = { 'to-track': toTrackId }
  const queryString = Object.entries(query)
    .filter(([_param, value]) => value !== undefined)
    .map(([param, value]) => `${param}=${value}`)
    .join('&')
  const url = `/api/rooms/${room.id}/skip-track?${queryString}`

  await window.fetch(url.toString(), { method: 'POST' })
}
