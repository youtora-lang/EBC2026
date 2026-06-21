'use client'

import { useRef, useEffect, useCallback } from 'react'
import YouTube, { YouTubeProps, YouTubePlayer as YTPlayer } from 'react-youtube'
import { usePracticeStore } from '@/store/practiceStore'

type Props = {
  videoId: string
  /** 比較画面から内部playerを受け取るためのコールバック */
  onPlayerReady?: (player: YTPlayer) => void
  /** 比較画面ではループ・シーク制御を無効にする */
  disablePracticeControls?: boolean
  /** 比較モードでプレイヤー準備完了時にシークする位置（秒） */
  seekToOnReady?: number
}

export default function YouTubePlayer({ videoId, onPlayerReady, disablePracticeControls = false, seekToOnReady }: Props) {
  const playerRef = useRef<YTPlayer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { setPlayerState, setCurrentTime, startTime, endTime, loopEnabled } = usePracticeStore()

  // refで常に最新値を保持（クロージャの古い値問題を回避）
  const startTimeRef = useRef(startTime)
  const endTimeRef = useRef(endTime)
  const loopEnabledRef = useRef(loopEnabled)
  useEffect(() => { startTimeRef.current = startTime }, [startTime])
  useEffect(() => { endTimeRef.current = endTime }, [endTime])
  useEffect(() => { loopEnabledRef.current = loopEnabled }, [loopEnabled])

  // 開始点が変更されたら即座にシーク（練習画面のみ）
  useEffect(() => {
    if (disablePracticeControls || !playerRef.current || startTime === null) return
    playerRef.current.seekTo(startTime, true)
    playerRef.current.pauseVideo()
  }, [startTime, disablePracticeControls])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current || disablePracticeControls) return
    intervalRef.current = setInterval(async () => {
      if (!playerRef.current) return
      try {
        const t = await playerRef.current.getCurrentTime()
        setCurrentTime(t)

        const end = endTimeRef.current
        const start = startTimeRef.current
        const loop = loopEnabledRef.current

        if (end !== null && t >= end) {
          if (loop && start !== null) {
            playerRef.current.seekTo(start, true)
          } else {
            playerRef.current.pauseVideo()
          }
        }
      } catch {}
    }, 200)
  }, [setCurrentTime, disablePracticeControls])

  useEffect(() => () => stopPolling(), [stopPolling])

  const onReady: YouTubeProps['onReady'] = (e) => {
    playerRef.current = e.target
    onPlayerReady?.(e.target)
    if (disablePracticeControls) {
      // 比較モード：録画開始時点の位置へシーク
      if (seekToOnReady !== undefined && seekToOnReady > 0) {
        e.target.seekTo(seekToOnReady, true)
      }
    } else {
      // 練習モード：開始点が設定済みならシーク
      if (startTimeRef.current !== null) {
        e.target.seekTo(startTimeRef.current, true)
      }
    }
  }

  const onStateChange: YouTubeProps['onStateChange'] = (e) => {
    if (disablePracticeControls) return
    const stateMap: Record<number, 'unstarted' | 'playing' | 'paused' | 'ended'> = {
      [-1]: 'unstarted',
      [1]: 'playing',
      [2]: 'paused',
      [0]: 'ended',
    }
    const state = stateMap[e.data]
    if (state) setPlayerState(state)
    if (e.data === 1) startPolling()
    else stopPolling()
  }

  const opts: YouTubeProps['opts'] = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      rel: 0,
      modestbranding: 1,
    },
  }

  return (
    <div className="w-full h-full">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
        iframeClassName="w-full h-full rounded-lg"
      />
    </div>
  )
}
