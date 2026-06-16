# Mingle API リファレンス

ベース URL: `/api`（dev は Vite プロキシ経由で `http://localhost:4000`）。
認証が必要なエンドポイントは `Authorization: Bearer <JWT>` ヘッダを付与する。
レスポンスはすべて JSON。エラーは `{ "error": "<code>" }` 形式。

## 認証 `/auth`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/auth/register` | – | 登録。`{ email, password, displayName, birthdate(YYYY-MM-DD), gender }` → `{ token, user }`。@ユーザー名を自動発行。18歳未満は `must_be_18`。 |
| POST | `/auth/login` | – | ログイン。`{ email, password }` → `{ token, user }`。 |
| GET | `/auth/me` | ✓ | 現在のユーザー（`MeUser`）。 |

## ユーザー / フォロー `/users`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| PATCH | `/users/me` | ✓ | プロフィール更新（`displayName, username, headline, bio, location, link, occupation, bodyType, weightNote, height, pronouns, gender, showAge, discoveryEnabled, photos[], interests[]`）。 |
| GET | `/users/search?q=` | ✓ | 名前 / @ユーザー名 / 趣味で検索。 |
| GET | `/users/me/footprints` | ✓ | あしあと：直近の訪問者（最大20人）。 |
| GET | `/users/suggested` | ✓ | おすすめユーザー（フォロワー数順）。 |
| GET | `/users/:idOrUsername` | ✓ | プロフィール（`PublicUser`、フォロー数・投稿数・isFollowing 等を含む）。 |
| POST/DELETE | `/users/:id/follow` | ✓ | フォロー / 解除。 |
| GET | `/users/:id/followers` `/following` | ✓ | フォロワー・フォロー中一覧。 |
| GET | `/users/meta/interests` | ✓ | 人気の趣味タグ。 |

## 投稿 `/posts`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/posts` | ✓ | 投稿作成。`{ imageUrls: string[] (最大10) , caption? }`（`imageUrl` 単体も可）。`Post.images` に全画像、`imageUrl` は表紙。 |
| GET | `/posts/feed` | ✓ | ホームフィード（フォロー中＋自分、空ならグローバル）。 |
| GET | `/posts/explore` | ✓ | 新着投稿グリッド。 |
| GET | `/posts/search?q=` | ✓ | キャプション / ハッシュタグで投稿検索。 |
| GET | `/posts/user/:userId` | ✓ | あるユーザーの投稿一覧。 |
| GET | `/posts/:id` | ✓ | 単一投稿。 |
| DELETE | `/posts/:id` | ✓ | 自分の投稿を削除。 |
| POST/DELETE | `/posts/:id/like` | ✓ | いいね / 取り消し。 |
| POST/DELETE | `/posts/:id/bookmark` | ✓ | 保存 / 解除。`Post.savedByMe` に反映。 |
| GET | `/posts/saved` | ✓ | 保存済み投稿一覧。 |
| GET/POST | `/posts/:id/comments` | ✓ | コメント取得 / 追加。 |

## DM `/conversations` `/messages`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/conversations` | ✓ | `{ userId }` で1:1会話を取得 or 作成（DMの起点）。 |
| GET | `/conversations` | ✓ | 会話一覧（最終メッセージ・未読数つき）。 |
| GET | `/conversations/:id` | ✓ | 単一会話。 |
| GET | `/messages/:conversationId` | ✓ | メッセージ一覧（取得時に既読化）。 |
| POST | `/messages/:conversationId` | ✓ | `{ body }` 送信。相手へリアルタイム配信。 |

## 掲示板 `/board`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/board?category=` | ✓ | スレッド一覧。category: `chat/recruit/question/event/hobby/market`。 |
| POST | `/board` | ✓ | スレッド作成。`{ category, title, body?, imageUrl? }`。 |
| GET | `/board/:id` | ✓ | スレッド詳細。 |
| DELETE | `/board/:id` | ✓ | 自分のスレッドを削除。 |
| GET/POST | `/board/:id/comments` | ✓ | コメント取得 / 追加。 |

## 通知 `/notifications`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/notifications` | ✓ | 通知一覧（取得時に既読化）。type: `follow/like/comment/board_comment/story_reaction/footprint`（足あとは初回訪問時のみ通知）。種類別フィルタはクライアント側。 |
| GET | `/notifications/unread-count` | ✓ | 未読件数（ヘッダーのバッジ用）。 |

## ストーリーズ `/stories`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST | `/stories` | ✓ | ストーリー投稿（24時間で失効）。`{ imageUrl, caption? }`（テキスト/絵文字キャプション）。 |
| GET | `/stories/feed` | ✓ | ストーリートレイ（自分＋フォロー中、未読リング優先）。`StoryGroup[]`。 |
| GET | `/stories/archive` | ✓ | 自分の全ストーリー（期限切れ含む）。本人のみ。 |
| POST | `/stories/:id/view` | ✓ | 閲覧済みにする。 |
| POST/DELETE | `/stories/:id/react` | ✓ | リアクション（`like/akan/bad/helpful`）を付与 / 解除。 |
| GET | `/stories/:id/viewers` | ✓ | 閲覧者一覧（投稿者のみ）。各閲覧者のリアクション付き。 |
| DELETE | `/stories/:id` | ✓ | 自分のストーリーを削除。 |

## 安全 `/safety`

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| POST/DELETE | `/safety/block/:id` | ✓ | ブロック / 解除（フォロー関係も解除）。 |
| POST | `/safety/report/:id` | ✓ | 通報。`{ reason, detail? }`。 |

## その他

| Method | Path | 認証 | 説明 |
| --- | --- | --- | --- |
| GET | `/health` | – | ヘルスチェック。 |
| GET | `/avatar/:seed.svg?name=` | – | 決定的なグラデーションアバター（SVG）。 |

## リアルタイム（Socket.IO）

接続時に `auth: { token }`（JWT）。各ユーザーは `user:<id>` ルームに参加。

| イベント | 方向 | ペイロード |
| --- | --- | --- |
| `message` | server→client | `{ message, conversation }` 新着DM。 |
| `read` | server→client | `{ conversationId, readerId, readAt }` 既読。 |
| `typing` | 双方向 | `{ conversationId, to }` / `{ conversationId, from }` 入力中。 |
| `follow` | server→client | `{ from }` フォローされた。 |
| `notification` | server→client | 新しい通知あり（フォロー/いいね/コメント）。バッジ更新の合図。 |

型の定義は `web/src/api/types.ts` / `server/src/types.ts` を参照。
