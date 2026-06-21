'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Volume2, VolumeX, Download, RotateCcw } from 'lucide-react'
import { usePracticeStore } from '@/store/practiceStore'
import type { YouTubePlayer as YTPlayer } from 'react-youtube'

const YouTubePlayer = dynamic(() => import('@/components/YouTubePlayer'), { ssr: false })

export default function ComparePage() {
  const { clipId } = useParams<{ clipId: string }>()
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v') ?? ''
  const { recordingBlob, recordingStartTime } = usePracticeStore()

  const recordingRef = useRef<HTMLVideoElement>(null)
  const ytPlayerRef = useRef<YTPlayer | null>(null)

  const [ytMuted, setYtMuted] = useState(false)
  const [recMuted, setRecMuted] = useState(true)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ytReady, setYtReady] = useState(false)

  useEffect(() => {
    if (!recordingBlob) return
    const url = URL.createObjectURL(recordingBlob)
    setRecordingUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [recordingBlob])

  // ミュート状態をYouTubeプレイヤーに反映
  useEffect(() => {
    if (!ytPlayerRef.current) return
    if (ytMuted) ytPlayerRef.current.mute()
    else ytPlayerRef.current.unMute()
  }, [ytMuted])

  const handlePlayerReady = (player: YTPlayer) => {
    ytPlayerRef.current = player
    setYtReady(true)
  }

  const handlePlay = () => {
    ytPlayerRef.current?.playVideo()
    recordingRef.current?.play()
    setIsPlaying(true)
  }

  const handlePause = () => {
    ytPlayerRef.current?.pauseVideo()
    recordingRef.current?.pause()
    setIsPlaying(false)
  }

  // 最初からやり直す：YouTube を recordingStartTime へ戻し、録画も先頭へ
  const handleReplay = () => {
    if (ytPlayerRef.current && recordingStartTime !== null) {
      ytPlayerRef.current.seekTo(recordingStartTime, true)
    }
    if (recordingRef.current) {
      recordingRef.current.currentTime = 0
      recordingRef.current.pause()
    }
    setIsPlaying(false)
  }

  if (!recordingBlob) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <p className="text-[#9A9A9A]">録画データがありません</p>
        <Link
          href={`/practice/${clipId}`}
          className="text-[#FF6B35] hover:text-[#FF8555] text-sm transition-colors"
        >
          ← 練習画面に戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <header className="border-b border-[#2A2A2A]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={`/practice/${clipId}`}
            className="p-1.5 text-[#9A9A9A] hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors"
            aria-label="練習に戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-semibold">比較再生</h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* オリジナル動画 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#9A9A9A] text-xs font-medium">オリジナル</span>
              <button
                onClick={() => setYtMuted((v) => !v)}
                className="p-1 text-[#9A9A9A] hover:text-white transition-colors"
                aria-label={ytMuted ? 'オリジナルのミュートを解除' : 'オリジナルをミュート'}
              >
                {ytMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-[#1A1A1A]">
              {videoId && (
                <YouTubePlayer
                  videoId={videoId}
                  onPlayerReady={handlePlayerReady}
                  disablePracticeControls
                  seekToOnReady={recordingStartTime ?? 0}
                />
              )}
            </div>
          </div>

          {/* 自分の録画 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#9A9A9A] text-xs font-medium">あなたの録画</span>
              <button
                onClick={() => setRecMuted((v) => !v)}
                className="p-1 text-[#9A9A9A] hover:text-white transition-colors"
                aria-label={recMuted ? '録画のミュートを解除' : '録画をミュート'}
              >
                {recMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-[#1A1A1A]">
              {recordingUrl && (
                <video
                  ref={recordingRef}
                  src={recordingUrl}
                  muted={recMuted}
                  className="w-full h-full object-cover scale-x-[-1]"
                  playsInline
                />
              )}
            </div>
          </div>
        </div>

        {/* コントロール */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={!ytReady}
            className="bg-[#FF6B35] hover:bg-[#FF8555] text-white font-medium py-2.5 px-8 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPlaying ? '⏸ 一時停止' : '▶ 同時再生'}
          </button>
          <button
            onClick={handleReplay}
            disabled={!ytReady}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B35] text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="最初から"
          >
            <RotateCcw className="w-4 h-4" />
            最初から
          </button>
          {recordingUrl && (
            <a
              href={recordingUrl}
              download={`mimicking-${Date.now()}.webm`}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B35] text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              ダウンロード
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
