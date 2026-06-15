# Mingle API リファレンス

ベース URL: `/api`（dev は Vite プロキシ経由で `http://localhost:4000`）。
認証が必要なエンドポイントは `Authorization: Bearer <JWT>` ヘッダを付与する。
レスポンスはすべて JSON。エラーは `{ "error": "<code>" }` 形式。

## 認証 `/auth`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/auth/register` | – | 新規登録。`{ email, password, displayName, birthdate(YYYY-MM-DD), gender }` → `{ token, user }`。18歳未満は `must_be_18`。 |
| POST | `/auth/login` | – | ログイン。`{ email, password }` → `{ token, user }`。 |
| GET | `/auth/me` | ✓ | 現在のユーザー（`MeUser`）を返す。 |

## ユーザー / プロフィール `/users`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| PATCH | `/users/me` | ✓ | プロフィール更新。`displayName, headline, bio, location, pronouns, gender, showAge, discoveryEnabled, prefAgeMin, prefAgeMax, photos[], interests[]` の部分更新。 |
| GET | `/users/:id` | ✓ | 他ユーザーの公開プロフィール（`PublicUser`）。ブロック関係なら 404。 |
| GET | `/users/meta/interests` | ✓ | 人気の趣味タグ候補。 |

## 発見（デッキ）`/discovery`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/discovery?limit=20` | ✓ | スワイプ候補一覧。共通の趣味数・自分への Like を加味してスコアリング・並べ替え。各要素は `PublicUser` + `sharedInterests, likedYou, superLikedYou`。 |

## スワイプ `/swipes`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/swipes` | ✓ | `{ targetId, action: 'like'\|'pass'\|'superlike' }`。相互 Like ならマッチ生成 → `{ matched, match }`。 |
| POST | `/swipes/rewind` | ✓ | 直前のスワイプを取り消し（作成されたマッチも削除）→ `{ ok, targetId }`。 |

## マッチ `/matches`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/matches` | ✓ | マッチ一覧（最終メッセージ・未読数つき、`MatchSummary[]`）。 |
| GET | `/matches/:id` | ✓ | 単一マッチ。 |
| GET | `/matches/likes/incoming` | ✓ | 自分に Like を送った（未マッチの）相手一覧。 |
| DELETE | `/matches/:id` | ✓ | マッチ解除。 |

## メッセージ `/messages`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/messages/:matchId` | ✓ | メッセージ一覧（古い順）。取得時に相手メッセージを既読化。 |
| POST | `/messages/:matchId` | ✓ | `{ body }` 送信 → `{ message }`。相手へリアルタイム配信。 |

## 安全 `/safety`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/safety/block/:id` | ✓ | ブロック（既存マッチも解除）。 |
| DELETE | `/safety/block/:id` | ✓ | ブロック解除。 |
| POST | `/safety/report/:id` | ✓ | 通報。`{ reason, detail? }`。 |

## その他

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/health` | – | ヘルスチェック。 |
| GET | `/avatar/:seed.svg?name=` | – | 決定的なグラデーションアバター（SVG）。 |

## リアルタイム（Socket.IO）

接続時に `auth: { token }` を渡す（JWT）。各ユーザーは `user:<id>` ルームに参加。

| イベント | 方向 | ペイロード |
| --- | --- | --- |
| `match` | server→client | `{ match: MatchSummary }` 新規マッチ成立時。 |
| `message` | server→client | `{ message: ChatMessage }` 新着メッセージ。 |
| `read` | server→client | `{ matchId, readerId, readAt }` 既読通知。 |
| `typing` | 双方向 | `{ matchId, to }`（送信）/ `{ matchId, from }`（受信）入力中。 |

型の定義は `web/src/api/types.ts` / `server/src/types.ts` を参照。
