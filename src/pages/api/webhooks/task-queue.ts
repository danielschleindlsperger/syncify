import { NextApiRequest, NextApiResponse } from 'next'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  // TODO: method

  console.log(req.body)
  console.log(req.headers)

  const eta: any = req.headers['x-cloudtasks-tasketa']

  const diff = Date.now() - parseInt(eta, 10) * 1000

  console.log({ diff })

  return res.json({ foo: 'bar', diff })
}
