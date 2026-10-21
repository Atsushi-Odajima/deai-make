# Mingle — 趣味・関心でつながるSNS

投稿フィード、ユーザー検索、フォロー、DM、掲示板を備えた、スマートフォン中心のSNS試作です。

> **実装ブランチ：`claude/tinder-sns-web-app-p1xmbt`**。この既定ブランチのREADMEは製品の案内です。以下のソース・資料リンクと起動手順は、実装ブランチを参照します。

## できること

- プロフィール・写真投稿・コメント・フォロー・検索
- Socket.IOを使ったDM、通知、ブロックと通報
- REST APIとフロントを分離した構成、架空デモユーザーの生成

## 現在の範囲・制限

- Web版の試作であり、iOSネイティブアプリは実装していません。
- 年齢入力・ブロック・通報の実装は、実サービスの本人確認やモデレーション運用の完了を意味しません。

## 実装の見どころ

**構成：** React / TypeScript / Vite、Node.js / Express、Socket.IO、SQLite。

- [server/src/routes](https://github.com/Atsushi-Odajima/deai-make/tree/claude%2Ftinder-sns-web-app-p1xmbt/server/src/routes)
- [server/src/realtime.ts](https://github.com/Atsushi-Odajima/deai-make/blob/claude%2Ftinder-sns-web-app-p1xmbt/server/src/realtime.ts)
- [web/src/pages](https://github.com/Atsushi-Odajima/deai-make/tree/claude%2Ftinder-sns-web-app-p1xmbt/web/src/pages)
- [server/src/seed.ts](https://github.com/Atsushi-Odajima/deai-make/blob/claude%2Ftinder-sns-web-app-p1xmbt/server/src/seed.ts)

## ローカルで試す

Node.js 20以上。seedは専用の開発DBに架空ユーザーを投入する用途です。

実装ブランチを取得し、次のディレクトリで作業します。

```sh
git clone --branch claude/tinder-sns-web-app-p1xmbt https://github.com/Atsushi-Odajima/deai-make.git
cd deai-make
npm install --prefix server
npm install --prefix web
npm run seed --prefix server
npm run dev --prefix server
```

別ターミナルで npm run dev --prefix web を実行し、http://localhost:5173 を開きます。APIは http://localhost:4000。公開環境ではserver/.env.exampleを基にJWT鍵・Origin等を設定してください。

環境設定・初期化の詳細：[セットアップ手順](https://github.com/Atsushi-Odajima/deai-make/blob/claude%2Ftinder-sns-web-app-p1xmbt/README.md)。

## 検証方法

検証・ビルド方法は、各実装ディレクトリの設定と開発手順を参照してください。

試験の実施環境・結果・未実施項目は、下記の記録を参照してください。画面エミュレーションと実機確認、モックと外部サービスでの確認を区別しています。

## 資料

- [README.md](https://github.com/Atsushi-Odajima/deai-make/blob/claude%2Ftinder-sns-web-app-p1xmbt/README.md)

## 制作・利用条件

制作・管理：**Atsushi Odajima**。実装・資料作成にはAI支援を利用しています。
ソース・同梱ライブラリ・フォント・モデル等の利用条件は、各ライセンスと第三者表記を参照してください。リポジトリの閲覧可能性と、再配布・商用利用の許諾は別です。
