import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Rutas que un visitante sin sesión puede abrir. /s/ no es el MVP. */
export function isPublicPath(pathname: string) {
  if (pathname === '/login' || pathname.startsWith('/login/')) return true
  if (pathname === '/auth' || pathname.startsWith('/auth/')) return true
  if (pathname === '/l' || pathname.startsWith('/l/')) return true
  return false
}

export async function updateSession(request: NextRequest) {
  const isPublic = isPublicPath(request.nextUrl.pathname)

  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    if (isPublic) {
      return NextResponse.next({ request })
    }
    return new NextResponse('No se pudo verificar la sesión.', { status: 503 })
  }
}
