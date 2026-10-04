import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function resolveAdminCmsBase(): string {
  const rewrite = (process.env.CMS_REWRITE_TARGET || '').replace(/\/+$/, '')
  if (rewrite && !/\/api\/cms$/i.test(rewrite)) return rewrite

  const pub = (process.env.NEXT_PUBLIC_CMS_API_BASE || '').replace(/\/+$/, '')
  if (pub && !/\/api\/cms$/i.test(pub) && !pub.includes('/api/cms')) return pub

  // Local monorepo: Admin runs on :3001
  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:3001/api/public/v1'
  }
  return 'https://admin.sileqelbachin1.com/api/public/v1'
}

const ADMIN_CMS = resolveAdminCmsBase()

/**
 * Same-origin CMS proxy so every visitor’s browser talks to sileqelbachin1.com,
 * not directly to Admin (cold starts / blocks / CORS). Server waits longer for Render.
 */
async function proxy(request: Request, pathParts: string[]) {
  const resource = pathParts.map(encodeURIComponent).join('/')
  if (!resource) {
    return NextResponse.json({ ok: false, error: 'Missing resource' }, { status: 400 })
  }

  const incoming = new URL(request.url)
  const target = new URL(`${ADMIN_CMS}/${resource}`)
  incoming.searchParams.forEach((v, k) => {
    if (k !== 't') target.searchParams.set(k, v)
  })
  target.searchParams.set('t', String(Date.now()))

  const attempts = 3
  let lastErr = 'CMS unreachable'
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(target.toString(), {
        method: request.method === 'POST' ? 'POST' : 'GET',
        headers: {
          Accept: 'application/json',
          ...(request.method === 'POST'
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
        body: request.method === 'POST' ? await request.text() : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      })
      const text = await res.text()
      return new NextResponse(text, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      // brief pause before retry (Render cold start)
      await new Promise(r => setTimeout(r, 800 * (i + 1)))
    }
  }

  return NextResponse.json(
    { ok: false, error: `CMS proxy failed: ${lastErr}` },
    { status: 502 }
  )
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxy(request, path || [])
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxy(request, path || [])
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
