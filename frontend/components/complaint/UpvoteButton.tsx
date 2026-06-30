'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowBigUp } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function UpvoteButton({
  complaintId,
  upvotes,
  size = 'md',
  invalidateKeys = [],
}: {
  complaintId: string
  upvotes: number
  size?: 'sm' | 'md'
  invalidateKeys?: string[][]
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => (await api.put(`/complaints/${complaintId}/upvote`)).data.data,
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] })
    },
  })

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!mutation.isPending) mutation.mutate()
      }}
      disabled={mutation.isPending}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-white font-mono font-medium text-slate-600 transition-colors',
        'hover:border-primary hover:text-primary disabled:opacity-60',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      aria-label="Upvote this issue"
    >
      <ArrowBigUp className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {upvotes}
    </button>
  )
}
