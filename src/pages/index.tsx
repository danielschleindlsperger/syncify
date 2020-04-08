import React from 'react'
import { AppUrl } from '../config'

export default () => {
  return (
    <div>
      <h1>Hello!</h1>
      <a
        href={AppUrl + '/rooms'}
        className="mt-4 inline-block bg-blue-700 text-gray-100 px-3 py-1 rounded-sm"
      >
        Find a room to join
      </a>
    </div>
  )
}
