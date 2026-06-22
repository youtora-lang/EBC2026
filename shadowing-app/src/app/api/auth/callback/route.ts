import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Vercel等のプロキシ背後では x-forwarded-host が本来のホスト。あればそれを優先。
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin

  // code が無ければ交換不可。明示的にエラー遷移。
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=auth`)
  }

  // 成功時に返すレスポンスを先に生成し、Cookieはこのレスポンスへ直接書き込む（proxy.tsと同じ堅牢な方式）。
  const response = NextResponse.redirect(`${baseUrl}/dashboard`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // 交換失敗時は無言で /dashboard に飛ばさず、原因を可視化して / へ戻す。
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=auth`)
  }

  // 成功時のみ、Cookieが書き込まれた response（/dashboard へのリダイレクト）を返す。
  return response
}
