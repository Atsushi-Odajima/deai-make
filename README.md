# Mingle 💙

**趣味でつながる、あたらしいSNS。** スワイプで気の合う人を見つけて、マッチしたらそのままトーク。

Mingle は Tinder のスワイプ体験をベースにしつつ、**恋愛・異性紹介を目的としたサービスではなく**、
共通の趣味・関心でつながるソーシャルアプリとして設計しています。性別に関係なく「気の合う人」を
見つけることがコンセプトです。

> このリポジトリはまず **Web 版** を実装しています。バックエンドは REST + リアルタイム API として
> 設計しており、**将来的な iPhone アプリ（iOS）でもそのまま再利用できる**ことを前提にしています。

---

## ✨ 主な機能

| 機能 | 説明 |
| --- | --- |
| 認証・年齢確認 | メール+パスワード登録 / ログイン（JWT）。18歳以上のみ登録可。 |
| オンボーディング | ひとこと・自己紹介・エリア・趣味タグ・写真をステップ形式で設定。 |
| スワイプ発見 | ドラッグ操作の Tinder 風カードデッキ。Like / Pass / Super Like、戻る（Rewind）。 |
| マッチング | お互いが Like するとマッチ成立。リアルタイムで「マッチ」演出。 |
| あなたへのいいね | 自分に Like を送った人の一覧。Like を返すとマッチ。 |
| トーク | マッチ相手とリアルタイムチャット（入力中表示・既読）。 |
| プロフィール編集 | 写真（複数・メイン設定）、趣味タグ、自己紹介などを編集。 |
| 設定 | 発見表示のオン/オフ、年齢表示、表示する年齢範囲。 |
| 安全機能 | ブロック・通報（理由選択）。マッチ解除。 |

スコアリングされたデッキ（共通の趣味の多さ・自分への Like を優先表示）、サーバー生成の
グラデーションアバター（オフラインでも常に画像が表示される）など、細部までこだわっています。

---

## 🏗 アーキテクチャ

```
deai-make/
├── server/   # REST + Socket.IO API（Node + Express + TypeScript + SQLite）
│   └── src/
│       ├── index.ts        # エントリポイント
│       ├── db.ts           # SQLite スキーマ & マッパー
│       ├── auth.ts         # JWT / 認証ミドルウェア
│       ├── realtime.ts     # Socket.IO（チャット・マッチ通知）
│       ├── avatar.ts       # SVG グラデーションアバター生成
│       ├── seed.ts         # デモデータ投入
│       └── routes/         # auth / users / discovery / swipes / matches / messages / safety
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
リバースプロキシで `/api` と `/socket.io` を API に向ければそのまま動きます。

---

## 🔒 安全性とコンプライアンスについて

Mingle は趣味・関心でつながることを目的としたSNSであり、**異性紹介事業ではありません**。
18歳未満の利用を防ぐための年齢確認、ブロック・通報機能を備えています。実運用時は利用規約・
プライバシーポリシーの整備、通報のモデレーション運用、画像審査などを追加してください。
