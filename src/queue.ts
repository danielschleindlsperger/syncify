import { CloudTasksClient } from '@google-cloud/tasks'
import { randomString } from './utils/random'
import { Client } from 'pg'
import { findRoom, updateRoom } from './db'

const baseUrl =
  process.env.WEBHOOK_BASE_URL ?? process.env.APP_URL ?? 'https://syncify-daniel.serveo.net'
const url = baseUrl + '/api/webhooks/task-queue'
const project = 'syncify'
// TODO: europe-west1 is belgium, use queue in frankfurt: europe-west3
const location = 'europe-west1'

const b64creds = process.env.GCLOUD_CREDENTIALS!

const client = new CloudTasksClient({
  credentials: JSON.parse(Buffer.from(b64creds, 'base64').toString()),
})

type ScheduleTaskPayload<T = any> = {
  delaySeconds?: number
  queue: string
  payload?: T
}

export async function scheduleTask({
  delaySeconds,
  queue,
  payload,
}: ScheduleTaskPayload): Promise<{ taskId: string }> {
  const parent = client.queuePath(project, location, queue)
  const taskId = await randomString()
  const body = {
    ...payload,
    taskId,
  }

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url,
      body: Buffer.from(JSON.stringify(body)).toString('base64'),
    },
    scheduleTime:
      delaySeconds !== undefined
        ? {
            seconds: Math.floor(Date.now() / 1000 + delaySeconds),
          }
        : undefined,
  } as const

  await client.createTask({ parent, task })
  return { taskId }
}

/*
The general idea:

- Schedule a song change by scheduling a task with the properties:
  - delaySeconds: The delay in seconds until the song change
  - roomId: Id of the room to change the song in
  - songId: Id of the song to change to
- The task will also include the timestamp of creation (or a uuid?)
- After the task is scheduled the timestamp/uuid of this task (i.e. the next task) will be persisted with the room in the database
- When the task is executed we ask the database if the room's next scheduled song change is still the one with the task's timestamp/uuid
  - If no, abort
  - If yes, trigger the song change and schedule the song change with the same principle

- If a song change was triggered outside the regular schedule, the timestamp/uuid check is disabled and the song is changed immediately. Afterward the next song change is scheduled.

 */

type ScheduleSongChangePayload = {
  delaySeconds?: number
  roomId: string
  trackId: string
}

export async function scheduleSongChange(
  client: Client,
  { delaySeconds, ...body }: ScheduleSongChangePayload,
): Promise<void> {
  const { taskId } = await scheduleTask({
    queue: 'song-changed-test-queue',
    delaySeconds,
    payload: { ...body, createdTimestamp: Date.now() },
  })
  console.log(`scheduled song "${body.trackId}" in room "${body.roomId}"`)

  const room = await findRoom(client, body.roomId)
  if (!room) throw new Error(`No room with id ${body.roomId} found. Song scheduling broke.`)
  await updateRoom(client, {
    ...room,
    playlist: { ...room.playlist, nextTrackChangeTaskId: taskId },
  })
}
