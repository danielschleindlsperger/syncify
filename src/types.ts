export type Room = Readonly<{
  id: string
  name: string
  cover_image: string | undefined
  publiclyListed: boolean
  playlist: Playlist
}>

export type Playlist = Readonly<{
  tracks: PlaylistTrack[]
  // ISO-8601 date string
  // This timestamp is expecially important here since it allows us to compute the current time offset in the playlist.
  createdAt: string
}>

export type Song = Readonly<{
  // Spotify id, can be used to create a Spotify URI in the format "spotify:track:{id}"
  id: string
}>

export type PlaylistTrack = Readonly<{
  id: string
  name: string
  duration_ms: number
  artists: string[]
}>

export type User = Readonly<{
  id: string
  name: string
  avatar: string | undefined
}>

// what a user get when they retrieve their account info
export type ClientAuthUser = User & Readonly<{ access_token: string }>
