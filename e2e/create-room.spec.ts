import { login } from './helpers/login'

// E2E Testing TODO:
// - test database with reset between each test
// - "clean slate" Spotify Testing account: Delete all playlists before each Test run and create a fixed set of playlists programmatically

describe('can create a new room', () => {
  it('from a personal playlist', async () => {
    await login()

    const roomName = 'test-room'

    await browser.url('/rooms/create')

    await $('button*=Personal Playlist').then((btn) => btn.click())
    await $('button*=Next').then((btn) => btn.click())

    await $('button[data-testid="select-playlist"]').then((btn) => btn.click())
    await $('[data-testid="playlist-tracks"]').then((x) => x.waitForExist())
    await $('button*=Next').then((btn) => btn.click())

    await $('input[type="text"]').then((input) => input.setValue(roomName))
    await $('button*=Create').then((input) => input.click())

    await (await $(`h1*=${roomName}`)).waitForExist()
    expect(await browser.getTitle()).toMatch('test-room')
  })
})
