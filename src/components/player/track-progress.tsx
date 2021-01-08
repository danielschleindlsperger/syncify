import React from 'react'
import { pipe, clamp } from 'ramda'
import { Box, BoxProps } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

type TimeProps = {
  duration: number
  position: number
}

type ProgressProps = BoxProps & TimeProps

// wrap in memo to prevent useless rerenders that imply recalculating animations, etc
export const Progress = React.memo(({ duration, position, ...props }: ProgressProps) => {
  const timings = useTimings({ duration, position })

  return (
    <Box {...props}>
      <div className={'flex justify-between text-sm text-gray-600'}>
        <span>{timings.byGone}</span>
        <span>{timings.remaining}</span>
      </div>
      <ProgressLine duration={duration} position={position} mt={2} />
    </Box>
  )
})

type ProgressLineProps = Omit<BoxProps, 'position'> & TimeProps

function ProgressLine({ duration, position, ...props }: ProgressLineProps) {
  const current = (1 - position / duration) * 100
  const remaining = duration - position
  const slideIn = keyframes`
  from {
    transform: translateX(-${current}%);
  }
  to {
    transform: translateX(0);
  }
`

  return (
    <Box overflow="hidden" {...props}>
      <Box
        h={1}
        w="100%"
        // TODO: use design tokens here
        bgGradient="linear(to-l, #7928CA, #FF0080)"
        sx={{ animation: `${slideIn} ${remaining}ms linear` }}
      />
    </Box>
  )
}

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
      setProgressedPosition((prev) => prev + milliDelta)
    }, 1000)

    return () => window.clearTimeout(id)
  }, [progressedPosition])

  const format = pipe(clamp(0, duration), (x) => x / 1000, formatSeconds)

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
