export type RoomEvent = typeof UserLiked | typeof TrackChanged

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
export const TrackChanged = 'room:track-changed'
export type TrackChangedPayload = {
  trackId: string
}
