# GrantDraft - 助成金申請書作成SaaS

日本屈指の助成金申請書作成支援システム。AIとベクトル検索を活用し、ワンクリックで最適な申請書ドラフトを生成します。

## 主要機能

- 🔐 **セキュアな認証システム** - Supabase Authによるマジックリンク認証
- 📄 **PDF OCR処理** - アップロードされたPDFから自動的にテキスト抽出
- 🤖 **AI駆動のドラフト生成** - OpenAI GPTとpgvectorによる類似文書検索
- ✏️ **リッチテキストエディタ** - TipTapによる高度な編集機能（文字数制限付き）
- 📑 **PDF出力** - 選択可能なテキストを含む高品質PDFエクスポート
- 🔒 **エンタープライズセキュリティ** - RLS、暗号化、CSPヘッダー

## 技術スタック

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI/ML**: OpenAI API, pgvector
- **PDF処理**: pdf-lib, @unstructured-client
- **エディタ**: TipTap

## セットアップ

### 前提条件

- Node.js 18+
- npm 9+
- Supabase CLI
- OpenAI APIキー

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourname/grant-draft.git
cd grant-draft
```

### 2. 依存関係のインストール

```bash
npm install --legacy-peer-deps
```

### 3. 環境変数の設定

`.env.example`を`.env.local`にコピーし、必要な値を設定：

```bash
cp .env.example .env.local
```

### 4. Supabaseのセットアップ

```bash
# Supabase CLIのインストール
brew install supabase/tap/supabase

# ローカルでSupabaseを起動
supabase start

# データベースのマイグレーション実行
supabase db push

# Edge Functionsのデプロイ
supabase functions deploy
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## プロジェクト構造

```
grant-draft/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── auth/              # 認証関連ページ
│   │   ├── dashboard/         # ダッシュボード
│   │   └── page.tsx           # ホームページ
│   ├── components/            # Reactコンポーネント
│   │   ├── auth/             # 認証コンポーネント
│   │   ├── editor/           # エディタコンポーネント
│   │   ├── upload/           # アップロードコンポーネント
│   │   └── ui/               # shadcn/uiコンポーネント
│   ├── lib/                   # ユーティリティ関数
│   │   ├── supabase/         # Supabaseクライアント
│   │   └── utils.ts          # 共通ユーティリティ
│   └── types/                 # TypeScript型定義
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── ocr_to_md/       # OCR処理
│   │   ├── embed_doc/       # ベクトル埋め込み
│   │   ├── generate_draft/  # ドラフト生成
│   │   └── export_pdf/      # PDF出力
│   └── migrations/          # データベースマイグレーション
├── tests/                    # E2Eテスト
└── public/                   # 静的ファイル
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint

# 型チェック
npm run type-check

# テスト実行
npm run test

# E2Eテスト
npm run test:e2e
```

## セキュリティ

- すべてのPIIデータは保存時に暗号化
- Row Level Security (RLS)によるマルチテナント分離
- 署名付きURL（5分間有効）によるファイルアクセス制御
- CSPヘッダーによるXSS対策
- HSTSによる通信の暗号化強制

## デプロイ

### Vercel

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

### Supabase

```bash
# プロジェクトをリンク
supabase link --project-ref your-project-ref

# 本番環境へデプロイ
supabase db push
supabase functions deploy
```

## ライセンス

MIT License

## サポート

- Issues: https://github.com/yourname/grant-draft/issues
- Email: support@grantdraft.jp