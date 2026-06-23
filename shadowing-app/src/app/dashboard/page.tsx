import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Mic } from 'lucide-react'
import { getThumbnailUrl } from '@/lib/youtube'
import { Session } from '@/types'
import AppHeader from '@/components/AppHeader'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ヘッダー */}
      <AppHeader
        maxWidth="max-w-4xl"
        left={
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#FF6B35]" />
            <span className="font-semibold text-white">Mimicking App</span>
          </div>
        }
        actions={
          <Link
            href="/practice/new"
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#FF8555] text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新しい練習
          </Link>
        }
      />

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {sessions && sessions.length > 0 ? (
          <>
            <h2 className="text-[#9A9A9A] text-sm font-medium mb-4">最近の練習</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {sessions.map((session: Session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  return (
    <Link
      href={`/practice/${session.id}`}
      className="flex gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 hover:border-[#FF6B35]/40 transition-colors group"
    >
      {/* サムネイル */}
      <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#2A2A2A]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getThumbnailUrl(session.video_id)}
          alt={session.title}
          className="w-full h-full object-cover"
        />
      </div>
      {/* テキスト */}
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-[#FF6B35] transition-colors">
          {session.title}
        </p>
        <p className="text-[#9A9A9A] text-xs mt-0.5">
          {new Date(session.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
        <Mic className="w-8 h-8 text-[#2A2A2A]" />
      </div>
      <div className="text-center">
        <p className="text-white font-medium">まだ練習がありません</p>
        <p className="text-[#9A9A9A] text-sm mt-1">YouTubeのURLを貼り付けて練習を始めましょう</p>
      </div>
      <Link
        href="/practice/new"
        className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF8555] text-white font-medium py-2.5 px-5 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        最初の練習を始める
      </Link>
    </div>
  )
}
