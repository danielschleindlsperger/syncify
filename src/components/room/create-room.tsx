import React from 'react'
import { useRouter } from 'next/router'
import { GraphQLClient } from 'graphql-request'
import { getSdk } from '../../generated/graphql'
import { GraphQlUrl } from '../../config'

const sdk = getSdk(new GraphQLClient(GraphQlUrl, { credentials: 'include' }))

export const CreateRoom = (props: React.HTMLAttributes<HTMLElement>) => {
  const router = useRouter()
  const [name, setName] = React.useState('')

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    try {
      const { createRoom } = await sdk.createRoom({ input: { room: { name } } })
      const id = createRoom?.room?.id

      if (id) {
        router.push(`/rooms/${id}`)
      } else {
        throw new Error('id not defined')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div {...props}>
      <form onSubmit={handleSubmit}>
        <input type="text" onChange={evt => setName(evt.target.value)} />
      </form>
    </div>
  )
}
