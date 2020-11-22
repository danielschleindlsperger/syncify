declare namespace Spotify {
  interface Track {
    // These properties are used for track relinking:
    // The availability of a track depends on the country registered in the user’s Spotify profile settings.
    // Often Spotify has several instances of a track in its catalogue, each available in a different set of markets.
    // This commonly happens when the track the album is on has been released multiple times under different licenses in different markets.
    // These tracks are linked together so that when a user tries to play a track that isn’t available in their own market,
    // the Spotify mobile, desktop, and web players try to play another instance of the track that is available in the user’s market.
    // IMPORTANT: If you plan to do further operations on tracks (for example, removing the track from a playlist or saving it to “Your Music”),
    // it is important that you operate on the ** original ** track id found in the`linked_from` object.Using the ID of the linked track returned at the root level will likely return an error or other unexpected result.
    // From: https://developer.spotify.com/documentation/general/guides/track-relinking-guide/
    is_playable: boolean
    linked_from_uri?: string
    linked_from?: {
      id: string
      uri: string
    }
  }
}
