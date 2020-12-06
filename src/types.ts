export type SpotifyUserID = string
export type SpotifyTrackID = string
export type UUID = string
export type URL = string

export type Room = Readonly<{
  id: UUID
  name: string
  /**
   * Absolute URL to the rooms title image.
   */
  cover_image: string | undefined
  /**
   * Determines whether this room is listed on overview pages, renders search engine information.
   * In general: If this room can be found without knowing the exact URL.
   */
  publiclyListed: boolean
  playlist: Playlist
  admins: { id: SpotifyUserID }[]
}>

export type Playlist = Readonly<{
  id: UUID
  tracks: PlaylistTrack[]
  /**
   * ISO-8601 date string
   */
  createdAt: string // TODO: Try out opaque types here
  playback: Playback
}>

export type Playback = Readonly<{
  id: UUID
  /**
   * ISO-8601 date string. Marks the point in time when playback started.
   * This MIGHT be the same date as the `createdAt` timestamp of the playlist (or the room)
   * Used to compute the current offset in the playback for people joining the room, etc
   *
   * `undefined` in case playback hasn't started yet.
   */
  playbackStartedAt: string | undefined

  /**
   * Number of milliseconds that have been forwarded (i.e. when skipping the current track)
   * In conjunction with the current date, the `playbackStartedAt` date and the tracks of the playlist
   * this can be used to implement stateless playback management.
   *
   * @default 0
   */
  skippedMs: number
}>

export type PlaylistTrack = Readonly<{
  id: SpotifyTrackID
  name: string
  duration_ms: number
  artists: string[]
}>

export type User = Readonly<{
  id: SpotifyUserID
  name: string
  avatar: URL | undefined
}>

// What a user gets when they retrieve their account info
export type ClientAuthUser = User & Readonly<{ access_token: string }>
