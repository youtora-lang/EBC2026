'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Mic, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UserMenu() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ログイン中ユーザーのメール（頭文字フォールバック用）とGoogleプロフィール画像を取得
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      const meta = data.user?.user_metadata
      setAvatarUrl(meta?.avatar_url ?? meta?.picture ?? null)
    })
  }, [supabase])

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initial = (email?.trim()[0] ?? '?').toUpperCase()
  const showImage = avatarUrl && !avatarFailed

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-colors cursor-pointer ${
            showImage
              ? 'bg-[#1A1A1A]'
              : 'bg-[#FF6B35] hover:bg-[#FF8555] text-white text-sm font-semibold'
          }`}
          aria-label="ユーザーメニュー"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            initial
          )}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg shadow-black/40 py-1.5 z-50"
          >
            <button
              role="menuitem"
              onClick={() => {
                setAboutOpen(true)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-[#9A9A9A]" />
              About
            </button>

            <button
              role="menuitem"
              disabled
              aria-disabled="true"
              className="w-full flex items-center justify-between gap-2.5 px-3 py-2 text-sm text-[#5A5A5A] cursor-not-allowed"
            >
              <span className="flex items-center gap-2.5">
                <Mic className="w-4 h-4" />
                My Recordings
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[#5A5A5A] border border-[#2A2A2A] rounded px-1 py-0.5">
                Soon
              </span>
            </button>

            <div className="my-1 border-t border-[#2A2A2A]" />

            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#9A9A9A]" />
              Log out
            </button>
          </div>
        )}
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </>
  )
}

function AboutModal({ onClose }: { onClose: () => void }) {
  // Escキーでも閉じられるようにする
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="About Mimicking App"
        className="w-full max-w-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-[#FF6B35]" />
          <h2 className="text-white font-semibold">Mimicking App</h2>
        </div>

        <p className="text-[#C9C9C9] text-sm leading-relaxed">
          Made to celebrate PLAT ABC ENGLISH BOOT CAMP 2026 — it&apos;s for
          practicing the &quot;mimicking&quot; homework from Day 1 of class. No
          random videos or ads popping up, so you can just focus on the video you
          picked and repeat it as many times as you want.
        </p>

        <p className="text-[#9A9A9A] text-sm mt-4">Made with love by Chii</p>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-lg text-sm font-medium bg-[#FF6B35] hover:bg-[#FF8555] text-white transition-colors cursor-pointer"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
