import React from 'react'
import Link from 'next/link'
import cx from 'classnames'
import { Button } from '../button'

export const LoginRequired = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <div className={cx(className, 'p-4 mt-8 max-w-screen-lg mx-auto')} {...props}>
    <h1 className="text-3xl font-bold">Login required</h1>
    <h2 className="text-l font-bold mt-4">
      It seems you're not logged in. Either your session has run out or you're new to Syncify!
    </h2>
    <p className="mt-4">
      Anyway, to use Syncify you have to log in with by clicking the button below. This will take
      you to Spotify where you might need to accept that we can read some of your Spotify data.
    </p>
    <p className="mt-4">After accepting to will be redirected here and can start listening.</p>

    <p className="mt-12 text-sm text-gray-500 font-semibold">
      Note: To use Syncify properly you need a Spotify Premium subscription.
    </p>

    <Link href="/api/auth/login" passHref>
      <Button as="a" variant="primary" className="mt-8">
        Log in with Spotify
      </Button>
    </Link>
  </div>
)
