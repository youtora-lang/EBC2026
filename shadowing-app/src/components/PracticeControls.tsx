'use client'

import { usePracticeStore } from '@/store/practiceStore'
import { Repeat, RefreshCw } from 'lucide-react'

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PracticeControls() {
  const {
    currentTime,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    clearRange,
    loopEnabled,
    toggleLoop,
  } = usePracticeStore()

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-[#0A0A0A]">
      {/* 区間表示 */}
      <div className="flex items-center justify-between text-xs text-[#9A9A9A]">
        <span>
          区間:{' '}
          <span className="text-white font-mono">
            {startTime !== null ? formatTime(startTime) : '--:--'}
          </span>
          {' → '}
          <span className="text-white font-mono">
            {endTime !== null ? formatTime(endTime) : '--:--'}
          </span>
        </span>
        {(startTime !== null || endTime !== null) && (
          <button
            onClick={clearRange}
            className="text-[#9A9A9A] hover:text-[#EF4444] transition-colors text-xs"
          >
            クリア
          </button>
        )}
      </div>

      {/* コントロールボタン群 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 開始点セット */}
        <button
          onClick={() => setStartTime(Math.floor(currentTime * 10) / 10)}
          className="flex-1 min-w-[100px] py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B35] text-white rounded-lg transition-colors"
          title="[ キー"
        >
          [ 開始点
        </button>

        {/* 終了点セット */}
        <button
          onClick={() => setEndTime(Math.floor(currentTime * 10) / 10)}
          className="flex-1 min-w-[100px] py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B35] text-white rounded-lg transition-colors"
          title="] キー"
        >
          ] 終了点
        </button>

        {/* ループ切り替え */}
        <button
          onClick={toggleLoop}
          className={`py-2 px-3 rounded-lg border transition-colors ${
            loopEnabled
              ? 'bg-[#FF6B35]/10 border-[#FF6B35] text-[#FF6B35]'
              : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#9A9A9A]'
          }`}
          aria-pressed={loopEnabled}
          title="L キー"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* キーボードショートカットヒント */}
      <p className="text-[#555] text-xs text-center">
        Space: 再生/停止 &nbsp;|&nbsp; [: 開始点 &nbsp;|&nbsp; ]: 終了点 &nbsp;|&nbsp; L: ループ &nbsp;|&nbsp; R: 録画
      </p>
    </div>
  )
}
