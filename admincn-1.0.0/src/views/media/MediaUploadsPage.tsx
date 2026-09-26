'use client'

import { useState } from 'react'
import { UploadIcon } from 'lucide-react'

import { useAuth } from '@/components/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PublishAs = 'none' | 'audio' | 'video' | 'pdfs'

/**
 * Staff upload → online storage → optional publish to public API (website + mobile).
 * Never Cloudinary.
 */
const MediaUploadsPage = () => {
  const { can, loading: authLoading } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [publishAs, setPublishAs] = useState<PublishAs>('audio')
  const [isMuhadara, setIsMuhadara] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    public_url?: string
    object_key?: string
    message?: string
    published?: boolean
  } | null>(null)

  if (authLoading) {
    return (
      <Card>
        <CardContent className='text-muted-foreground py-6 text-sm'>Loading…</CardContent>
      </Card>
    )
  }

  if (!can('media.upload') && !can('media.scan')) {
    return (
      <Card>
        <CardContent className='text-destructive py-6 text-sm'>
          Access denied. Need media.upload (Media Admin / Super Admin / Content Admin with upload).
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) {
      setError('Choose a file.')
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'staff-uploads')
      const up = await fetch('/api/admin/media/upload', { method: 'POST', body: form })
      const upBody = await up.json()
      if (!up.ok || !upBody.ok) {
        setError(upBody.error || 'Upload failed.')
        return
      }

      if (publishAs === 'none') {
        setResult({
          public_url: upBody.public_url,
          object_key: upBody.object_key,
          message: 'File saved. Publish it later from Content pages.',
          published: false
        })
        setFile(null)
        return
      }

      const pub = await fetch(`/api/admin/content/${publishAs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_asset_id: upBody.asset.id,
          title_en: titleEn || file.name,
          title_am: titleAm || null,
          is_muhadara: isMuhadara,
          status: 'published'
        })
      })
      const pubBody = await pub.json()
      if (!pub.ok || !pubBody.ok) {
        setError(
          `File uploaded, but publishing failed: ${pubBody.error || 'unknown'}`
        )
        setResult({
          public_url: upBody.public_url,
          object_key: upBody.object_key,
          published: false
        })
        return
      }

      setResult({
        public_url: pubBody.public_url || upBody.public_url,
        object_key: upBody.object_key,
        message: pubBody.message,
        published: true
      })
      setFile(null)
      setTitleEn('')
      setTitleAm('')
    } catch {
      setError('Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Uploads</h1>
        <p className='text-muted-foreground mt-1 max-w-3xl text-sm'>
          Upload a file and optionally publish it so it appears on the website and in the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload file</CardTitle>
          <CardDescription>Choose a file, then publish as audio, video, or PDF — or save for later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => void onSubmit(e)} className='space-y-4'>
            <FieldGroup className='gap-4'>
              <Field>
                <FieldLabel htmlFor='upload-file'>File*</FieldLabel>
                <Input
                  id='upload-file'
                  type='file'
                  accept='audio/*,video/*,application/pdf,image/*'
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </Field>
              <Field>
                <FieldLabel>After upload</FieldLabel>
                <Select value={publishAs} onValueChange={v => setPublishAs(v as PublishAs)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='audio'>Publish as Audio</SelectItem>
                    <SelectItem value='video'>Publish as Video</SelectItem>
                    <SelectItem value='pdfs'>Publish as PDF</SelectItem>
                    <SelectItem value='none'>Save only — publish later</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {publishAs !== 'none' ? (
                <>
                  <Field>
                    <FieldLabel htmlFor='title-en'>Title (EN)</FieldLabel>
                    <Input
                      id='title-en'
                      value={titleEn}
                      onChange={e => setTitleEn(e.target.value)}
                      placeholder='Optional — defaults to file name'
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='title-am'>Title (AM)</FieldLabel>
                    <Input
                      id='title-am'
                      value={titleAm}
                      onChange={e => setTitleAm(e.target.value)}
                      placeholder='Optional'
                    />
                  </Field>
                  {publishAs === 'audio' ? (
                    <label className='flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={isMuhadara}
                        onChange={e => setIsMuhadara(e.target.checked)}
                      />
                      Mark as Muhadara
                    </label>
                  ) : null}
                </>
              ) : null}
            </FieldGroup>

            {error ? (
              <p className='text-destructive text-sm' role='alert'>
                {error}
              </p>
            ) : null}

            {result ? (
              <div className='bg-muted space-y-2 rounded-md p-3 text-sm'>
                <div className='flex items-center gap-2'>
                  <Badge variant={result.published ? 'default' : 'secondary'}>
                    {result.published ? 'Published' : 'Saved'}
                  </Badge>
                  <span className='text-muted-foreground'>
                    {result.message || (result.published ? 'Live on website and app.' : 'Ready to publish later.')}
                  </span>
                </div>
                {result.public_url ? (
                  <a className='text-primary text-xs underline' href={result.public_url} target='_blank' rel='noreferrer'>
                    Preview file
                  </a>
                ) : null}
              </div>
            ) : null}

            <Button type='submit' disabled={busy || !file}>
              <UploadIcon className='size-4' />
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default MediaUploadsPage
