import React from 'react'
import { Box } from '@chakra-ui/react'
import { storiesOf } from '@storybook/react'
import { Playlist, Playlist2 } from './playlist'
import { PlayerStoreProvider } from '../player'

type Playlist = import('../../types').Playlist

storiesOf('Playlist', module)
  .addDecorator((Story) => <PlayerStoreProvider>{Story()}</PlayerStoreProvider>)
  .add('Five songs', () => <Playlist playlist={mkPlaylist(upcomingTracks.slice(0, 5))} />)
  .add('One song', () => <Playlist playlist={mkPlaylist(upcomingTracks.slice(0, 1))} />)
  .add('No songs', () => <Playlist playlist={mkPlaylist([])} />)
  .add('50 songs', () => <Playlist playlist={mkPlaylist(upcomingTracks.slice(0, 50))} />)
  .add('Foo', () => (
    <Box mx="auto" maxWidth="800px">
      <Playlist2 items={tracks} />
    </Box>
  ))

const mkPlaylist = (tracks: any[]): Playlist => ({ tracks } as Playlist)

const tracks = [
  {
    id: '10ViidwjGLCfVtGPfdcszR',
    name: 'Home',
    artists: ['Edward Sharpe & The Magnetic Zeros'],
    coverArt: 'https://i.scdn.co/image/ab67616d0000b273905758fa52845a4b2dc6ffe3',
  },
  {
    id: '72NC9kHkFA7k98dE0t4xEX',
    name: 'Caroline',
    artists: ['High Tropics'],
    coverArt: 'https://i.scdn.co/image/ab67616d0000b273f2c11620d87212dc8c851cbd',
  },
  {
    id: '6lFZbCc7pn6Lme1NP7qQqQ',
    name: "You Can't Always Get What You Want",
    artists: ['The Rolling Stones'],
    coverArt: 'https://i.scdn.co/image/ab67616d0000b2732af30c881bb23cfb82a8cf99',
  },
  {
    id: '7oiZRx7OZbUAYUiYeFTXrf',
    name: 'Warm Animal',
    artists: ['Sure Sure'],
    coverArt: 'https://i.scdn.co/image/ab67616d0000b2733f9de2a1db5213ff8e3c0517',
  },
  {
    id: '5c3yxzuAvro7iJGABJppFm',
    name: 'Upside Down',
    artists: ['Jack Johnson'],
    coverArt: 'https://i.scdn.co/image/ab67616d0000b273f5c91b650e743cc514fb5288',
  },
]

const upcomingTracks = [
  {
    id: '5I4ipBNoOOXF20YY0pOjCx',
    name: 'A Spike Lee Joint (feat. Anthony Flammia)',
    duration_ms: 255213,
    artists: ['Flatbush Zombies', 'Anthony Flammia'],
  },
  {
    id: '3ESQn5H8yKg1cPcPnBr1w5',
    name: 'Leaned Out',
    duration_ms: 224534,
    artists: ['Inka', 'IAMDDB'],
  },
  {
    id: '1otG6j1WHNvl9WgXLWkHTo',
    name: 'After The Storm (feat. Tyler, The Creator & Bootsy Collins)',
    duration_ms: 207454,
    artists: ['Kali Uchis', 'Tyler, The Creator', 'Bootsy Collins'],
  },
  {
    id: '01bfHCsUTwydXCHP1VoLlI',
    name: 'Roll (Burbank Funk)',
    duration_ms: 191026,
    artists: ['The Internet'],
  },
  {
    id: '3T9ZFzbs6Jd5hgzHb9pfEE',
    name: 'Symbiose',
    duration_ms: 207500,
    artists: ['HYDE Beats', 'AK420'],
  },
  {
    id: '08N1SKhojfi4o59I4kVxjO',
    name: 'Wait for You',
    duration_ms: 210000,
    artists: ['Talos', 'Gabriella Vixen', 'Coops'],
  },
  {
    id: '5GHyzfneTedVYmD9k8cIUw',
    name: 'U Know What Time It Is',
    duration_ms: 187214,
    artists: ['Kunfu'],
  },
  {
    id: '3c27daCP7YuADzNuLj7dUy',
    name: 'Summertime (Reprise)',
    duration_ms: 125266,
    artists: ['DJ Jazzy Jeff & The Fresh Prince'],
  },
  {
    id: '1foIqCKbgzB1czR3SgoEjK',
    name: "Mind Blowin' (feat. Vinia Mojica)",
    duration_ms: 304933,
    artists: ['Pete Rock', 'Vinia Mojica'],
  },
  {
    id: '72kOjWn16LSJt1WlgJ9AWY',
    name: "I'd Love To Stay",
    duration_ms: 246400,
    artists: ['Sweeps', 'Semp Uru'],
  },
  {
    id: '6Qnq5isnfZv0DGZyA5khVn',
    name: 'Check the Vibe',
    duration_ms: 211386,
    artists: ['Dred Scott', 'Adriana Evans'],
  },
  {
    id: '5CjV03o6e1Ja0zLdttXVji',
    name: "Gwendolynn's Apprehension",
    duration_ms: 225533,
    artists: ['Mick Jenkins'],
  },
  {
    id: '5jiEPRJV2XmvQyn3gIgPGW',
    name: 'Yes You Are',
    duration_ms: 141627,
    artists: ['Claire Reneé'],
  },
  {
    id: '0BtAjIb65mVh5Te45PUOdR',
    name: 'Sixty-Seven Turbo Jet',
    duration_ms: 199436,
    artists: ['Curren$y', 'Harry Fraud'],
  },
  {
    id: '0NTuU9JZH0ynmCr63rtZVw',
    name: 'Headspace',
    duration_ms: 161582,
    artists: ['Gavlyn', 'DJ Hoppa'],
  },
  { id: '3qSH4NSYYOMkFTGwvGA91x', name: 'Avenue', duration_ms: 214240, artists: ['H.E.R.'] },
  { id: '4UNoouFjhlmatlWgXP4DhS', name: 'Skyline', duration_ms: 249650, artists: ['FKJ'] },
  {
    id: '12whPvsw1oxuuwlD27mTeb',
    name: 'G35',
    duration_ms: 264000,
    artists: ['YGTUT', 'Isaiah Rashad'],
  },
  {
    id: '5liaFrDdoINOvJ4B8WDPa1',
    name: 'Romantic (feat. Soulive)',
    duration_ms: 338453,
    artists: ['Goapele', 'Soulive'],
  },
  {
    id: '4vyrDnOQW9O00yRamiZmdv',
    name: 'The Muse',
    duration_ms: 255093,
    artists: ['Samsonyte', 'T Gallardo'],
  },
  {
    id: '0UDsN1Fosq7vSJr8lPOGZI',
    name: 'Strictly 4 All',
    duration_ms: 242526,
    artists: ['Teknical Development.is', 'Figub Brazlevic', 'Wanja Janeva'],
  },
  {
    id: '1OLeA7zpNAHkHOzBwjYfy7',
    name: 'Rocket Science',
    duration_ms: 248433,
    artists: ['Joyce Wrice', 'Kay Franklin'],
  },
  {
    id: '0s39srtdNSrRz6bRMkOrp3',
    name: 'Shit, Damn, Motherfucker',
    duration_ms: 314165,
    artists: ["D'Angelo"],
  },
  { id: '2bmbyejXRdhK9fNsIIqJVa', name: 'Do You Know', duration_ms: 203573, artists: ['Total'] },
  {
    id: '38D2WgRFJWdZQYwsGKP9bf',
    name: "Let's Get It On",
    duration_ms: 269693,
    artists: ['King Tee', 'Nikke Nicole'],
  },
  {
    id: '1cCbJQuTw67CGjZwP35nz4',
    name: 'Ghetto Soldiers',
    duration_ms: 337733,
    artists: ['3X Krazy'],
  },
  {
    id: '3zRkKslMBFtbuGBVkrxkqb',
    name: "Get Ta Steppin'",
    duration_ms: 277066,
    artists: ['Hi-Tek', 'Mos Def', 'Vinia Mojica'],
  },
  {
    id: '6lzLjIOyWTyTJvk0jraYee',
    name: "Could've Been (feat. Bryson Tiller)",
    duration_ms: 248466,
    artists: ['H.E.R.', 'Bryson Tiller'],
  },
  {
    id: '57Sl1FqwJ6EJ515ReJpQtO',
    name: "Still Slummin'",
    duration_ms: 208385,
    artists: ['Lute'],
  },
  {
    id: '2olXtgowd7lpfOoJ25x6mn',
    name: 'Objects in the Mirror',
    duration_ms: 259146,
    artists: ['Mac Miller'],
  },
  {
    id: '5MP0Kp8RI5kOqZOUHU8b6C',
    name: 'Nowhere (I can go)',
    duration_ms: 327786,
    artists: ['Clara Hill', 'Atjazz'],
  },
  {
    id: '593W4qZOwwdqF6YnimJjL6',
    name: 'Doves In The Wind',
    duration_ms: 266080,
    artists: ['SZA', 'Kendrick Lamar'],
  },
  { id: '1iXtpeHC0i6c7JBrKi3yaq', name: 'Use Your Heart', duration_ms: 289000, artists: ['SWV'] },
  {
    id: '7eFSQgm9Qtsn7Y9jwPc1iB',
    name: 'I Will Never Know (feat. Moonchild)',
    duration_ms: 276333,
    artists: ['Tall Black Guy', 'Moonchild'],
  },
  {
    id: '6zky7teFpr3iM6CFMUTuad',
    name: 'Yes You Are',
    duration_ms: 141627,
    artists: ['Claire Reneé'],
  },
  {
    id: '39wzkLXh3LZypQmWATLZ7j',
    name: 'Fanatic',
    duration_ms: 252826,
    artists: ['Vivian Green'],
  },
  { id: '682oUxtVEKCMtsQ5nISbNY', name: 'Ride', duration_ms: 308800, artists: ['Groove Theory'] },
  { id: '1BttsBZBt3GWGJ2Gpkwxyl', name: 'If Only', duration_ms: 201333, artists: ['Raveena'] },
  {
    id: '4TEHRuLkEYD2Te0HkEibvP',
    name: '• Tell Me',
    duration_ms: 223840,
    artists: ['Jazz Cartier', 'River Tiber'],
  },
  { id: '0w4cAGIHjWLypKaMFm6xL2', name: 'Tôzen', duration_ms: 170666, artists: ['Gyvus'] },
  {
    id: '5YwBsvATEe1UAZuo377KfA',
    name: 'PINK FLOWER (feat. Dana Williams & Julian Bell)',
    duration_ms: 173693,
    artists: ['Rejjie Snow', 'Dana Williams', 'Julian Bell'],
  },
  {
    id: '419UNd2y3sdmXuy6zVT7gN',
    name: "That's Reality",
    duration_ms: 110109,
    artists: ['Jazz Liberatorz'],
  },
  {
    id: '50iMqcA5CScase0a57vDtR',
    name: 'Lighthouse',
    duration_ms: 156404,
    artists: ['Poldoore'],
  },
  {
    id: '71lyUtIPCMAYjTwwwxy2jW',
    name: '4r Da Squaw',
    duration_ms: 232571,
    artists: ['Isaiah Rashad'],
  },
  {
    id: '6H76vWqOeYZx89W2Z4q2oW',
    name: 'Afternoon Soul',
    duration_ms: 255978,
    artists: ['Gramatik'],
  },
  {
    id: '6ke49Le8xVT5RCEqldNkEy',
    name: 'Ruhe - Figub Brazlevic Remix Instrumental',
    duration_ms: 164403,
    artists: ['Imun', 'Figub Brazlevic'],
  },
  {
    id: '5uK7sOLgAnysmdwPs4NZhO',
    name: "Didn't Cha Know",
    duration_ms: 238733,
    artists: ['Erykah Badu'],
  },
  {
    id: '4F9qZ3PxXG9qKGtrrelZaB',
    name: 'In My Mind - Reprise',
    duration_ms: 204332,
    artists: ['Lenzman', 'IAMDDB'],
  },
  {
    id: '5U72lXbXuesY17sHjRD7PF',
    name: 'Good Morning',
    duration_ms: 208134,
    artists: ['Joyce Wrice', 'Jamma-Dee'],
  },
  {
    id: '2LdbF40p7euLqEsaxpt70i',
    name: 'Bernal Heights',
    duration_ms: 275874,
    artists: ['Duckwrth'],
  },
]
