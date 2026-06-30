'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'
import { Input, FieldWrapper } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setServerError(null)
    try {
      await login(data.email, data.password)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Login failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-primary text-white font-display text-lg font-bold mb-3">
            CH
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to Community Hero</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldWrapper label="Email" error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          </FieldWrapper>
          <FieldWrapper label="Password" error={errors.password?.message} htmlFor="password">
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          </FieldWrapper>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Sign in
          </Button>
        </form>



        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
