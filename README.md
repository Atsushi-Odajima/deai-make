# Mingle 💙

**趣味でつながる、あたらしいSNS。** 投稿をシェアし、検索で気になる人を見つけて、気軽にDM。

Mingle は Instagram ライクな投稿フィードを中心に、**恋愛・異性紹介を目的としたサービスではなく**、
共通の趣味・関心でつながるソーシャルアプリとして設計しています。マッチングではなく「検索 →
プロフィール → 気軽にDM」という導線が中心で、コミュニティ掲示板も備えています。

> このリポジトリはまず **Web 版** を実装しています。バックエンドは REST + リアルタイム API として
> 設計しており、**将来的な iPhone アプリ（iOS）でもそのまま再利用できる**ことを前提にしています。

---

## 実装範囲と確認先

- Web版の試作であり、iOSネイティブアプリは実装していません。
- 年齢入力・ブロック・通報の実装は、実サービスの本人確認やモデレーション運用の完了を意味しません。

実装箇所：[server/src/routes](./server/src/routes) / [server/src/realtime.ts](./server/src/realtime.ts) / [web/src/pages](./web/src/pages) / [server/src/seed.ts](./server/src/seed.ts)。

## ✨ 主な機能

| 機能 | 説明 |
| --- | --- |
| 認証・年齢確認 | メール+パスワード登録 / ログイン（JWT）。18歳以上のみ登録可。@ユーザー名を自動発行。 |
| オンボーディング | ひとこと・自己紹介・エリア・趣味タグ・写真をステップ形式で設定。 |
| ホームフィード | フォロー中＋自分の投稿のタイムライン（Instagram風）。ダブルタップでいいね。 |
| 投稿 | 写真＋キャプションを投稿。いいね・コメント。プロフィールはグリッド表示。 |
| 検索・発見 | 名前 / @ユーザー名 / 趣味でユーザー検索。Explore グリッドで投稿を発見。 |
| フォロー | フォロー / フォロワー。おすすめユーザー（ストーリーズ風レール）。 |
| DM | マッチ不要。プロフィールや掲示板から誰にでも気軽にメッセージ（入力中表示・既読）。 |
| 掲示板 | カテゴリ別（雑談・募集・質問・イベント・趣味・売買）のスレッド＋コメント。投稿者にDMも。 |
| プロフィール編集 | 写真、ユーザー名、リンク、趣味タグ、自己紹介などを編集。 |
| 設定 | 検索表示のオン/オフ、年齢表示。 |
| 安全機能 | ブロック・通報（理由選択）。 |

サーバー生成のグラデーションアバター（オフラインでも常に画像が表示される）、自己ホストの
**BIZ UDPGothic（UD新ゴ系のユニバーサルデザインゴシック）** フォントなど、細部までこだわっています。

---

## 🏗 アーキテクチャ

```
deai-make/
├── server/   # REST + Socket.IO API（Node + Express + TypeScript + SQLite）
│   └── src/
│       ├── index.ts        # エントリポイント
│       ├── db.ts           # SQLite スキーマ & マッパー
│       ├── auth.ts         # JWT / 認証ミドルウェア
│       ├── realtime.ts     # Socket.IO（DM・通知）
│       ├── avatar.ts       # SVG グラデーションアバター生成
│       ├── seed.ts         # デモデータ投入
│       └── routes/         # auth / users / posts / conversations / messages / board / safety
└── web/      # React + TypeScript + Vite フロントエンド
    └── src/
        ├── api/            # 型定義・fetch クライアント・React Query フック
        ├── store/          # 認証ストア（zustand）
        ├── lib/            # socket / リアルタイム連携 / 時刻整形
        ├── components/     # SwipeCard, MatchModal, Sheet, Avatar, アイコン etc.
        ├── pages/          # 各画面
        └── styles/         # デザインシステム（青系）
```

**設計方針（iOS を見据えて）**

- フロントとサーバーを完全に分離。UI は API の REST 契約だけに依存。
- API は相対パス（`/api/...`）+ Bearer JWT + Socket.IO という、モバイルでも素直に使える構成。
- `web/src/api/types.ts` と `server/src/types.ts` が API 契約の単一の真実。iOS 実装時はこの型を
  Swift に写すだけで同じバックエンドに接続できる。
- アバターはサーバーが SVG を生成するため外部依存ゼロ。デモも本番もオフラインで成立。
- UI は最初から「スマホ枠」（最大幅のシェル + 下タブ + セーフエリア対応）でレイアウトしており、
  iOS のネイティブ移植時に違和感が出ないようにしている。

詳しい iOS 移行ロードマップは [`docs/ios-roadmap.md`](docs/ios-roadmap.md) を参照。
API の一覧は [`docs/api.md`](docs/api.md) を参照。

---

## 🚀 ローカルでの起動

前提: Node.js 20+ 推奨（開発は Node 22 で確認）。

### 1. バックエンド

```bash
cd server
npm install
cp .env.example .env      # 任意。デフォルト値でも動作します
npm run seed              # デモユーザー・マッチ・チャットを投入
npm run dev               # http://localhost:4000
```

### 2. フロントエンド

```bash
cd web
npm install
npm run dev               # http://localhost:5173
```

ブラウザで http://localhost:5173 を開く。Vite の dev プロキシが `/api` と `/socket.io` を
バックエンド（4000）へ転送します。

### デモアカウント

```
email:    you@mingle.app
password: password123
```

すでに「あなたへのいいね」やマッチ済みのトークが用意されているので、すぐに全機能を試せます。

---

## 🧱 技術スタック

- **Backend**: Node.js, Express, TypeScript, better-sqlite3, jsonwebtoken, bcryptjs, Socket.IO, Zod
- **Frontend**: React 18, TypeScript, Vite, React Router, TanStack Query, Zustand, Framer Motion, socket.io-client
- **デザイン**: 青系のカスタムデザインシステム（CSS 変数）。モバイルファースト。

---

## 📦 ビルド

```bash
cd server && npm run build   # dist/ に出力（npm start で起動）
cd web && npm run build      # dist/ に静的ファイルを出力
```

本番では web の静的ファイルを任意のホスティングに、API を Node 環境にデプロイし、
リバースプロキシで `/api` と `/socket.io` を API に向ければ配備できます。公開前に認証・Origin・秘密鍵・保存先を設定し、動作とアクセス制御を確認してください。

---

## 🔒 安全性とコンプライアンスについて

Mingle は趣味・関心でつながることを目的としたSNSであり、**異性紹介事業ではありません**。
18歳未満の利用を防ぐための年齢確認、ブロック・通報機能を備えています。実運用時は利用規約・
プライバシーポリシーの整備、通報のモデレーション運用、画像審査などを追加してください。
