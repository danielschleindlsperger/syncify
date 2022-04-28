import React from 'react'
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  IconButton,
} from '@chakra-ui/react'
import Share from '@svgr/webpack!../../icons/share.svg'

export const ShareButton = (props: React.HTMLAttributes<HTMLElement>) => {
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (message !== null) {
      const timeout = window.setTimeout(() => {
        setMessage(null)
      }, 3000)

      return () => window.clearTimeout(timeout)
    }
  }, [message])

  const copyToClipboard = async () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => setMessage('Copied to clipboard'))
      .catch(() => setMessage('There was an error copying the URL'))
  }

  return (
    <Popover placement="top" isOpen={message !== null} onClose={() => {}} {...props}>
      <PopoverTrigger>
        <IconButton
          variant="ghost"
          aria-label="Share this room: copy URL"
          onClick={copyToClipboard}
          // icon={<Share />}
          icon={<span>SHARE</span>}
        />
      </PopoverTrigger>
      <Portal>
        <PopoverContent>
          <PopoverBody>{message}</PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}
