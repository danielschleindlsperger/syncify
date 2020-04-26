import React from 'react'
import { storiesOf } from '@storybook/react'
import { LoginRequired } from './login-required'

storiesOf('Auth', module).add('Login required', () => <LoginRequired />)
