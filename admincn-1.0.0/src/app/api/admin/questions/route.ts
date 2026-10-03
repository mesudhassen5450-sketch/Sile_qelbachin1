import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import {
  answerQuestionSubmission,
  archiveQuestionSubmission,
  countUnseenInbox,
  deleteQuestionSubmission,
  listQuestionSubmissions,
  markAllNewSeen,
  markQuestionSeen,
  QUESTION_STATUSES,
  updateQuestionStatus,
  type QuestionStatus,
} from '@/lib/cms/question-submissions'
import { sendUstazAnswerEmail } from '@/lib/cms/send-answer-email'
import { upsertYouthContent } from '@/lib/cms/youth-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const gate = await requireApiPermission(['kitabs.view', 'dashboard.view'])
  if ('response' in gate) return gate.response
  const url = new URL(request.url)
  if (url.searchParams.get('unseen') === '1') {
    return NextResponse.json({ ok: true, unseen: countUnseenInbox() })
  }
  const rows = listQuestionSubmissions()
  return NextResponse.json({
    ok: true,
    count: rows.length,
    rows,
    unseen: countUnseenInbox(),
    statuses: QUESTION_STATUSES,
  })
}

export async function PATCH(request: Request) {
  const gate = await requireApiPermission(['kitabs.edit', 'kitabs.publish', 'dashboard.view'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')

  if (action === 'mark_seen_all') {
    const n = markAllNewSeen()
    return NextResponse.json({ ok: true, marked: n, unseen: countUnseenInbox() })
  }

  const id = String(body.id || '')
  if (!id) return NextResponse.json({ ok: false, error: 'id required.' }, { status: 400 })

  if (action === 'mark_seen') {
    const row = markQuestionSeen(id)
    if (!row) return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ ok: true, row, unseen: countUnseenInbox() })
  }

  if (action === 'set_status') {
    try {
      const status = String(body.status || '') as QuestionStatus
      if (!QUESTION_STATUSES.includes(status)) {
        return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 })
      }
      const row = updateQuestionStatus({
        id,
        status,
        assigned_to: body.assigned_to !== undefined ? body.assigned_to : undefined,
      })
      return NextResponse.json({ ok: true, row, unseen: countUnseenInbox() })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Status update failed.' },
        { status: 400 }
      )
    }
  }

  if (action === 'assign') {
    try {
      const assigned_to = String(body.assigned_to || '').trim() || null
      const existing = listQuestionSubmissions().find(r => r.id === id)
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
      }
      const nextStatus: QuestionStatus =
        existing.status === 'new' || existing.status === 'assigned'
          ? 'assigned'
          : existing.status
      const row = updateQuestionStatus({
        id,
        status: nextStatus,
        assigned_to,
      })
      return NextResponse.json({ ok: true, row, unseen: countUnseenInbox() })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Assign failed.' },
        { status: 400 }
      )
    }
  }

  if (action === 'close') {
    try {
      const row = updateQuestionStatus({ id, status: 'closed' })
      return NextResponse.json({ ok: true, row })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Close failed.' },
        { status: 400 }
      )
    }
  }

  if (action === 'archive') {
    try {
      const row = archiveQuestionSubmission(id)
      return NextResponse.json({ ok: true, row })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Archive failed.' },
        { status: 400 }
      )
    }
  }

  if (action === 'delete') {
    const ok = deleteQuestionSubmission(id)
    if (!ok) return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  const answer = String(body.answer || '').trim()
  if (!answer) {
    return NextResponse.json({ ok: false, error: 'Answer text is required.' }, { status: 400 })
  }

  const greeting = String(body.greeting || '').trim()
  const description = String(body.description || '').trim()
  const cover_url = String(body.cover_url || '').trim() || null
  const audio_url = String(body.audio_url || '').trim() || null
  const video_url = String(body.video_url || '').trim() || null
  const publishPublic = Boolean(body.publish_public)

  try {
    const existing = listQuestionSubmissions().find(r => r.id === id)
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Question not found.' }, { status: 404 })
    }

    const mail = await sendUstazAnswerEmail({
      to: existing.auth_email,
      question: existing.question,
      answer,
      greeting: greeting || null,
      description: description || null,
      category: existing.category,
      coverUrl: cover_url,
      audioUrl: audio_url,
      videoUrl: video_url,
    })

    const row = answerQuestionSubmission({
      id,
      greeting: greeting || null,
      answer,
      description: description || null,
      cover_url,
      audio_url,
      video_url,
      published_public: publishPublic,
      answered_by: gate.ctx.user.email || null,
      email_sent: mail.ok,
      email_error: mail.ok ? null : mail.error || 'Email failed',
    })

    if (publishPublic) {
      await upsertYouthContent('questions', {
        title_en: existing.question.slice(0, 200),
        title_am: existing.question.slice(0, 200),
        title_ar: existing.question.slice(0, 200),
        excerpt_en: description || answer.slice(0, 180),
        excerpt_am: description || answer.slice(0, 180),
        excerpt_ar: description || answer.slice(0, 180),
        body_en: [greeting, answer].filter(Boolean).join('\n\n'),
        body_am: [greeting, answer].filter(Boolean).join('\n\n'),
        body_ar: [greeting, answer].filter(Boolean).join('\n\n'),
        cover_url,
        audio_url,
        video_url,
        status: 'published',
        featured: false,
      })
    }

    return NextResponse.json({
      ok: true,
      row,
      email_sent: mail.ok,
      email_error: mail.ok ? null : mail.error || null,
      message: mail.ok
        ? `Answer saved and emailed to ${existing.auth_email}.`
        : `Answer saved, but email was not sent: ${mail.error}`,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Answer failed.' },
      { status: 400 }
    )
  }
}
