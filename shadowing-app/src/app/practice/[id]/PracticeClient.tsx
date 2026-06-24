'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Columns2 } from 'lucide-react'
import type { YouTubePlayer as YTPlayer } from 'react-youtube'
import { Session } from '@/types'
import { usePracticeStore } from '@/store/practiceStore'
import { useSubtitles } from '@/hooks/useSubtitles'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
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
    setStartTime,
    setEndTime,
    toggleLoop,
    recordingBlob,
    isRecording,
  } = usePracticeStore()

  // 司令塔として保持する参照（ストアには非シリアライズなオブジェクトを入れない）
  const playerRef = useRef<YTPlayer | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pendingRecordRef = useRef(false)
  const { startRecording, stopRecording } = useMediaRecorder(streamRef)

  useSubtitles(session.video_id)

  // 録画ボタン: まずお手本を練習区間の開始位置(未設定なら0)へ送り再生。
  // 実際にPLAYINGになった瞬間(handlePlayStart)に録画を開始する。
  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording()
      return
    }
    const anchor = startTime ?? 0
    pendingRecordRef.current = true
    const player = playerRef.current
    if (player) {
      player.seekTo(anchor, true)
      player.playVideo()
    }
  }

  // お手本が実再生開始した瞬間。録画要求中なら、その位置を基準に録画を開始。
  const handlePlayStart = () => {
    if (!pendingRecordRef.current) return
    pendingRecordRef.current = false
    startRecording(startTime ?? 0)
  }

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
            <YouTubePlayer
              videoId={session.video_id}
              onPlayerReady={(p) => { playerRef.current = p }}
              onPlayStart={handlePlayStart}
            />
          </div>
        </div>

        {/* 右：ウェブカメラ */}
        <div className="lg:w-80 p-4 flex flex-col gap-4 lg:border-l border-[#2A2A2A]">
          <WebcamRecorder
            onStreamReady={(s) => { streamRef.current = s }}
            onToggleRecord={handleToggleRecord}
          />
        </div>
      </div>

      {/* 字幕 */}
      <SubtitleDisplay />

      {/* コントロール */}
      <PracticeControls />
    </div>
  )
}
