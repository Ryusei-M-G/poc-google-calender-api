# Google Calendar Operations API (サーバーサイドのみ)

このリポジトリは、OAuth2、Google Calendar API v3、Express、Prisma (PostgreSQL) を使用して汎用的なGoogle Calendarの操作を行うサーバーサイドAPIを提供します。認証、イベントの取得、作成、更新、削除をサポートし、トークンは暗号化されて保存されます。

## 概要

- GoogleによるOAuth2認証とセキュアなセッションベースのアクセス
- PrismaによるPostgreSQLへのGoogleトークンの暗号化保存
- プライマリカレンダーの一覧取得/作成/更新/削除のエンドポイント
- ローカルフロントエンド向けのCORS設定、Cookieベースのセッション
- 読み取り専用の誕生日イベントの変更を防ぐガード機能

## アーキテクチャ

- `server.js` — Expressアプリ、セッション、CORS、ルーティング
- `calendarController.js` — Google Calendarのビジネスロジック（認証、一覧、作成、更新、削除）
- `dbController.js` — Prismaアクセスとトークン暗号化（AES）ヘルパー
- `prisma/schema.prisma` — PostgreSQLスキーマ（UsersとGoogleTokens）

## 前提条件

- Node.js 18+
- PostgreSQL 14+ (または同梱の `docker-compose.yml` を使用)
- Google CloudプロジェクトのOAuth 2.0クライアントID

## Google OAuth設定

1. Google Cloud Consoleで「Google Calendar API」を有効化
2. OAuth 2.0クライアントID（Webアプリケーション）を作成:
   - 承認済みのリダイレクトURI: `http://localhost:3000/auth/google/callback`
3. クライアントIDとクライアントシークレットを取得

## 環境変数

`.env` をコピーして以下を設定:

- `GOOGLE_CLIENT_ID` — OAuthクライアントID
- `GOOGLE_CLIENT_SECRET` — OAuthクライアントシークレット
- `GOOGLE_REDIRECT_URI` — `http://localhost:3000/auth/google/callback`
- `DATABASE_URL` — 例: `postgresql://calendar_user:calendar_password@localhost:5432/calendar_db`
- `ENCRYPTION_KEY` — トークン暗号化用のAESキー（本番環境では強力でランダムな値を設定）
- `SESSION_SECRET` — セッション署名用のシークレット

`docker-compose.yml` 用のオプションのDB変数:

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`

## ローカル開発

1. PostgreSQLを起動（Docker経由）:
   - `docker compose up -d`
2. 依存関係をインストール:
   - `npm install`
3. Prismaマイグレーションを実行してクライアントを生成:
   - `npm run db:migrate`
   - `npm run db:generate`
4. APIサーバーを起動:
   - `npm run dev` (自動リロード) または `npm start`

デフォルトでサーバーは `http://localhost:3000` で起動します。

## セッションとCORS

- セッションは開発環境ではメモリ内（Express Session）に保存されます。
- Cookieは `httpOnly` で、開発環境では非secure; 本番環境ではHTTPS配下で `secure: true` を設定してください。
- CORSは `origin: http://localhost:5173` を `credentials: true` で許可しています。

## データモデル（Prisma）

- `User` — emailで識別（このPoCではセッションIDをemail的なキーとして使用）
- `GoogleToken` — 暗号化された `accessToken` と `refreshToken`、`expiresAt`、`User` にリンク

詳細は `prisma/schema.prisma` を参照。トークンは `ENCRYPTION_KEY` を使用してAES暗号化されて保存されます。

## 認証フロー

1. クライアントが `GET /auth` でOAuthを開始
2. ユーザーが同意; Googleが `GET /auth/google/callback?code=...` にリダイレクト
3. サーバーがコードを交換し、トークンを暗号化して保存し、セッションをユーザーキーにバインド
4. 以降のAPI呼び出しではセッションCookie（認証情報を送信）を使用して認可

## エンドポイント

- `GET /auth`
  - Google同意画面にリダイレクト

- `GET /auth/google/callback`
  - OAuthコールバックを処理し、トークンを保存してセッションを設定
  - フロントエンドURL（デフォルト `http://localhost:5173/auth/success`）にリダイレクト

- `GET /auth/me`
  - セッションが有効な場合は `{ authenticated: true, userId }` を返却; それ以外は `401`

- `GET /events`
  - プライマリカレンダーから今後のイベント一覧を取得
  - 誕生日イベント（`eventType === 'birthday'`）はクライアント側での変更試行を防ぐためフィルタリング

- `POST /addContent`
  - ボディ: `{ startDate: string, endDate: string, text: string }`
  - プライマリカレンダーにイベントを作成
  - `startDate`/`endDate` はISO-8601パース可能な形式（例: `2025-10-03T09:00`）
  - `{ message, event }` を返却

- `PUT /updateContent/:eventId`
  - ボディ: `{ startDate: string, endDate: string, text: string }`
  - 指定されたイベントを更新。誕生日イベントは `400` でリジェクト
  - `{ message, event }` を返却

- `DELETE /deleteContent/:eventId`
  - プライマリカレンダーから指定されたイベントを削除。誕生日イベントは `400` でリジェクト
  - `{ message }` を返却

### 日付に関する注意

- クライアントから日付のみ（YYYY-MM-DD）が提供される全日イベント的な更新の場合、`YYYY-MM-DDT00:00` として送信してAPIが有効なDateTimeを生成できるようにしてください。
- サーバーは作成/更新時にイベントのタイムゾーンを `Asia/Tokyo` に設定します。必要に応じて調整してください。

## 使用例（curl）

注: これらの例ではセッションCookie（例: ブラウザから）を再利用することを想定しています。手動テストの場合、curlのcookie jar（`-c` と `-b`）を使用できます。

1) OAuthを開始（ブラウザで開く）:

```
open http://localhost:3000/auth
```

2) セッションを確認:

```
curl -i -b cookies.txt -c cookies.txt http://localhost:3000/auth/me
```

3) イベント一覧を取得:

```
curl -s -b cookies.txt -c cookies.txt http://localhost:3000/events
```

4) イベントを作成:

```
curl -s -X POST -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt \
  -d '{"startDate":"2025-10-03T09:00","endDate":"2025-10-03T10:00","text":"サンプルイベント"}' \
  http://localhost:3000/addContent
```

5) イベントを更新:

```
curl -s -X PUT -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt \
  -d '{"startDate":"2025-10-03T11:00","endDate":"2025-10-03T12:00","text":"更新されたタイトル"}' \
  http://localhost:3000/updateContent/<eventId>
```

6) イベントを削除:

```
curl -s -X DELETE -b cookies.txt -c cookies.txt http://localhost:3000/deleteContent/<eventId>
```

## エラーハンドリングと制約

- 誕生日イベントはGoogle Calendarで読み取り専用のため更新・削除できません。このAPI:
  - `GET /events` でフィルタリングして除外
  - 誕生日イベントへの更新/削除が試行された場合は `400` を返却
- トークンが欠落しているか期限切れでリフレッシュできない場合、APIは `401` を返して再認証を指示

## 本番環境での考慮事項

- HTTPSを使用し、セッションCookieに `secure: true` と適切な `SameSite` 属性を設定
- PoCのセッション→ユーザーマッピングを実際のユーザーアイデンティティ（例: アプリのアカウントシステム）に置き換え
- メモリ内セッションの代わりに永続的なセッションストア（Redis、データベース）を使用
- `ENCRYPTION_KEY` と `SESSION_SECRET` をローテーション; シークレットは安全なマネージャーに保存
- 構造化ログ、リクエストトレーシング、入力検証を追加
