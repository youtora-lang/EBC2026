'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Link as LinkIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { extractVideoId, getThumbnailUrl } from '@/lib/youtube'

type VideoMeta = { videoId: string; title: string }

export default function NewPracticePage() {
  const router = useRouter()

  const [url, setUrl] = useState('')
  const [meta, setMeta] = useState<VideoMeta | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoadVideo = async () => {
    setError(null)
    setMeta(null)
    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('有効なYouTube URLを入力してください')
      return
    }
    setLoadingMeta(true)
    try {
      // oEmbed で動画タイトルを取得
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMeta({ videoId, title: data.title })
      setSessionName(data.title)
    } catch {
      setError('動画を読み込めませんでした。非公開または存在しない動画の可能性があります。')
    } finally {
      setLoadingMeta(false)
    }
  }

  const handleCreate = async () => {
    if (!meta) return
    setLoadingCreate(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data, error: dbError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        video_id: meta.videoId,
        title: sessionName || meta.title,
        youtube_url: url,
      })
      .select()
      .single()

    if (dbError || !data) {
      setError('セッションの作成に失敗しました。')
      setLoadingCreate(false)
      return
    }
    router.push(`/practice/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="border-b border-[#2A2A2A]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 text-[#9A9A9A] hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-semibold">新しい練習を作成</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
        {/* URL入力 */}
        <div className="flex flex-col gap-2">
          <label className="text-[#9A9A9A] text-sm font-medium" htmlFor="youtube-url">
            YouTube URLを貼り付け
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 focus-within:border-[#FF6B35] transition-colors">
              <LinkIcon className="w-4 h-4 text-[#9A9A9A] flex-shrink-0" />
              <input
                id="youtube-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-transparent text-white text-sm py-3 outline-none placeholder:text-[#555]"
              />
            </div>
            <button
              onClick={handleLoadVideo}
              disabled={!url || loadingMeta}
              className="bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B35] text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : '読込'}
            </button>
          </div>
          {error && (
            <p className="text-[#EF4444] text-xs" role="alert">{error}</p>
          )}
        </div>

        {/* 動画プレビュー */}
        {meta && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex gap-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getThumbnailUrl(meta.videoId)}
                alt={meta.title}
                className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-white text-sm font-medium line-clamp-2">{meta.title}</p>
                <p className="text-[#9A9A9A] text-xs mt-1">youtube.com</p>
              </div>
            </div>

            {/* セッション名 */}
            <div className="flex flex-col gap-2">
              <label className="text-[#9A9A9A] text-sm font-medium" htmlFor="session-name">
                セッション名（任意）
              </label>
              <input
                id="session-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] focus:border-[#FF6B35] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-[#555]"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={loadingCreate}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#FF8555] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingCreate ? (
                <><Loader2 className="w-4 h-4 animate-spin" />作成中...</>
              ) : (
                '練習を始める →'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
