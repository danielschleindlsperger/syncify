import React from 'react'
import { storiesOf } from '@storybook/react'
import { Button } from './button'

storiesOf('Button', module)
  .add('Primary', () => <Button variant="primary">Primary Button</Button>)
  .add('Primary as Link', () => (
    <Button variant="primary" as="a" href="/hullebulle">
      Primary Button as Link
    </Button>
  ))
  .add('Secondary', () => <Button variant="secondary">Secondary Button</Button>)

  .add('Secondary as Link', () => (
    <Button variant="secondary" as="a" href="/hullebulle">
      Secondary Button as Link
    </Button>
  ))
