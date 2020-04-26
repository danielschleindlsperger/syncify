import React from 'react'
import cx from 'classnames'

type CustomProps = {
  variant: 'primary' | 'secondary'
}

type ButtonProps =
  | (React.AllHTMLAttributes<HTMLButtonElement> & CustomProps & { as?: 'button' })
  | (React.AllHTMLAttributes<HTMLAnchorElement> & CustomProps & { as: 'a' })

export const Button = React.forwardRef(
  ({ variant, as = 'button', className, ...remaining }: ButtonProps, ref) => {
    const props = {
      className: cx(className, variants[variant]),
      ...(remaining as any),
      ref,
    }
    return as === 'button' ? <button {...props} /> : <a {...props} />
  },
)

const sharedClasses = 'inline-block text-center whitespace-no-wrap rounded-sm'
const variants: Record<CustomProps['variant'], string> = {
  primary: cx(sharedClasses, 'bg-gray-700 text-gray-100 px-3 py-1'),
  secondary: cx(sharedClasses, 'bg-gray-100 text-gray-600 px-3 py-1'),
}
