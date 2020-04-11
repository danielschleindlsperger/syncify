import React from 'react'
import { render } from '@testing-library/react'
import { Userlist } from './user-list'
import { User } from '../../types'

describe('<Userlist />', () => {
  it('renders a list of users', () => {
    const users: User[] = [
      {
        id: '123123',
        name: 'Hans Dampf',
        avatar: 'http://img.com',
      },
      {
        id: '3711249z8',
        name: 'Sepp',
        avatar: undefined,
      },
    ]

    const { getAllByRole } = render(<Userlist users={users} />)

    const listItems = getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
  })

  it('renders nothing if no users are in the list', () => {
    const { container } = render(<Userlist users={[]} />)
    expect(container).toBeEmpty()
  })
})
