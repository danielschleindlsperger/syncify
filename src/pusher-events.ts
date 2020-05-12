export type RoomEvent = typeof SkippedTrack

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
