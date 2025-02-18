# AI質問応答システム 🤖

TypeScript、Supabase、LangChainを活用した知的な質問応答システムです。専門知識を持つAIエージェントが、ユーザーからの質問に対して質の高い回答を提供します。

主な機能 ✨

- 🔍 直感的な質問投稿と管理機能
- 🤖 LangChainによる高度な回答生成
- 📊 回答の品質評価と継続的な改善
- 👥 ユーザー別の専用インターフェース
- 💾 Supabaseを用いた安全なデータ管理
- 🎯 各分野に特化したAIエージェント
- 📈 詳細なパフォーマンス分析

技術スタック 🛠️

フロントエンド
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Heroicons

バックエンド
- Node.js
- Express
- TypeScript
- LangChain
- Google Gemini Pro

データベース
- Supabase (PostgreSQL)

動作環境 📋

- Node.js (v16以上)
- npm または yarn
- Supabaseアカウント
- Google AI (Gemini Pro) APIキー

セットアップ手順 🚀

1. リポジトリのクローン
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. パッケージのインストール
   ```bash
   # バックエンドの依存関係をインストール
   npm install

   # フロントエンドの依存関係をインストール
   cd frontend
   npm install
   cd ..
   ```

3. 環境設定
   ```bash
   cp .env.example .env
   ```
   必要な環境変数:
   - GOOGLE_API_KEY: Google Gemini Pro APIキー
   - SUPABASE_URL: SupabaseプロジェクトのURL
   - SUPABASE_ANON_KEY: Supabaseの匿名キー
   - PORT: サーバーポート（デフォルト: 3001）

4. データベースの準備
   - Supabaseでプロジェクトを作成
   - init.sqlでテーブルを作成
   - update_agents.sqlで設定を適用

5. アプリケーションの起動 🎯

   バックエンドの起動:
   ```bash
   # ルートディレクトリで実行
   npm run dev
   ```
   サーバーが http://localhost:3001 で起動します

   フロントエンドの起動:
   ```bash
   # 新しいターミナルを開いて実行
   cd frontend
   npm run dev
   ```
   アプリケーションが http://localhost:3000 で起動します

   ※ 両方のサーバーを起動する必要があります。
   
   起動確認:
   - フロントエンド: http://localhost:3000 にアクセス
   - バックエンドAPI: http://localhost:3001/api/questions でテスト

データベース構成 📚

users（ユーザー管理）
- id: ユーザーID
- name: 名前
- role: 権限
- created_at: 作成日時

questions（質問管理）
- id: 質問ID
- content: 質問内容
- user_id: 質問者ID
- status: 状態
- created_at: 作成日時

answers（回答管理）
- id: 回答ID
- question_id: 質問ID
- content: 回答内容
- score: 評価スコア
- agent_id: 回答者ID
- created_at: 作成日時

agents（AIエージェント管理）
- id: エージェントID
- name: 名前
- description: 説明
- specialization: 専門分野
- prompt_template: 応答テンプレート
- performance_score: 性能評価

APIエンドポイント 🔄

質問関連
- GET /api/questions - 質問一覧の取得
- GET /api/questions/pending - 未回答質問の取得
- GET /api/questions/:userId - ユーザーごとの質問取得
- POST /api/questions - 新規質問の作成

回答関連
- POST /api/answers - 回答の生成

エージェント関連
- GET /api/agents - エージェント一覧の取得
- POST /api/agents - 新規エージェントの作成
- PUT /api/agents/:id - エージェント情報の更新
- DELETE /api/agents/:id - エージェントの削除

ユーザー関連
- GET /api/users - ユーザー一覧の取得
- POST /api/users - 新規ユーザーの作成
- DELETE /api/users/:id - ユーザーの削除

使い方 🎯

質問をする
1. ホーム画面から「質問する」を選択
2. 質問を入力して送信
3. AIエージェントが自動で回答を生成

エージェントを管理する
1. 「エージェント管理」画面を開く
2. エージェントの作成・編集
3. 専門分野の設定
4. パフォーマンスの確認

ユーザーを管理する
1. 管理画面でユーザーを作成
2. 適切な権限を設定
3. アクセス管理

セキュリティ対策 🔒

- Supabaseの認証システムを活用
- 環境変数による機密情報の保護
- CORSによる安全なアクセス制御
- 入力データの検証

ライセンス 📝

本プロジェクトはMITライセンスで提供されています。

開発に参加する 👥

1. リポジトリをフォーク
2. 開発用ブランチを作成
3. コードの変更をコミット
4. プルリクエストを作成

既知の問題 🐛

現在、重大な問題は報告されていません。

サポート 📞

ご不明な点や問題がございましたら、GitHubのIssueにてご連絡ください。 