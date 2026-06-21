'use client'

import { useRef, useEffect, useState } from 'react'
import { usePracticeStore } from '@/store/practiceStore'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { VideoOff, AlertCircle } from 'lucide-react'

export default function WebcamRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [camReady, setCamReady] = useState(false)
  const { isRecording, recordingBlob } = usePracticeStore()
  const { toggleRecording } = useMediaRecorder(streamRef)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCamReady(true)
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          setCamError('カメラとマイクへのアクセスが拒否されました。ブラウザの設定から許可してください。')
        } else {
          setCamError('カメラを起動できませんでした。')
        }
      })

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  if (camError) {
    return (
      <div className="w-full h-full rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col items-center justify-center gap-3 p-4">
        <AlertCircle className="w-8 h-8 text-[#EF4444]" />
        <p className="text-[#9A9A9A] text-xs text-center leading-relaxed">{camError}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* カメラ映像 */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {!camReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-[#2A2A2A]" />
          </div>
        )}
        {/* RECインジケーター */}
        {isRecording && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/70 rounded-full px-2 py-1"
            aria-live="assertive"
            aria-label="録音中"
          >
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-white text-xs font-medium">REC</span>
          </div>
        )}
      </div>

      {/* 録音ボタン */}
      <button
        onClick={toggleRecording}
        disabled={!camReady}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isRecording
            ? 'bg-[#EF4444] hover:bg-red-400 text-white'
            : 'bg-[#FF6B35] hover:bg-[#FF8555] text-white'
        }`}
        aria-label={isRecording ? '録画を停止' : '録画を開始'}
      >
        {isRecording ? '■ 録画停止' : '● 録画開始'}
      </button>

      {/* 録画完了時のダウンロードボタン */}
      {recordingBlob && !isRecording && (
        <a
          href={URL.createObjectURL(recordingBlob)}
          download={`shadowing-${Date.now()}.webm`}
          className="w-full py-2 rounded-lg text-sm font-medium text-center bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF6B35] text-white transition-colors"
        >
          ↓ 録画をダウンロード
        </a>
      )}
    </div>
  )
}
