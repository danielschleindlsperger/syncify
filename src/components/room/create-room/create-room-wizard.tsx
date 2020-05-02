import React from 'react'
import { Button } from '../../button'

type WizardProps = {
  steps: { component: React.ReactNode }[]
  onSubmit?: () => void
}

export const Wizard = ({ steps, onSubmit }: WizardProps) => {
  const [activeStepIndex, setActiveStepIndex] = React.useState(0)

  const activeStep = steps[activeStepIndex]

  const prev = () => setActiveStepIndex((i) => i - 1)
  const next = () => setActiveStepIndex((i) => i + 1)

  const isFirst = activeStepIndex === 0
  const isLast = activeStepIndex === steps.length - 1

  return (
    <div className="max-w-5xl w-full">
      {activeStep.component}
      <nav aria-label="Create room step navigation" className="flex justify-between mt-8">
        {!isFirst && (
          <Button variant="secondary" onClick={prev}>
            Go back
          </Button>
        )}

        {!isLast && (
          <Button variant="primary" onClick={next} className="ml-auto">
            Next step
          </Button>
        )}

        {isLast && (
          <Button variant="primary" onClick={onSubmit} className="ml-auto">
            Create Room
          </Button>
        )}
      </nav>
    </div>
  )
}
