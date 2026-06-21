'use client'

import { usePracticeStore } from '@/store/practiceStore'

export default function SubtitleDisplay() {
  const { activeSubtitle, subtitles } = usePracticeStore()

  if (!subtitles.length) return null

  return (
    <div className="w-full min-h-[3.5rem] flex items-center justify-center px-4 py-3 bg-[#1A1A1A] border-t border-b border-[#2A2A2A]">
      <p
        className="text-white text-xl font-medium text-center leading-snug"
        aria-live="polite"
        aria-label="字幕"
      >
        {activeSubtitle || <span className="text-[#555]">—</span>}
      </p>
    </div>
  )
}
