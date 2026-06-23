@AGENTS.md

## 認証（Google OAuth）トラブルシューティングの経緯

本番でGoogleログイン関連の不具合が再発したら、まずここを確認すること。

- **症状**: 本番（Vercel）でGoogleログインが認証ループに陥り、ログインできなかった。
- **根本原因**: Vercelの環境変数 `NEXT_PUBLIC_SUPABASE_ANON_KEY` に旧JWT形式のキー
  （`eyJ...` 形式）が設定されており、アプリ/Supabaseが前提とする新しい
  publishable key（`sb_publishable_...` 形式）と不一致だった。これにより
  Supabaseが「Invalid API key」を返していた。
- **解決**: Vercelの環境変数の値を正しいpublishable keyに修正し、再デプロイした。
  （`NEXT_PUBLIC_` はビルド時にバンドルへ焼き込まれるため、値の変更後は必ず再デプロイが必要）

### 補足で判明した設計上のポイント

- publishable key を client/server 両方で採用する構成が正しい。secret key は使わない。
- Vercelのプロキシ背後では origin 取得に `x-forwarded-host` への対応が必要。
- `src/app/api/auth/callback/route.ts` には認証エラー切り分け用の診断コード
  （`?error=nocode` / `?error=exchange&reason=...` のエラーリダイレクト分岐）を
  意図的に残している。将来のトラブルシュート用なので削除しないこと。
