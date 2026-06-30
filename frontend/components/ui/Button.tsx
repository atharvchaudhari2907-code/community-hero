import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-[#0c8fcb] disabled:bg-slate-300',
  secondary: 'bg-secondary text-white hover:bg-[#0ea571] disabled:bg-slate-300',
  gold: 'bg-accent text-white hover:bg-[#d97f09] disabled:bg-slate-300',
  ghost: 'bg-transparent text-navy border border-border hover:bg-slate-50',
  danger: 'bg-danger text-white hover:bg-red-600 disabled:bg-slate-300',
}

const SIZES: Record<string, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:opacity-70',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
