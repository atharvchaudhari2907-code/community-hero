'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, MapPin, Loader2, CheckCircle2, Upload, X } from 'lucide-react'

import { reportIssueSchema, type ReportIssueInput } from '@/lib/validators'
import { useRequireAuth } from '@/hooks/useAuth'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useLiveClock } from '@/hooks/useLiveClock'
import { api, extractErrorMessage } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, FieldWrapper } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel'
import { CATEGORY_LABELS, SEVERITY_LABELS } from '@/types'
import type { IssueCategory, SeverityLevel, Complaint, APIResponse } from '@/types'

type Step = 'upload' | 'review' | 'submitting' | 'done'

export default function ReportIssuePage() {
  const { user, isChecking } = useRequireAuth(['citizen'])
  const router = useRouter()
  const clock = useLiveClock()
  const geo = useGeolocation()

  const [step, setStep] = useState<Step>('upload')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Complaint | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportIssueInput>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: { category: 'pothole', severity: 'medium' },
  })

  const category = watch('category')
  const severity = watch('severity')

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImagePreview(URL.createObjectURL(file))
    setIsUploading(true)
    setServerError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<APIResponse<{ url: string }>>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(res.data.data.url)
      setStep('review')
    } catch (err) {
      setServerError(extractErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  function skipPhoto() {
    setStep('review')
  }

  function useMyLocation() {
    geo.requestLocation()
  }

  // keep form location in sync with geolocation hook results
  if (geo.lat && geo.lng && watch('location.lat') !== geo.lat) {
    setValue('location.lat', geo.lat)
    setValue('location.lng', geo.lng)
    setValue('location.address', geo.address)
  }

  const onSubmit = async (data: ReportIssueInput) => {
    setStep('submitting')
    setServerError(null)
    try {
      const res = await api.post<APIResponse<Complaint>>('/complaints', {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        location: {
          lat: data.location.lat,
          lng: data.location.lng,
          address: data.location.address,
          landmark: data.landmark,
        },
        media_urls: imageUrl ? [imageUrl] : [],
      })
      setSubmitted(res.data.data)
      setStep('done')
    } catch (err) {
      setServerError(extractErrorMessage(err))
      setStep('review')
    }
  }

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref="/citizen/dashboard" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Report an issue</h1>
        <p className="text-sm text-slate-500 mb-6">
          {"Add a photo if you can, tell us what's wrong, and we'll route it to the right team."}
        </p>

        {step === 'upload' && (
          <Card className="p-8 flex flex-col items-center gap-4 text-center">
            <label className="w-full cursor-pointer">
              <div className="rounded border-2 border-dashed border-border hover:border-primary transition-colors py-12 flex flex-col items-center gap-3">
                {isUploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-slate-500">Uploading and getting AI analysis ready…</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-primary" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-ink">Tap to take or upload a photo</p>
                      <p className="text-xs text-slate-400 mt-1">JPG or PNG, up to 10MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
            <button onClick={skipPhoto} className="text-sm text-slate-400 hover:text-slate-600 underline">
              Skip photo and describe the issue instead
            </button>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          </Card>
        )}

        {(step === 'review' || step === 'submitting') && (
          <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
            {/* Left: photo + AI preview */}
            <Card className="p-5 flex flex-col gap-4">
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Uploaded issue" className="w-full h-44 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageUrl(null); setStep('upload') }}
                    className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="rounded border-2 border-dashed border-border hover:border-primary py-6 flex flex-col items-center gap-2 text-slate-400">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">Add a photo (optional)</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
              )}

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Category & severity {imageUrl ? '(AI suggestion, you can override)' : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrapper label="Category" error={errors.category?.message}>
                    <select
                      {...register('category')}
                      className="h-10 w-full rounded border border-border bg-white px-3 text-sm"
                    >
                      {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </FieldWrapper>
                  <FieldWrapper label="Severity" error={errors.severity?.message}>
                    <select
                      {...register('severity')}
                      className="h-10 w-full rounded border border-border bg-white px-3 text-sm"
                    >
                      {(Object.keys(SEVERITY_LABELS) as SeverityLevel[]).map((s) => (
                        <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                      ))}
                    </select>
                  </FieldWrapper>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Full AI image analysis (category, severity, confidence, and reasoning) appears on the
                complaint page moments after you submit, once our model has processed the photo.
              </p>
            </Card>

            {/* Right: form fields */}
            <Card className="p-5 flex flex-col gap-4">
              <FieldWrapper label="Title" error={errors.title?.message} htmlFor="title">
                <Input id="title" placeholder="e.g. Large pothole near MG Road signal" {...register('title')} />
              </FieldWrapper>

              <FieldWrapper label="Description" error={errors.description?.message} htmlFor="description">
                <Textarea id="description" placeholder="Describe what you see and why it matters…" {...register('description')} />
              </FieldWrapper>

              <FieldWrapper label="Nearest landmark" error={errors.landmark?.message} htmlFor="landmark">
                <Input id="landmark" placeholder="e.g. Near Good Luck Cafe" {...register('landmark')} />
              </FieldWrapper>

              <div>
                <p className="text-sm font-medium text-ink mb-1.5">Location</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={useMyLocation}
                  isLoading={geo.isLoading}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4" /> Use my current location
                </Button>
                {geo.error && <p className="text-xs text-red-600 mt-1.5">{geo.error}</p>}
                {geo.lat && geo.lng && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    {geo.shortAddress} · {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                  </p>
                )}
                {errors.location?.lat && (
                  <p className="text-xs text-red-600 mt-1.5">Please share your location to continue.</p>
                )}
              </div>

              <div className="rounded border border-border bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Reported at {clock.shortTime}, {clock.dateString}
              </div>

              {serverError && <p className="text-sm text-red-600">{serverError}</p>}

              <Button type="submit" isLoading={step === 'submitting'} className="w-full mt-1">
                Submit complaint
              </Button>
            </Card>
          </form>
        )}

        {step === 'done' && submitted && (
          <Card className="p-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Complaint submitted!</h2>
              <p className="text-sm text-slate-500 mt-1">
                {submitted.xp_awarded && `+${submitted.xp_awarded.xp_earned} XP earned. `}
                {"We've routed it to "}{submitted.department}
                {submitted.assigned_worker_name && ` and assigned ${submitted.assigned_worker_name}`}.
              </p>
            </div>
            {submitted.ai_analysis && (
              <div className="w-full max-w-sm text-left">
                <AIAnalysisPanel analysis={submitted.ai_analysis} />
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <Button variant="ghost" onClick={() => router.push('/citizen/dashboard')}>
                Back to dashboard
              </Button>
              <Button onClick={() => router.push(`/citizen/complaints/${submitted.id}`)}>
                Track this complaint
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
