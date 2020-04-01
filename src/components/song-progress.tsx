import React from 'react'
import { pipe, clamp } from 'ramda'

type TimeProps = {
  duration: number
  position: number
}

type ProgressProps = React.HTMLAttributes<HTMLElement> & TimeProps

// wrap in memo to prevent useless rerenders that imply recalculating animations, etc
export const Progress = React.memo(({ duration, position, ...props }: ProgressProps) => {
  const timings = useTimings({ duration, position })

  return (
    <div {...props}>
      <div className="h-1">
        <ProgressBar duration={duration} position={position} />
      </div>
      <div className="flex justify-between mt-2">
        <span>{timings.byGone}</span>
        <span>{timings.remaining}</span>
      </div>
    </div>
  )
})

const remaining = ({ position, duration }: TimeProps): string =>
  pipe(
    (remainingMs: number) => remainingMs / 1000,
    Math.round,
    remaining => `${remaining}s`,
  )(duration - position)

const ProgressBar = (props: TimeProps) => <div className="w-full h-full origin-left" />

const useTimings = ({ position, duration }: TimeProps): { byGone: string; remaining: string } => {
  const [progressedPosition, setProgressedPosition] = React.useState(position)

  // update when props update
  React.useEffect(() => {
    setProgressedPosition(position)
  }, [position])

  // increment timers every second
  React.useEffect(() => {
    const before = Date.now()

    const id = window.setTimeout(() => {
      const milliDelta = Date.now() - before
      setProgressedPosition(prev => prev + milliDelta)
    }, 1000)

    return () => window.clearTimeout(id)
  }, [progressedPosition])

  const format = pipe(clamp(0, duration), x => x / 1000, formatSeconds)

  return {
    byGone: format(progressedPosition),
    remaining: format(duration - progressedPosition),
  }
}

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const formattedSeconds = `${Math.round(seconds - minutes * 60)}`.padStart(2, '0')

  return `${minutes}:${formattedSeconds}`
}
