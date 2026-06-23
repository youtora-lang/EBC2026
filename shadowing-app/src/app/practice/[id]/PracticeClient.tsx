'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Columns2 } from 'lucide-react'
import { Session } from '@/types'
import { usePracticeStore } from '@/store/practiceStore'
import { useSubtitles } from '@/hooks/useSubtitles'
import AppHeader from '@/components/AppHeader'
import SubtitleDisplay from '@/components/SubtitleDisplay'
import PracticeControls from '@/components/PracticeControls'
import WebcamRecorder from '@/components/WebcamRecorder'

const YouTubePlayer = dynamic(() => import('@/components/YouTubePlayer'), { ssr: false })

type Props = { session: Session }

export default function PracticeClient({ session }: Props) {
  const {
    currentTime,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    toggleLoop,
    recordingBlob,
  } = usePracticeStore()

  useSubtitles(session.video_id)

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.key) {
        case '[':
          setStartTime(Math.floor(currentTime * 10) / 10)
          break
        case ']':
          setEndTime(Math.floor(currentTime * 10) / 10)
          break
        case 'l':
        case 'L':
          toggleLoop()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentTime, setStartTime, setEndTime, toggleLoop])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* ヘッダー */}
      <AppHeader
        left={
          <>
            <Link
              href="/dashboard"
              className="p-1.5 text-[#9A9A9A] hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors flex-shrink-0"
              aria-label="一覧へ戻る"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-white font-medium text-sm truncate">{session.title}</h1>
          </>
        }
        actions={
          recordingBlob && (
            <Link
              href={`/compare/${session.id}?v=${session.video_id}`}
              className="flex items-center gap-1.5 text-sm text-[#FF6B35] hover:text-[#FF8555] transition-colors flex-shrink-0"
            >
              <Columns2 className="w-4 h-4" />
              比較再生
            </Link>
          )
        }
      />

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full">
        {/* 左：YouTube */}
        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-[#1A1A1A]">
            <YouTubePlayer videoId={session.video_id} />
          </div>
        </div>

        {/* 右：ウェブカメラ */}
        <div className="lg:w-80 p-4 flex flex-col gap-4 lg:border-l border-[#2A2A2A]">
          <WebcamRecorder />
        </div>
      </div>

      {/* 字幕 */}
      <SubtitleDisplay />

      {/* コントロール */}
      <PracticeControls />
    </div>
  )
}
