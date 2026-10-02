'use client'

import { useRef, useState } from 'react'
import { CheckCircle2Icon, Loader2Icon, UploadCloudIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

type UploadedAsset = {
  id: string
  public_url: string
  object_key: string
}

type R2FileFieldProps = {
  label: string
  accept: string
  required?: boolean
  folder?: string
  value: UploadedAsset | null
  onChange: (asset: UploadedAsset | null) => void
  hint?: string
}

/** File picker that stores media for website / mobile. */
export function R2FileField({
  label,
  accept,
  required,
  folder = 'staff-uploads',
  value,
  onChange,
  hint
}: R2FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File | null) => {
    setError(null)
    if (!file) {
      onChange(null)
      return
    }
    if (file.size <= 0) {
      setError('That file is empty. Choose another audio file.')
      onChange(null)
      return
    }
    // Soft client hint — server allows up to ~100MB after middleware bypass
    const maxBytes = 95 * 1024 * 1024
    if (file.size > maxBytes) {
      setError('File is too large (max ~95 MB). Compress or split the audio, then try again.')
      onChange(null)
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      // Explicit filename helps some browsers build a valid multipart body
      form.append('file', file, file.name || 'upload.bin')
      form.append('folder', folder)
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: form
        // Do not set Content-Type — browser must add multipart boundary
      })
      let data: { ok?: boolean; error?: string; asset?: UploadedAsset; public_url?: string; object_key?: string } =
        {}
      try {
        data = await res.json()
      } catch {
        setError('Upload failed — server returned an invalid response. Refresh and try again.')
        onChange(null)
        return
      }
      if (!res.ok || !data.ok || !data.asset?.id) {
        setError(data.error || 'Upload failed. Please try again.')
        onChange(null)
        return
      }
      onChange({
        id: data.asset.id,
        public_url: data.public_url || data.asset.public_url,
        object_key: data.object_key || data.asset.object_key
      })
    } catch {
      setError('Upload failed (network). Check your connection and try again.')
      onChange(null)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const fileName = value?.object_key.split('/').pop() || 'Uploaded file'

  return (
    <Field>
      <FieldLabel className='text-foreground font-medium'>
        {label}
        {required ? <span className='text-destructive'> *</span> : null}
      </FieldLabel>

      <div
        className={cn(
          'rounded-lg border-2 border-dashed p-4 transition-colors',
          value
            ? 'border-primary/60 bg-primary/5'
            : 'border-muted-foreground/40 bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input
          ref={inputRef}
          type='file'
          accept={accept}
          className='sr-only'
          disabled={busy}
          onChange={e => void onFile(e.target.files?.[0] || null)}
        />

        {!value ? (
          <div className='flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left'>
            <div className='bg-background flex size-12 shrink-0 items-center justify-center rounded-full border shadow-sm'>
              {busy ? (
                <Loader2Icon className='text-primary size-5 animate-spin' />
              ) : (
                <UploadCloudIcon className='text-primary size-5' />
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium'>{busy ? 'Uploading…' : 'Choose a file to upload'}</p>
              {hint ? <p className='text-muted-foreground mt-0.5 text-xs'>{hint}</p> : null}
            </div>
            <Button
              type='button'
              variant='default'
              className='bg-primary text-primary-foreground shrink-0 border-2 border-primary shadow-md ring-2 ring-primary/30'
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloudIcon className='size-4' />
              {busy ? 'Uploading…' : 'Choose file'}
            </Button>
          </div>
        ) : (
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex min-w-0 items-start gap-2'>
              <CheckCircle2Icon className='text-primary mt-0.5 size-5 shrink-0' />
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{fileName}</p>
                <p className='text-emerald-600 dark:text-emerald-400 text-xs font-medium'>
                  Uploaded successfully
                </p>
                {value.public_url ? (
                  <a
                    className='text-primary text-xs underline'
                    href={value.public_url}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Preview file
                  </a>
                ) : null}
              </div>
            </div>
            <div className='flex shrink-0 gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={busy}
                onClick={() => onChange(null)}
              >
                <XIcon className='size-4' />
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className='text-destructive mt-1.5 text-xs' role='alert'>
          {error}
        </p>
      ) : null}
    </Field>
  )
}

export type { UploadedAsset }
