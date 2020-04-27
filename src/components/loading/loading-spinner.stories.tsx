import React from 'react'
import { storiesOf } from '@storybook/react'
import { LoadingSpinner } from './loading-spinner'

storiesOf('Loading Spinner', module)
  .add('Standard, non-centered', () => <LoadingSpinner />)
  .add('Centered', () => <LoadingSpinner absoluteCentered />)
  .add('Longer delay', () => <LoadingSpinner delayed={5000} />)
  .add('Not Delayed', () => <LoadingSpinner delayed={false} />)
