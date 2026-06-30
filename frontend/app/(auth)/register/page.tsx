'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'
import { Input, FieldWrapper } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const PUNE_WARDS = [
  'Shivajinagar', 'Koregaon Park', 'Deccan', 'Aundh', 'Viman Nagar',
  'Kothrud', 'Hadapsar', 'Baner', 'Wakad', 'Hinjewadi',
]

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null)
    try {
      await registerUser(data)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-primary text-white font-display text-lg font-bold mb-3">
            CH
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Join Community Hero as a citizen</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldWrapper label="Full name" error={errors.name?.message} htmlFor="name">
            <Input id="name" placeholder="Aditi Deshmukh" {...register('name')} />
          </FieldWrapper>
          <FieldWrapper label="Email" error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          </FieldWrapper>
          <FieldWrapper label="Mobile number" error={errors.phone?.message} htmlFor="phone">
            <Input id="phone" placeholder="9876543210" {...register('phone')} />
          </FieldWrapper>
          <FieldWrapper label="Password" error={errors.password?.message} htmlFor="password">
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          </FieldWrapper>
          <FieldWrapper label="Ward" error={errors.ward?.message} htmlFor="ward">
            <select
              id="ward"
              {...register('ward')}
              className="h-10 w-full rounded border border-border bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">Select your ward</option>
              {PUNE_WARDS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </FieldWrapper>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
