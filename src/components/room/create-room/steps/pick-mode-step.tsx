import React from 'react'
import cx from 'classnames'
import { CreatePlaylistMode } from '../create-room'

type PickModeStepProps = {
  activeMode: CreatePlaylistMode
  setMode: (mode: CreatePlaylistMode) => void
}

// This step exists to pick a room creation mode that determines how the user can create the playlist in the next step of the room creation wizard.
export const PickModeStep = ({ setMode, activeMode }: PickModeStepProps) => {
  return (
    <div className="max-w-xl">
      <ul className="grid col-auto gap-8">
        <li>
          <ModeButton
            isActive={activeMode === 'user-playlist'}
            onClick={() => setMode('user-playlist')}
          >
            Go With One of Your Personal Playlists
          </ModeButton>
        </li>
        <li>
          <ModeButton
            isActive={activeMode === 'search-for-existing-playlist'}
            onClick={() => setMode('search-for-existing-playlist')}
            disabled
          >
            <span className="text-gray-500">Coming soon: Choose From Any Playlist on Spotify</span>
          </ModeButton>
        </li>
        <li>
          <ModeButton
            isActive={activeMode === 'spotify-curated-playlist'}
            onClick={() => setMode('spotify-curated-playlist')}
            disabled
          >
            <span className="text-gray-500">Coming soon: Genres and Moods Compilations</span>
          </ModeButton>
        </li>
        <li>
          <ModeButton
            isActive={activeMode === 'create-from-scratch'}
            onClick={() => setMode('create-from-scratch')}
            disabled
          >
            <span className="text-gray-500">Coming soon: Handpick Every Song</span>
          </ModeButton>
        </li>
      </ul>
    </div>
  )
}

type ModeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive: boolean
}
const ModeButton = ({ isActive, className, ...props }: ModeButtonProps) => {
  const active = 'border-2 border-gray-700'
  const hover = 'hover:border-gray-700'
  const transition = 'transition ease-in-out duration-300'
  return (
    <button
      className={cx(
        className,
        'px-6 py-6 block relative w-full text-gray-700 text-lg font-semibold',
        isActive && active,
        hover,
        transition,
      )}
      {...props}
    />
  )
}
