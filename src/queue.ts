import { CloudTasksClient } from '@google-cloud/tasks'

const baseUrl = 'https://7e5c2726.eu.ngrok.io'
const url = baseUrl + '/api/webhooks/task-queue'
const project = 'syncify'
const location = 'europe-west1'

const b64creds = process.env.GCLOUD_CREDENTIALS!

const client = new CloudTasksClient({
  credentials: JSON.parse(Buffer.from(b64creds, 'base64').toString()),
})

type ScheduleTaskPayload<T = any> = {
  delaySeconds?: number
  queue: string
  body?: T
}

export async function scheduleTask({
  delaySeconds,
  queue,
  body,
}: ScheduleTaskPayload): Promise<void> {
  const parent = client.queuePath(project, location, queue)

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url,
      body: body && Buffer.from(JSON.stringify(body)).toString('base64'),
    },
    scheduleTime:
      delaySeconds !== undefined
        ? {
            seconds: Math.floor(Date.now() / 1000 + delaySeconds),
          }
        : undefined,
  } as const

  await client.createTask({ parent, task })
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
  roomEventCount: number
  roomId: string
}

export async function scheduleSongChange({
  delaySeconds,
  ...body
}: ScheduleSongChangePayload): Promise<void> {
  await scheduleTask({
    queue: 'song-changed-test-queue',
    delaySeconds,
    body: { ...body, createdTimestamp: Date.now() },
  })
}
