import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hycentte-dev-fallback-secret'
)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('session')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
      await jwtVerify(token, SECRET)
      return NextResponse.next()
    } catch {
      // Token invalid or expired
      const res = NextResponse.redirect(new URL('/login', req.url))
      res.cookies.set('session', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login') {
    const token = req.cookies.get('session')?.value
    if (token) {
      try {
        await jwtVerify(token, SECRET)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } catch {
        // Invalid token, let them see login
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
