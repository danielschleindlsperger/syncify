import { signToken, AuthCookieName } from '../src/auth'
import { login } from './helpers/login'

// E2E Testing TODO:
// - test database with reset between each test
//   - Also setup test database on CI: https://help.github.com/en/actions/configuring-and-managing-workflows/creating-postgresql-service-containers
// - "clean slate" Spotify Testing account: Delete all playlists before each Test run and create a fixed set of playlists programmatically

describe('Create Room', () => {
  it('can create a new room', async () => {
    await login()

    const roomName = 'test-room'

    await browser.url('/rooms/create')
    await $('input[type="text"]').then((input) => input.setValue(roomName))
    await $('button*=Create').then((input) => input.click())

    await (await $(`h1*=${roomName}`)).waitForExist()
    expect(await browser.getTitle()).toMatch('test-room')

    // await browser.waitUntil(wait(30000))
  })
})

const wait = (n: number) => {
  const start = Date.now()
  return () => Promise.resolve(Date.now() - start > n)
}
