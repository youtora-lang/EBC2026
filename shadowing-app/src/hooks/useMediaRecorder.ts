import { useRef, useCallback } from 'react'
import { usePracticeStore } from '@/store/practiceStore'

function getSupportedMimeType(): string {
  const types = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function useMediaRecorder(streamRef: React.RefObject<MediaStream | null>) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const { setIsRecording, setRecordingBlob, currentTime, setRecordingStartTime } = usePracticeStore()

  // startPosition: お手本が実際に再生開始した位置（比較再生の同期基準）。
  // 省略時は従来どおり現在のYouTube位置にフォールバック。
  const startRecording = useCallback((startPosition?: number) => {
    if (!streamRef.current) return
    setRecordingStartTime(startPosition ?? currentTime)
    chunksRef.current = []
    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      setRecordingBlob(blob)
    }
    recorder.start(100)
    setIsRecording(true)
  }, [streamRef, setIsRecording, setRecordingBlob, currentTime, setRecordingStartTime])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    setIsRecording(false)
  }, [setIsRecording])

  return { startRecording, stopRecording }
}
