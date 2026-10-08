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
  type AnswerChannel,
  type QuestionStatus,
} from '@/lib/cms/question-submissions'
import { sendUstazAnswerEmail } from '@/lib/cms/send-answer-email'
import { telegramDeliverUstazAnswer } from '@/lib/cms/telegram-bot'
import { getTelegramChatIdForUser } from '@/lib/cms/telegram-link'
import { upsertYouthContent } from '@/lib/cms/youth-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const gate = await requireApiPermission(['kitabs.view', 'dashboard.view'])
  if ('response' in gate) return gate.response
  const url = new URL(request.url)
  if (url.searchParams.get('unseen') === '1') {
    return NextResponse.json({ ok: true, unseen: await countUnseenInbox() })
  }
  const rows = await listQuestionSubmissions()
  return NextResponse.json({
    ok: true,
    count: rows.length,
    rows,
    unseen: await countUnseenInbox(),
    statuses: QUESTION_STATUSES,
  })
}

export async function PATCH(request: Request) {
  const gate = await requireApiPermission(['kitabs.edit', 'kitabs.publish', 'dashboard.view'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')

  if (action === 'mark_seen_all') {
    const n = await markAllNewSeen()
    return NextResponse.json({ ok: true, marked: n, unseen: await countUnseenInbox() })
  }

  const id = String(body.id || '')
  if (!id) return NextResponse.json({ ok: false, error: 'id required.' }, { status: 400 })

  if (action === 'mark_seen') {
    const row = await markQuestionSeen(id)
    if (!row) return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ ok: true, row, unseen: await countUnseenInbox() })
  }

  if (action === 'set_status') {
    try {
      const status = String(body.status || '') as QuestionStatus
      if (!QUESTION_STATUSES.includes(status)) {
        return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 })
      }
      const row = await updateQuestionStatus({
        id,
        status,
        assigned_to: body.assigned_to !== undefined ? body.assigned_to : undefined,
      })
      return NextResponse.json({ ok: true, row, unseen: await countUnseenInbox() })
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
      const existing = (await listQuestionSubmissions()).find(r => r.id === id)
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
      }
      const nextStatus: QuestionStatus =
        existing.status === 'new' || existing.status === 'assigned'
          ? 'assigned'
          : existing.status
      const row = await updateQuestionStatus({
        id,
        status: nextStatus,
        assigned_to,
      })
      return NextResponse.json({ ok: true, row, unseen: await countUnseenInbox() })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Assign failed.' },
        { status: 400 }
      )
    }
  }

  if (action === 'close') {
    try {
      const row = await updateQuestionStatus({ id, status: 'closed' })
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
      const row = await archiveQuestionSubmission(id)
      return NextResponse.json({ ok: true, row })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Archive failed.' },
        { status: 400 }
      )
    }
  }

  if (action === 'delete') {
    const ok = await deleteQuestionSubmission(id)
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
    const existing = (await listQuestionSubmissions()).find(r => r.id === id)
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Question not found.' }, { status: 404 })
    }

    // Delivery channel is chosen by the visitor on Ask — admin cannot override.
    const channel: AnswerChannel =
      existing.answer_channel === 'telegram' ? 'telegram' : 'email'

    let deliveryOk = false
    let deliveryError: string | null = null
    let email_sent = false
    let email_error: string | null = null

    if (channel === 'email') {
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
      deliveryOk = mail.ok
      deliveryError = mail.ok ? null : mail.error || 'Email failed'
      email_sent = mail.ok
      email_error = deliveryError
    } else {
      let chatId = existing.telegram_chat_id || null
      if (!chatId && existing.user_id) {
        chatId = await getTelegramChatIdForUser(existing.user_id)
      }
      if (!chatId && existing.auth_email) {
        const { getTelegramChatIdForEmail } = await import('@/lib/cms/telegram-link')
        chatId = await getTelegramChatIdForEmail(existing.auth_email)
      }
      if (!chatId) {
        deliveryOk = false
        deliveryError =
          '⚠️ This user has not connected Telegram (no chat_id).\nAsk them to open Ask a Question, choose Telegram, and press Start on the bot — then try sending again.'
      } else {
        const tg = await telegramDeliverUstazAnswer({
          chatId,
          question: existing.question,
          answer,
          greeting: greeting || null,
          coverUrl: cover_url,
          audioUrl: audio_url,
          videoUrl: video_url,
        })
        deliveryOk = tg.ok
        deliveryError = tg.ok
          ? tg.media_errors?.length
            ? tg.error || null
            : null
          : tg.error || 'Telegram delivery failed. The answer was not sent to Telegram.'
      }
    }

    // After Telegram delivery, Telegram keeps a copy — delete R2 media to save storage
    // (unless also publishing publicly). Email keeps R2 links live in the inbox.
    let finalCover = cover_url
    let finalAudio = audio_url
    let finalVideo = video_url
    if (deliveryOk && channel === 'telegram' && !publishPublic) {
      const { deletePublicUrlsFromR2 } = await import('@/lib/cms/r2')
      await deletePublicUrlsFromR2([cover_url, audio_url, video_url])
      finalCover = null
      finalAudio = null
      finalVideo = null
    }

    const row = await answerQuestionSubmission({
      id,
      greeting: greeting || null,
      answer,
      description: description || null,
      cover_url: finalCover,
      audio_url: finalAudio,
      video_url: finalVideo,
      published_public: publishPublic,
      answered_by: gate.ctx.user.email || null,
      answer_channel: channel,
      email_sent,
      email_error,
      delivery_status: deliveryOk ? 'sent' : 'failed',
      delivery_error: deliveryError,
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

    if (!deliveryOk) {
      return NextResponse.json({
        ok: false,
        delivery_ok: false,
        row,
        answer_channel: channel,
        delivery_status: 'failed',
        email_sent: false,
        email_error: channel === 'email' ? deliveryError : null,
        error:
          channel === 'telegram'
            ? `⚠️ Telegram delivery failed.\n\n${deliveryError || 'The answer was not sent to Telegram.'}\nPlease try again. (Channel is locked to the visitor’s choice.)`
            : `⚠️ Email delivery failed.\n\n${deliveryError || 'The answer was not sent by email.'}`,
        message:
          channel === 'telegram'
            ? `Answer saved, but Telegram delivery failed: ${deliveryError}`
            : `Answer saved, but email was not sent: ${deliveryError}`,
      })
    }

    return NextResponse.json({
      ok: true,
      delivery_ok: true,
      row,
      answer_channel: channel,
      delivery_status: 'sent',
      email_sent: channel === 'email',
      email_error: null,
      message:
        channel === 'telegram'
          ? deliveryError
            ? `✓ Answer text sent by Telegram (media warning: ${deliveryError})`
            : '✓ Answer sent by Telegram (text + any attached media)'
          : `✓ Answer sent by email to ${existing.auth_email}.`,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Answer failed.' },
      { status: 400 }
    )
  }
}
