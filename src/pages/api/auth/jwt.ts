import jwt, { TokenExpiredError } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined')
}

type TokenUser = { id: string; access_token: string; refresh_token: string }

export const signToken = (user: TokenUser): string =>
  jwt.sign(
    {
      user,
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '30min' },
  )

type SuccessfulVerification = {
  status: 'success'
  user: TokenUser
}

type RejectedVerification = {
  status: 'rejected'
  reason: string
}

type FailedVerification = {
  status: 'failed'
  error: Error
}

type VerificationResult = SuccessfulVerification | RejectedVerification | FailedVerification

export const verifyToken = (token: string): VerificationResult => {
  try {
    const user = (jwt.verify(token, JWT_SECRET) as any).user as TokenUser
    return { status: 'success', user }
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      return { status: 'rejected', reason: e.message }
    } else {
      return { status: 'failed', error: e }
    }
  }
}
