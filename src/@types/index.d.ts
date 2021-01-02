declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.gif'

// Types for React components created with the react-svgr loader https://react-svgr.com/docs/webpack/
declare module '@svgr/webpack!*.svg' {
  import React from 'react'

  const svgComponent: React.FC<React.HTMLAttributes<SVGElement>>

  export = svgComponent
}
