# 汎用的なGoogleカレンダーAPIサービスの設計

## データベース設計

### テーブル構成

```
├── users テーブル (ユーザー管理)
│   ├── id (PRIMARY KEY)
│   ├── email (UNIQUE)
│   ├── password_hash
│   └── created_at
│
└── google_tokens テーブル (トークン管理)
    ├── id (PRIMARY KEY)
    ├── user_id (FOREIGN KEY -> users.id)
    ├── access_token (暗号化)
    ├── refresh_token (暗号化)
    ├── expires_at
    └── updated_at
```

## アーキテクチャフロー

```
1. ユーザーログイン（独自認証 or OAuth）
   ↓
2. セッションIDをCookieに保存
   ↓
3. GoogleトークンはDBに暗号化して保存
   ↓
4. リクエスト時にセッションからユーザー特定
   ↓
5. DBからトークン取得
   ↓
6. Google API実行
```

## 実装タスク

- [ ] トークン管理用DBスキーマ設計
- [ ] ユーザー認証機能の実装
- [ ] トークンDB保存・取得機能の実装
- [ ] セッション管理の実装
- [ ] 既存エンドポイントの認証対応リファクタリング

## 技術スタック検討事項

### データベース
- PostgreSQL

### 認証方式
- JWT（JSON Web Token）
- セッションベース（Cookie）

### ORM
- Prisma
