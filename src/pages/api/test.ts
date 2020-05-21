import { NowRequest, NowResponse } from '@now/node'
import { scheduleSongChange } from '../../queue'

let count = 0

export default async function (req: NowRequest, res: NowResponse) {
  await scheduleSongChange({
    delaySeconds: 3,
    roomId: 'asdf-asdf-asdf-asdf',
    nextSongId: '98a9hf9hsaff9d',
    roomEventCount: count++,
  })

  return res.json({ msg: 'ok' })
}
