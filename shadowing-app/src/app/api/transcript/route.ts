import { NextResponse } from 'next/server'
import { SubtitleEntry } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  try {
    const subtitles = await fetchTimedText(videoId)
    return NextResponse.json({ subtitles })
  } catch {
    return NextResponse.json({ subtitles: [], error: 'No captions available' }, { status: 200 })
  }
}

async function fetchTimedText(videoId: string): Promise<SubtitleEntry[]> {
  // YouTube の TimedText エンドポイントから字幕を取得（非公式）
  const listUrl = `https://www.youtube.com/watch?v=${videoId}`
  const pageRes = await fetch(listUrl, {
    headers: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  const html = await pageRes.text()

  // captionTracksを含むJSONをHTMLから抽出
  const match = html.match(/"captionTracks":(\[.*?\])/)
  if (!match) throw new Error('No caption tracks found')

  const tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }> =
    JSON.parse(match[1])

  // 英語（手動 > 自動生成の順で優先）
  const preferred =
    tracks.find((t) => t.languageCode === 'en' && !t.kind) ||
    tracks.find((t) => t.languageCode === 'en') ||
    tracks[0]

  if (!preferred) throw new Error('No suitable track found')

  const xmlRes = await fetch(preferred.baseUrl)
  const xml = await xmlRes.text()

  return parseTimedText(xml)
}

function parseTimedText(xml: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(xml)) !== null) {
    entries.push({
      start: parseFloat(match[1]),
      duration: parseFloat(match[2]),
      text: decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')),
    })
  }

  return entries
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, ' ')
    .trim()
}
