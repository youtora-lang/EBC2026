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

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    // 録画開始時点のYouTube位置を保存（比較再生の同期基準）
    setRecordingStartTime(currentTime)
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

  const toggleRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      stopRecording()
    } else {
      startRecording()
    }
  }, [startRecording, stopRecording])

  return { toggleRecording, startRecording, stopRecording }
}
