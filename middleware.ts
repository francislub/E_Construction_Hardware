// middleware.ts  (project root, next to app/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-invoke-path', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}