# 黒丸表システム

ドラッグストア・小売店向けの「黒丸表（販促商品の配荷計画表）」作成・管理システムです。
小売店ごとに店舗マスタ・商品マスタ・黒丸表（単位×棚割り数で店舗ごとの配荷数を管理するグリッド）を持ち、
確定した配荷内容から物流帳簿CSV（36項目・UTF-8）／Excel(.xlsx) を出力します。

`project/` `chats/` は Claude Design（claude.ai/design）で作られた元デザイン（HTML/CSSプロトタイプ）と、
その作成時のやり取りです。本実装はこのデザインを元に**アプリとして作り直したもの**です。挙動に迷ったら
`project/黒丸表システム.dc.html` と `chats/chat1.md` が一次情報源です。

## 構成

Cloudflare 上で動かす前提の、フロントエンド／バックエンド分離構成です。

```
backend/    Cloudflare Workers + Hono API（D1データベース + R2画像ストレージ）
frontend/   React + TypeScript + Vite（Cloudflare Pages にデプロイ）
project/    元デザインのプロトタイプ一式（参照用・実行はしません）
chats/      デザイン作成時のやり取り（参照用）
```

- **フロントエンド**: React 19 + TypeScript + Vite。UIと業務ロジック（●の自動計算、CSV/Excel生成など）はすべてここにあります。
- **バックエンド**: Cloudflare Workers 上で動く Hono 製の薄い REST API。データの保存・取得と画像アップロードのみを担当します。
- **データベース**: Cloudflare D1（SQLite）。詳細は下記「データモデル」を参照。
- **画像ストレージ**: Cloudflare R2。棚割り見本画像・商品サムネイルを保存します。
- **認証**: なし（依頼者の指示により、ログイン不要の構成にしています。社外に公開する場合は「今後の課題」を参照）。

## ローカル開発

### 1. バックエンド

```bash
cd backend
npm install
npm run db:create            # D1データベースを作成（初回のみ・出力される database_id を wrangler.toml に設定）
npm run db:migrate:local     # テーブル作成
npm run db:seed:local        # デモデータ投入（ドラッグひまわり／みなと薬品／キリン堂／サツドラ）
npm run dev                  # http://localhost:8787 で起動
```

### 2. フロントエンド

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173 で起動（.env.development で API を localhost:8787 に向けています）
```

ブラウザで `http://localhost:5173` を開けば、デモデータ入りの状態でそのまま操作できます。

## 本番デプロイ（Cloudflare）

依頼者の要望により、今回のセッションでは**コードの作成とGitHubへの登録まで**を行っています。
Cloudflareへの実際の公開（デプロイ）は担当エンジニアの作業です。手順は以下の通りです。

### バックエンド（Workers + D1 + R2）

```bash
cd backend
npx wrangler login
npm run db:create                          # database_id が出力されるので wrangler.toml の database_id を書き換える
npx wrangler r2 bucket create kuromaru-images
npm run db:migrate:remote                  # 本番D1にテーブル作成
npm run db:seed:remote                     # デモデータを入れたくない場合はスキップ可
npm run deploy                             # Cloudflare Workers にデプロイ → URLが発行される（例: https://kuromaru-backend.xxx.workers.dev）
```

デプロイ後、`wrangler.toml` の `ALLOWED_ORIGIN` を実際の Pages のURLに変更して再デプロイしておくと、
CORSを不特定多数からのアクセスに開放したままにせずに済みます（初期値は `"*"`）。

### フロントエンド（Pages）

```bash
cd frontend
cp .env.production.example .env.production   # 中身を、上で発行されたWorkersのURLに書き換える
npm run build                                  # dist/ が生成される
npx wrangler pages deploy dist --project-name=kuromaru-frontend
```

もしくは Cloudflare ダッシュボードの Pages から GitHub 連携でこのリポジトリの `frontend/` をビルド対象に
指定してデプロイしても構いません（Build command: `npm run build` / Build output directory: `dist`）。

## データモデルについて（設計メモ）

`backend/migrations/0001_init.sql` の通り、D1には `retailers` テーブル1つだけを置いています。
店舗・商品・カテゴリ・黒丸表・テンプレートは、小売店ごとに1つの JSON ドキュメント（`data_json` 列）として
まとめて保存しています。これは元デザインのプロトタイプが持っていたインメモリのデータ構造（1小売店 = 1つの
まとまったオブジェクト）をほぼそのままDBに落とし込んだ設計です。

理由：
- 黒丸表の業務ロジック（単位→棚割り数→送る商品のマッピング、●の自動計算、CSV生成）は「1小売店分のデータを
  まるごと」扱う前提で作られており、小売店をまたいだSQL集計・検索の要件が今のところありません。
- 店舗マスタ・商品マスタのCRUD/CSV取込/検索も、実体は「JSONの配列を書き換えて丸ごと保存」で十分な規模です。

もし将来「全小売店を横断した店舗検索」「レポーティング」等が必要になった場合は、
`stores` / `products` / `sheets` を正規化した別テーブルに切り出すことを検討してください。
（`retailers`テーブルの `data_json` の中身の型は `backend/src/types.ts` の `RetailerData` に定義があります。
フロントエンド側にも同じ型定義が `frontend/src/types.ts` にあります。）

画像（棚割り見本画像・商品サムネイル）は R2 に保存し、`data_json` 内には R2 のURL文字列だけを保持しています。

## 保存の仕組み（自動保存・オートセーブ）

元デザイン通り、明示的な「保存」ボタンはありません。画面を操作すると、変更内容が600ms操作が止まったタイミングで
自動的にバックエンドへ送信されます（`frontend/src/state/store.tsx` の debounce 処理）。

## 既知の制約・今後の課題

- **認証なし**: 依頼により今回はログイン機能を実装していません。社外・不特定多数がアクセスできる場所に
  デプロイする場合は、Cloudflare Access（Zero Trust）等でアクセス制限をかけることを推奨します。
- **同時編集の競合制御なし**: 複数人が同時に同じ小売店の黒丸表を編集した場合、後から保存した内容で上書きされます
  （楽観ロック等は未実装）。運用上、同時編集が想定される場合は対応を検討してください。
- **画像アップロード上限 2MB**: 元デザインの制約を踏襲しています。

## テストデータ

`backend/migrations/0002_seed.sql` に、元デザインのデモデータ（ドラッグひまわり／みなと薬品は架空データ、
キリン堂／サツドラは実在店舗名を使ったデモ）をそのまま投入するSQLがあります。本番投入が不要であれば
`npm run db:seed:remote` は実行しないでください。
