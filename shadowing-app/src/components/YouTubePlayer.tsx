'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import YouTube, { YouTubeProps, YouTubePlayer as YTPlayer } from 'react-youtube'
import { usePracticeStore } from '@/store/practiceStore'

// 待機中に表示するポスター画像の解像度フォールバック順（16:9高解像度→なければ4:3標準）
const POSTER_QUALITIES = ['maxresdefault', 'hqdefault'] as const

type Props = {
  videoId: string
  /** 比較画面から内部playerを受け取るためのコールバック */
  onPlayerReady?: (player: YTPlayer) => void
  /** 比較画面ではループ・シーク制御を無効にする */
  disablePracticeControls?: boolean
  /** 比較モードでプレイヤー準備完了時にシークする位置（秒） */
  seekToOnReady?: number
  /** 再生が実際に開始した（PLAYING遷移）瞬間に呼ばれる。録画と同期するために使用。 */
  onPlayStart?: () => void
}

export default function YouTubePlayer({ videoId, onPlayerReady, disablePracticeControls = false, seekToOnReady, onPlayStart }: Props) {
  const playerRef = useRef<YTPlayer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // 初回シーク(onReady)由来の自動再生を一度だけ抑制するためのフラグとタイマー
  const suppressAutoplayRef = useRef(false)
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 待機中ポスター：再生開始でフェードアウト。posterLevelは解像度フォールバックの段階。
  // （videoIdは本アプリでは画面ごとに固定＝マウント中は不変のため、リセット不要）
  const [hasStarted, setHasStarted] = useState(false)
  const [posterLevel, setPosterLevel] = useState(0)
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
  useEffect(() => () => { if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current) }, [])

  const onReady: YouTubeProps['onReady'] = (e) => {
    playerRef.current = e.target
    onPlayerReady?.(e.target)

    // 明示的な再生(playVideo)が呼ばれたら自動再生抑制を解除する。
    // 録画(handleToggleRecord)や比較の同時再生(handlePlay)はいずれもplayVideo経由なので、
    // ユーザー起点の再生は抑制対象から確実に外れる。
    // 一方、初回のautoplayはseekToの副作用でありplayVideoを経由しないため、影響を受けず抑制される。
    const player = e.target
    const originalPlay = player.playVideo.bind(player)
    player.playVideo = () => {
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
      suppressAutoplayRef.current = false
      originalPlay()
    }

    let didSeek = false
    if (disablePracticeControls) {
      // 比較モード：録画開始時点の位置へシーク
      if (seekToOnReady !== undefined && seekToOnReady > 0) {
        e.target.seekTo(seekToOnReady, true)
        didSeek = true
      }
    } else {
      // 練習モード：開始点が設定済みならシーク
      if (startTimeRef.current !== null) {
        e.target.seekTo(startTimeRef.current, true)
        didSeek = true
      }
    }
    // seekTo は cued状態の動画で再生を開始させてしまうため、頭出しのみにして止める。
    // 直後の同期pauseに加え、API側で非同期にPLAYINGへ遷移する場合に備え、
    // 次のPLAYINGを一度だけ抑制する（録画ボタン等の明示再生を妨げないよう時間窓で自動解除）。
    if (didSeek) {
      e.target.pauseVideo()
      suppressAutoplayRef.current = true
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
      suppressTimerRef.current = setTimeout(() => { suppressAutoplayRef.current = false }, 1500)
    }
  }

  const onStateChange: YouTubeProps['onStateChange'] = (e) => {
    // 初回シーク由来の自動再生を一度だけ抑制（練習・比較の両モード共通）。
    // 明示的な再生（録画ボタン等）はonReadyから時間が経っており抑制対象外。
    if (e.data === 1 && suppressAutoplayRef.current) {
      suppressAutoplayRef.current = false
      e.target.pauseVideo()
      return
    }
    // 抑制対象外の本物の再生開始でポスターをフェードアウト（練習・比較の両モード共通）
    if (e.data === 1) setHasStarted(true)
    if (disablePracticeControls) return
    const stateMap: Record<number, 'unstarted' | 'playing' | 'paused' | 'ended'> = {
      [-1]: 'unstarted',
      [1]: 'playing',
      [2]: 'paused',
      [0]: 'ended',
    }
    const state = stateMap[e.data]
    if (state) setPlayerState(state)
    if (e.data === 1) {
      startPolling()
      onPlayStart?.()
    } else {
      stopPolling()
    }
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

  const posterQuality = POSTER_QUALITIES[posterLevel]

  return (
    <div className="relative w-full h-full">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
        iframeClassName="w-full h-full rounded-lg"
      />

      {/* 待機中ポスター：再生開始までサムネイルを重ねて黒画面を防ぐ。
          pointer-events-none でYouTube操作を透過し、再生開始でフェードアウト。 */}
      {posterQuality && (
        <div
          aria-hidden
          className="absolute inset-0"
          // 不透明度はインラインstyleで制御する。Tailwindのopacityユーティリティは
          // この箇所でしか使っておらず、実行中の画面に確実に適用されなかったため、
          // クラス生成に依存しないインラインstyleで確実にフェードさせる。
          style={{
            opacity: hasStarted ? 0 : 1,
            transition: 'opacity 500ms ease',
            pointerEvents: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/${posterQuality}.jpg`}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setPosterLevel((l) => l + 1)}
            onLoad={(e) => {
              // maxres欠落時にYouTubeが返すグレーのダミー画像(120x90, HTTP200)を検出してフォールバック
              if (e.currentTarget.naturalWidth <= 120) setPosterLevel((l) => l + 1)
            }}
          />
          {/* 静止プレビュー感を出す薄いグラデーション（論点2の緩和） */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
    </div>
  )
}
