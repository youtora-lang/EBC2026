import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SubtitleEntry } from '@/types'

type PlayerState = 'unstarted' | 'playing' | 'paused' | 'ended'

type PracticeStore = {
  // 再生
  playerState: PlayerState
  setPlayerState: (s: PlayerState) => void
  currentTime: number
  setCurrentTime: (t: number) => void

  // 練習区間
  startTime: number | null
  endTime: number | null
  setStartTime: (t: number) => void
  setEndTime: (t: number) => void
  clearRange: () => void

  // ループ
  loopEnabled: boolean
  toggleLoop: () => void

  // 字幕
  subtitles: SubtitleEntry[]
  setSubtitles: (s: SubtitleEntry[]) => void
  activeSubtitle: string
  setActiveSubtitle: (s: string) => void

  // 録音・録画
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  recordingBlob: Blob | null
  setRecordingBlob: (b: Blob | null) => void
  /** 録画開始時点のYouTube再生位置（比較再生の同期基準） */
  recordingStartTime: number | null
  setRecordingStartTime: (t: number | null) => void
}

export const usePracticeStore = create<PracticeStore>()(
  persist(
    (set) => ({
      playerState: 'unstarted',
      setPlayerState: (s) => set({ playerState: s }),
      currentTime: 0,
      setCurrentTime: (t) => set({ currentTime: t }),

      startTime: null,
      endTime: null,
      setStartTime: (t) => set({ startTime: t }),
      setEndTime: (t) => set({ endTime: t }),
      clearRange: () => set({ startTime: null, endTime: null }),

      loopEnabled: true,
      toggleLoop: () => set((s) => ({ loopEnabled: !s.loopEnabled })),

      subtitles: [],
      setSubtitles: (s) => set({ subtitles: s }),
      activeSubtitle: '',
      setActiveSubtitle: (s) => set({ activeSubtitle: s }),

      isRecording: false,
      setIsRecording: (v) => set({ isRecording: v }),
      recordingBlob: null,
      setRecordingBlob: (b) => set({ recordingBlob: b }),
      recordingStartTime: null,
      setRecordingStartTime: (t) => set({ recordingStartTime: t }),
    }),
    {
      name: 'practice-store',
      // recordingBlobはシリアライズ不可のため永続化対象外
      partialize: (s) => ({
        loopEnabled: s.loopEnabled,
        startTime: s.startTime,
        endTime: s.endTime,
        recordingStartTime: s.recordingStartTime,
      }),
    }
  )
)
