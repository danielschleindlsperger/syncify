import React from 'react'
import { storiesOf } from '@storybook/react'
import { Roomlist } from './room-list'
import { Room } from '../../types'

storiesOf('Room list', module)
  .add('Five active rooms', () => <Roomlist rooms={rooms.slice(0, 5)} />)
  .add('20 active Rooms', () => <Roomlist rooms={rooms.slice(0, 20)} />)
  .add('20 active rooms with some placeholders', () => {
    const placeholderIds = [1, 3, 4, 6, 14, 18]
    const roomsWithPlaceholders = rooms.map(({ cover_image, ...r }, i) => ({
      ...r,
      cover_image: placeholderIds.includes(i) ? undefined : cover_image,
    }))
    return <Roomlist rooms={roomsWithPlaceholders} />
  })
  .add('No active rooms', () => <Roomlist rooms={[]} />)

const rooms: Omit<Room, 'playlist'>[] = [
  {
    id: '37i9dQZF1DX8bHrtXvaJhx',
    name: 'Das Beste des Jahrzehnts für dich',
    cover_image: 'https://i.scdn.co/image/ab67706f00000002321fb0e40be7a2c38693970b',
  },
  {
    id: '37i9dQZF1Et9MNyljBb7UF',
    name: 'Your Top Songs 2019',
    cover_image: 'https://lineup-images.scdn.co/your-top-songs-2019_DEFAULT-en.jpg',
  },
  {
    id: '37i9dQZF1EfZRP25LvL4Cf',
    name: 'Your Daily Drive',
    cover_image: 'https://daily-mix.scdn.co/covers/gift_sets/YDD/YDD_DE_evening.jpg',
  },
  {
    id: '72cxf8xXRQOZiYbSJR71io',
    name: 'COLORS - ALL SHOWS',
    cover_image: 'https://i.scdn.co/image/ab67706c0000da849a3eab40ad7a3b901c93e5d9',
  },
  {
    id: '37i9dQZF1DWTTthpScXd3v',
    name: 'This Is David Bowie',
    cover_image: 'https://i.scdn.co/image/ab67706f000000027d0577e4b1b8e8ec9e82019a',
  },
  {
    id: '37i9dQZF1DWXEb535ZGeRC',
    name: 'This Is Paul Simon',
    cover_image: 'https://i.scdn.co/image/ab67706f00000002287b59a9f8fcbbf2e1edfb88',
  },
  {
    id: '3GT3Fr4CXUhOlIDKe0v1aY',
    name: 'Freaky Friday',
    cover_image: 'https://i.scdn.co/image/ab67706c0000da8404ea3b74b82bc364593c69eb',
  },
  {
    id: '1oY4LpUskXYJoFhuL7L3o2',
    name: 'Kochtopfmusik',
    cover_image:
      'https://mosaic.scdn.co/640/ab67616d0000b27340817045256bc4d693640a49ab67616d0000b2734e9c052eb49b8e7c7c9f01b7ab67616d0000b27373cdd62ddbe4bf190ad0c159ab67616d0000b273e62d30265e9aa461ff7a7712',
  },
  {
    id: '0xpQXEY5JX6gfLxxvCf1wz',
    name: 'Searching for Sugar Man',
    cover_image: 'https://i.scdn.co/image/ab67706c0000da842583df3a5dbfc5646f03347a',
  },
  {
    id: '28oY1vSsipRE5VOyLDQqed',
    name: "triple j's Like A Version",
    cover_image: 'https://i.scdn.co/image/ab67706c0000da84696a46d50931b2f9f8dc7dda',
  },
  {
    id: '7EQREJAnv8ws5UiCNDjnG5',
    name: 'GAPDH2',
    cover_image:
      'https://mosaic.scdn.co/640/8d35df482ac00f95dee3429fab1c46fd6cc97841ab67616d0000b2733629cc9ea87d11ba2270e742ab67616d0000b2737a47d3015e71ac29955528ffab67616d0000b273b5669f266523e1ff181caefb',
  },
  {
    id: '0jXjLSeVctLps6LLg3pSBQ',
    name: 'FROAT - CHILL MUSIC / ALL GENRES',
    cover_image: 'https://i.scdn.co/image/ab67706c0000da84bdea651ed890eb1378844511',
  },
  {
    id: '6rzPyDW6A0zi25oERHUpJV',
    name: 'Palatschinken',
    cover_image:
      'https://mosaic.scdn.co/640/ab67616d0000b2730d0b7334d2df814f4052c936ab67616d0000b27346ed71f4f0ab02c72179b15dab67616d0000b273e35e2e2a4bfa8a30a78fc532ab67616d0000b273fbfb68023efd979aec1cc925',
  },
  {
    id: '37i9dQZF1DX11WWTNSp4Dq',
    name: 'Fidi & Bumsi',
    cover_image: 'https://i.scdn.co/image/ab67706f00000002378071b01fafcd76f6e4a7fb',
  },
  {
    id: '486C2eAVdS2a2BueqruZkc',
    name: 'one-song-tester',
    cover_image: 'https://i.scdn.co/image/ab67616d0000b273e0b63c7689320145d3a8b875',
  },
  {
    id: '37i9dQZF1EiWAZodHSQlC9',
    name: 'Tastebreakers',
    cover_image: 'https://lineup-images.scdn.co/tastebreakers_DEFAULT-en.jpg',
  },
  {
    id: '37i9dQZF1EjhdhYlFCXQeH',
    name: 'Your Top Songs 2018',
    cover_image: 'https://lineup-images.scdn.co/your-top-songs-2018_DEFAULT-en.jpg',
  },
  {
    id: '0hV2U9AOD8EUEBpgimm1Cv',
    name: 'butterflies',
    cover_image: 'https://i.scdn.co/image/ab67706c0000da842d54d38681357e383804b841',
  },
  {
    id: '5Oxx7Jyed057mmWcQHJtgr',
    name: 'smoking mid',
    cover_image: 'https://i.scdn.co/image/ab67706c0000da847506d86bac4a2f6d5931c249',
  },
  {
    id: '3WDC3ZpktsADvjaAoTX1qL',
    name: 'Fwigb',
    cover_image:
      'https://mosaic.scdn.co/640/ab67616d0000b2735fcd513bb80440d503614f59ab67616d0000b273a97f35441b94ebc72d608e7aab67616d0000b273cbcff3421aff2297cc536bfcab67616d0000b273f552daab2bc3dc64d2c4c649',
  },
]
