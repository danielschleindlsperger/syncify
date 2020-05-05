export type RoomEvent = typeof SkippedTrack

export type SkippedTrackPayload = { triggeredBy: string }
export const SkippedTrack = 'room:skip-track'
