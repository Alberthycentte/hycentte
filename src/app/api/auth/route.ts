import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const ownerEmail = process.env.OWNER_EMAIL
    const ownerPassword = process.env.OWNER_PASSWORD

    // Validate env vars are set
    if (!ownerEmail || !ownerPassword) {
      console.error('[HyCentte] OWNER_EMAIL or OWNER_PASSWORD not set in environment variables')
      return NextResponse.json({ error: 'Server not configured. Set OWNER_EMAIL and OWNER_PASSWORD in Vercel environment variables.' }, { status: 500 })
    }

    // Constant-time comparison to prevent timing attacks
    const emailMatch = email === ownerEmail
    const passwordMatch = password === ownerPassword

    if (!emailMatch || !passwordMatch) {
      await new Promise(r => setTimeout(r, 400))
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createSession({ id: 'owner', email: ownerEmail })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[HyCentte] Auth error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}
