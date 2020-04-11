import React from 'react'
import { storiesOf } from '@storybook/react'
import { Userlist } from './user-list'
import { User } from '../../types'

const users: User[] = [
  {
    name: 'Hans Dampf',
    avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_3.jpg',
  },
  {
    name: 'Seppl',
    avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_10.gif',
  },
  { name: 'Janina Theissen', avatar: undefined },
  {
    name: 'Raisel Jessika',
    avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_13.jpg',
  },
  { name: 'René Koertig', avatar: undefined },
  { name: 'Peter Hartmann', avatar: undefined },
  { name: 'ollipolli71', avatar: undefined },
  {
    name: 'Israa Katharina',
    avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_6.gif',
  },
  {
    name: 'Vlatka Kunala',
    avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_267.jpg',
  },
  {
    name: 'Jon Gold',
    avatar: 'https://pbs.twimg.com/profile_images/1232496435595116544/rMoyoHfL_400x400.jpg',
  },
  { name: 'Captain Cool', avatar: undefined },
  {
    name: 'Lars Hupel',
    avatar: 'https://pbs.twimg.com/profile_images/1151195645254017024/OBBnDDwX_400x400.jpg',
  },
  {
    name: 'Ryan Florence',
    avatar: 'https://pbs.twimg.com/profile_images/1166030195834273794/pBb6hjVb_400x400.jpg',
  },
  {
    name: 'Sara Drasner',
    avatar: 'https://pbs.twimg.com/profile_images/1225613270205091840/NyoNYuhC_400x400.jpg',
  },
  { name: 'huabersepp64', avatar: undefined },
  {
    name: 'John Lockedown',
    avatar: 'https://pbs.twimg.com/profile_images/1216111940625485826/JzDs-ms6_400x400.jpg',
  },
  { name: 'gazzle95', avatar: undefined },
  {
    name: 'Tommy Schmidt',
    avatar: 'https://pbs.twimg.com/profile_images/829365023051018240/QqauYoNc_400x400.jpg',
  },
  {
    name: 'Ken Wheeler',
    avatar: 'https://pbs.twimg.com/profile_images/1212522194871496704/xO2k6ket_400x400.jpg',
  },
].map((u, i) => ({ ...u, id: i.toString() }))

storiesOf('Chat/Userlist', module)
  .add('Five Users', () => <Userlist users={users.slice(0, 5)} />)
  .add('Five users, no avatars', () => (
    <Userlist users={users.filter((u) => !u.avatar).slice(0, 5)} />
  ))
  .add('20 Users', () => <Userlist users={users} />)
  .add('No Users', () => <Userlist users={[]} />)
