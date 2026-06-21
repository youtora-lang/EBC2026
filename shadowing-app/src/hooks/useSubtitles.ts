import { useEffect } from 'react'
import { usePracticeStore } from '@/store/practiceStore'
import { SubtitleEntry } from '@/types'

export function useSubtitles(videoId: string) {
  const { setSubtitles, currentTime, setActiveSubtitle, subtitles } = usePracticeStore()

  useEffect(() => {
    if (!videoId) return
    fetch(`/api/transcript?videoId=${videoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.subtitles?.length) setSubtitles(data.subtitles)
      })
      .catch(() => {})
  }, [videoId, setSubtitles])

  // 現在時刻に対応する字幕を更新
  useEffect(() => {
    if (!subtitles.length) return
    const active = subtitles.find(
      (s: SubtitleEntry) =>
        currentTime >= s.start && currentTime < s.start + s.duration
    )
    setActiveSubtitle(active?.text ?? '')
  }, [currentTime, subtitles, setActiveSubtitle])
}
