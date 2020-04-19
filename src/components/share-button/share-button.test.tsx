import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import { ShareButton } from './share-button'

describe('<ShareButton />', () => {
  jest.useFakeTimers()

  const copySpy = jest.fn()
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: copySpy,
    },
  })
  it('copy current url to clipboard on click, shows a success icon and reverts to default icon after a while', async () => {
    copySpy.mockResolvedValue(undefined)

    const { getByText, getByTestId } = render(<ShareButton />)
    getByTestId('copy-button-idle-icon')
    const button = getByText(/share room/i)
    fireEvent.click(button)

    // await micro-task from promise based clipboard api
    await act(() => Promise.resolve())

    expect(copySpy).toHaveBeenCalledWith('http://localhost/')

    getByTestId('copy-button-success-icon')

    act(() => {
      jest.runAllTimers()
    })

    getByTestId('copy-button-idle-icon')
  })

  it('renders error icon and text for a while after error', async () => {
    copySpy.mockRejectedValue(new Error())

    const { getByText, getByTestId } = render(<ShareButton />)
    fireEvent.click(getByTestId('copy-button-idle-icon'))

    await act(() => Promise.resolve())

    expect(copySpy).toHaveBeenCalledWith('http://localhost/')

    getByText(/couldn't copy url/i)
    getByTestId('copy-button-error-icon')

    act(() => {
      jest.runAllTimers()
    })

    getByTestId('copy-button-idle-icon')
  })
})
