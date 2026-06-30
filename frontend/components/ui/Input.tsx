import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
  htmlFor?: string
}

export function FieldWrapper({ label, error, hint, children, htmlFor }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded border bg-white px-3 text-sm text-ink placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
        error ? 'border-red-400' : 'border-border',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
        'min-h-[100px] resize-y',
        error ? 'border-red-400' : 'border-border',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
