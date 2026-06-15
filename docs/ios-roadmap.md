# iOS（iPhone アプリ）移行ロードマップ

Web 版は最初から iOS を見据えて作られています。バックエンド（REST + Socket.IO）は
クライアント非依存なので、**そのまま再利用**できます。ここでは iOS ネイティブ版を作る際の
指針をまとめます。

## 1. そのまま使えるもの

- **API すべて**: `docs/api.md` の REST エンドポイントと Socket.IO イベント。
- **認証方式**: メール+パスワード → JWT（`Authorization: Bearer`）。Keychain にトークン保存。
- **データモデル**: `server/src/types.ts` の型をそのまま Swift の `Codable` 構造体に写す。
- **アバター**: サーバー生成の SVG。iOS では `SVGKit` などで描画、または PNG 変換版を用意。

## 2. 推奨スタック（ネイティブ）

- **SwiftUI**（iOS 16+）。Web のスマホ枠 UI がそのまま画面設計の下敷きになる。
- スワイプデッキ: `DragGesture` + `rotationEffect` + `offset` で Web の `SwipeCard` を再現。
- リアルタイム: `socket.io-client-swift`。
- 画像キャッシュ: `Nuke` か `Kingfisher`。
- ネットワーク: `URLSession` + `async/await`。薄い API クライアントは `web/src/api/client.ts` と同型。

## 3. クロスプラットフォームで素早く出すなら

- **React Native + Expo**: 本リポジトリの `web/src` のロジック（`api/`, `store/`, `lib/`,
  React Query フック）はほぼそのまま流用でき、`components/`・`pages/` を RN コンポーネントに
  置き換えるだけで済む。最短で iOS/Android 両対応にできる選択肢。

## 4. iOS 固有で追加するもの

- **プッシュ通知（APNs）**: 新規マッチ・新着メッセージ。サーバー側に通知送信を追加
  （`emitToUser` と同じ箇所でデバイストークンへ送信）。
- **Sign in with Apple**: App Store 審査要件。`/auth` にプロバイダ連携を追加。
- **写真アップロード**: 現状は data URL をインラインで送る MVP 実装。iOS では署名付き URL +
  オブジェクトストレージ（S3 等）へ差し替えるのが望ましい。
- **位置情報**: `location` は現在テキスト。`CoreLocation` で取得し、距離ベースの発見に拡張可能
  （サーバーに緯度経度カラムと距離計算を追加）。
- **App Tracking Transparency / プライバシー**: 各種同意フローと利用規約。

## 5. サーバー側で本番に向けて足すもの

- SQLite → PostgreSQL（同期 API のままでも `pg` 等へ移行しやすいよう DB アクセスは `db.ts` に集約済み）。
- レート制限、通報のモデレーション管理画面、画像審査。
- メール認証・パスワードリセット。
