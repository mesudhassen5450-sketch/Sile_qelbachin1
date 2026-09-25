'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { R2FileField, type UploadedAsset } from '@/views/content/R2FileField'

type ContentKind = 'kitabs' | 'audio' | 'video' | 'pdfs' | 'sahabah'

type AddContentDialogProps = {
  kind: ContentKind
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

type DersDraft = {
  key: string
  title_en: string
  title_am: string
  audio: UploadedAsset | null
}

const titles: Record<ContentKind, string> = {
  kitabs: 'Add Kitab',
  audio: 'Add Audio',
  video: 'Add Video',
  pdfs: 'Add PDF',
  sahabah: 'Add Sahabah'
}

const AddContentDialog = ({ kind, open, onOpenChange, onCreated }: AddContentDialogProps) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [sheikh, setSheikh] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAm, setDescriptionAm] = useState('')
  const [biographyEn, setBiographyEn] = useState('')
  const [isMuhadara, setIsMuhadara] = useState(false)

  const [cover, setCover] = useState<UploadedAsset | null>(null)
  const [mainFile, setMainFile] = useState<UploadedAsset | null>(null)
  const [ders, setDers] = useState<DersDraft[]>([])

  const reset = () => {
    setError(null)
    setTitleEn('')
    setTitleAm('')
    setSheikh('')
    setDescriptionEn('')
    setDescriptionAm('')
    setBiographyEn('')
    setIsMuhadara(false)
    setCover(null)
    setMainFile(null)
    setDers([])
  }

  const addDersRow = () => {
    setDers(prev => [
      ...prev,
      { key: `${Date.now()}-${prev.length}`, title_en: '', title_am: '', audio: null }
    ])
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      let body: Record<string, unknown> = {}
      let endpoint = `/api/admin/content/${kind}`

      if (kind === 'kitabs') {
        if (!titleEn.trim() && !titleAm.trim()) {
          setError('Title is required.')
          return
        }
        const dersReady = ders.filter(d => d.audio?.id)
          if (!cover?.id && !mainFile?.id && dersReady.length === 0) {
          setError('Please upload at least one file: cover image, PDF, or ders audio.')
          return
        }
        body = {
          title_en: titleEn || null,
          title_am: titleAm || null,
          author_en: sheikh || null,
          description_en: descriptionEn || null,
          description_am: descriptionAm || null,
          cover_asset_id: cover?.id || null,
          pdf_asset_id: mainFile?.id || null,
          status: 'published',
          ders: dersReady.map((d, i) => ({
            title_en: d.title_en || `Ders ${i + 1}`,
            title_am: d.title_am || null,
            speaker_en: sheikh || null,
            audio_asset_id: d.audio!.id,
            ders_number: i + 1
          }))
        }
      } else if (kind === 'audio') {
        if (!mainFile?.id) {
          setError('Audio file upload is required.')
          return
        }
        body = {
          title_en: titleEn || 'Audio',
          title_am: titleAm || null,
          description_en: descriptionEn || null,
          description_am: descriptionAm || null,
          media_asset_id: mainFile.id,
          cover_asset_id: cover?.id || null,
          is_muhadara: isMuhadara,
          status: 'published'
        }
      } else if (kind === 'video') {
        if (!mainFile?.id) {
          setError('Video file upload is required.')
          return
        }
        body = {
          title_en: titleEn || 'Video',
          title_am: titleAm || null,
          description_en: descriptionEn || null,
          description_am: descriptionAm || null,
          video_asset_id: mainFile.id,
          cover_asset_id: cover?.id || null,
          status: 'published'
        }
      } else if (kind === 'pdfs') {
        if (!mainFile?.id) {
          setError('PDF file upload is required.')
          return
        }
        body = {
          title_en: titleEn || 'PDF',
          title_am: titleAm || null,
          media_asset_id: mainFile.id,
          cover_asset_id: cover?.id || null,
          status: 'published'
        }
      } else {
        if (!titleEn.trim() && !titleAm.trim()) {
          setError('Name / title is required.')
          return
        }
        body = {
          name_en: titleEn || null,
          name_am: titleAm || null,
          title_en: sheikh || null,
          description_en: descriptionEn || null,
          description_am: descriptionAm || null,
          biography_en: biographyEn || null,
          cover_asset_id: cover?.id || null,
          status: 'published'
        }
        endpoint = '/api/admin/content/sahabah'
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Create failed.')
        return
      }
      reset()
      onOpenChange(false)
      onCreated()
    } catch {
      setError('Create failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className='max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto p-4 sm:max-w-xl sm:p-6'>
        <DialogHeader>
          <DialogTitle>{titles[kind]}</DialogTitle>
          <DialogDescription>
            Add titles and files, then publish. New items appear on the website and in the app.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={e => void onSubmit(e)} className='space-y-4'>
          <FieldGroup className='gap-3'>
            <Field>
              <FieldLabel>Title (EN)*</FieldLabel>
              <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} required={kind !== 'kitabs'} />
            </Field>
            <Field>
              <FieldLabel>Title (AM)</FieldLabel>
              <Input value={titleAm} onChange={e => setTitleAm(e.target.value)} />
            </Field>

            {kind === 'kitabs' || kind === 'sahabah' ? (
              <Field>
                <FieldLabel>{kind === 'kitabs' ? 'Sheikh / Author' : 'Subtitle / Title line'}</FieldLabel>
                <Input
                  value={sheikh}
                  onChange={e => setSheikh(e.target.value)}
                  placeholder={kind === 'kitabs' ? 'Sheikh name' : 'e.g. First Caliph'}
                />
              </Field>
            ) : null}

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={descriptionEn}
                onChange={e => setDescriptionEn(e.target.value)}
                rows={3}
                placeholder='Short description (EN)'
              />
            </Field>
            <Field>
              <FieldLabel>Description (AM)</FieldLabel>
              <Textarea
                value={descriptionAm}
                onChange={e => setDescriptionAm(e.target.value)}
                rows={2}
              />
            </Field>

            {kind === 'sahabah' ? (
              <Field>
                <FieldLabel>Full biography / text</FieldLabel>
                <Textarea
                  value={biographyEn}
                  onChange={e => setBiographyEn(e.target.value)}
                  rows={6}
                  placeholder='Long text content…'
                />
              </Field>
            ) : null}

            {kind === 'audio' ? (
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={isMuhadara}
                  onChange={e => setIsMuhadara(e.target.checked)}
                />
                Mark as Muhadara
              </label>
            ) : null}

            <R2FileField
              label='Cover image'
              accept='image/*'
              folder={`staff-uploads/${kind}/covers`}
              value={cover}
              onChange={setCover}
              hint='Optional cover for cards on website / mobile'
            />

            {kind === 'kitabs' ? (
              <R2FileField
                label='Kitab PDF'
                accept='application/pdf,.pdf'
                folder='staff-uploads/kitabs/pdf'
                value={mainFile}
                onChange={setMainFile}
                hint='Optional full book PDF'
              />
            ) : null}

            {kind === 'audio' ? (
              <R2FileField
                label='Audio file'
                accept='audio/*'
                required
                folder='staff-uploads/audio'
                value={mainFile}
                onChange={setMainFile}
              />
            ) : null}

            {kind === 'video' ? (
              <R2FileField
                label='Video file'
                accept='video/*'
                required
                folder='staff-uploads/video'
                value={mainFile}
                onChange={setMainFile}
              />
            ) : null}

            {kind === 'pdfs' ? (
              <R2FileField
                label='PDF file'
                accept='application/pdf,.pdf'
                required
                folder='staff-uploads/pdfs'
                value={mainFile}
                onChange={setMainFile}
              />
            ) : null}

            {kind === 'kitabs' ? (
              <div className='space-y-3 rounded-lg border p-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>Child ders audio</p>
                    <p className='text-muted-foreground text-xs'>
                      Upload audio-only files for each ders under this kitab.
                    </p>
                  </div>
                  <Button type='button' size='sm' variant='secondary' className='border border-border shadow-sm' onClick={addDersRow}>
                    <PlusIcon className='size-4' />
                    Add ders audio
                  </Button>
                </div>
                {ders.map((row, idx) => (
                  <div key={row.key} className='bg-muted/40 space-y-2 rounded-md p-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Ders {idx + 1}</span>
                      <Button
                        type='button'
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => setDers(prev => prev.filter(d => d.key !== row.key))}
                      >
                        <TrashIcon className='size-4' />
                      </Button>
                    </div>
                    <Input
                      placeholder='Ders title (EN)'
                      value={row.title_en}
                      onChange={e =>
                        setDers(prev =>
                          prev.map(d => (d.key === row.key ? { ...d, title_en: e.target.value } : d))
                        )
                      }
                    />
                    <R2FileField
                      label='Audio file'
                      accept='audio/*'
                      required
                      folder='staff-uploads/kitabs/ders'
                      value={row.audio}
                      onChange={asset =>
                        setDers(prev =>
                          prev.map(d => (d.key === row.key ? { ...d, audio: asset } : d))
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </FieldGroup>

          {error ? (
            <p className='text-destructive text-sm' role='alert'>
              {error}
            </p>
          ) : null}

          <DialogFooter className='flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              className='border-muted-foreground/50 w-full sm:w-auto'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={busy}
              className='bg-primary text-primary-foreground w-full min-w-0 shadow-md sm:w-auto sm:min-w-40'
            >
              {busy ? 'Saving…' : 'Upload & publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddContentDialog
