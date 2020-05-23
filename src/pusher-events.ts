export type RoomEvent = typeof SkippedTrack | typeof UserLiked | typeof TrackChanged

// explicit track skip of user with the current, spotify queue based implementation of playback
export type SkippedTrackPayload = { triggeredBy: string }
export const SkippedTrack = 'room:skip-track'

export const UserLiked = 'client-user_liked'
export type UserLikedPayload = {
  name: string
  track: LikedTrack
}
type LikedTrack = {
  name: string
  byline: string
}

// server event for the client to skip the track to the specified one
export const TrackChanged = 'room:track-skipped'
export type TrackChangedPayload = {
  trackId: string
}
