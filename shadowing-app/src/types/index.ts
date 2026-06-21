export type Session = {
  id: string
  user_id: string
  video_id: string
  title: string
  youtube_url: string
  created_at: string
}

export type Clip = {
  id: string
  session_id: string
  start_time: number
  end_time: number
  label: string | null
  subtitle_text: string | null
  created_at: string
}

export type SubtitleEntry = {
  start: number
  duration: number
  text: string
}
