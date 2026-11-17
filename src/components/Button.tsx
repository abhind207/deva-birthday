import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'gold' | 'ghost' }

export default function Button({ variant = 'gold', className = '', type = 'button', ...rest }: Props) {
  return <button type={type} {...rest} className={`btn btn-${variant} ${className}`} />
}
