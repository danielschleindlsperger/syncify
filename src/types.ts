export type Room = Readonly<{
  roomId: string
  roomName: string
  /**
   * Absolute URL to the rooms title image.
   */
  roomCoverImage: string | undefined
  /**
   * Determines whether this room is listed on overview pages, renders search engine information.
   * In general: If this room can be found without knowing the exact URL.
   */
  roomPubliclyListed: boolean
  roomPlaylist: Playlist
  roomPlayback: Playback
  // admins: { id: string }[]
}>

export type Playback = Readonly<{
  /**
   * ISO-8601 date string. Marks the point in time when playback started.
   * This MIGHT be the same date as the `createdAt` timestamp of the playlist (or the room)
   * Used to compute the current offset in the playback for people joining the room, etc
   */
  playbackStartedAt: string
  /**
   * Number of milliseconds that have been forwarded (i.e. when skipping the current track)
   * In conjunction with the current date, the `playbackStartedAt` date and the tracks of the playlist
   * this can be used to implement stateless playback management.
   */
  playbackSkippedMs: number
}>

export type Playlist = Readonly<{
  playlistTracks: PlaylistTrack[]
}>

export type PlaylistTrack = Readonly<{
  trackId: string
  trackName: string
  trackDurationMs: number
  trackArtists: Artist[]
}>

export type Artist = Readonly<{
  artistId: string
  artistName: string
}>

export type User = Readonly<{
  id: string
  name: string
  avatar: string | undefined
}>

// What a user gets when they retrieve their account info
export type ClientAuthUser = User & Readonly<{ access_token: string }>
