import type { ReactNode } from 'react'
import UserMenu from './UserMenu'

type Props = {
  /** ヘッダー左側のページ固有コンテンツ（ロゴ、戻る矢印＋タイトル等） */
  left?: ReactNode
  /** ユーザーアイコンの左に並ぶページ固有アクション（新しい練習、比較再生等） */
  actions?: ReactNode
  /** 中央寄せコンテナの最大幅。既定は max-w-6xl、ダッシュボードのみ max-w-4xl。 */
  maxWidth?: string
}

export default function AppHeader({ left, actions, maxWidth = 'max-w-6xl' }: Props) {
  return (
    <header className="border-b border-[#2A2A2A] bg-[#0A0A0A] sticky top-0 z-20 flex-shrink-0">
      <div className={`${maxWidth} mx-auto px-4 h-14 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3 min-w-0">{left}</div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
