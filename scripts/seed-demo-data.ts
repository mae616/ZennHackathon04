/**
 * @fileoverview デモデータ投入スクリプト
 *
 * Firestoreの既存データをすべて削除し、スクリーンショット・デモ向けの
 * 魅力的なテストデータを投入する。再実行可能（冪等）。
 *
 * 使い方:
 *   npx tsx scripts/seed-demo-data.ts
 *
 * 前提:
 *   - apps/web/.env.local に Firebase 認証情報が設定されていること
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── .env.local の読み込み ───
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../apps/web/.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // ダブルクォート除去
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// ─── Firebase 初期化 ───
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db: Firestore = getFirestore(app);

// ─── ヘルパー ───
const now = new Date();
/** 指定日数前のISO文字列を返す */
function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** コレクションの全ドキュメントを削除する */
async function deleteCollection(collectionName: string): Promise<number> {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

// ─── デモ対話データ ───
const conversations = [
  {
    id: 'conv-react-server-components',
    title: 'React Server Componentsのデータフェッチング戦略',
    source: 'chatgpt',
    status: 'active',
    tags: ['React', 'Next.js', 'アーキテクチャ'],
    note: 'RSCのデータフェッチングパターンを整理。Server ComponentsとClient Componentsの使い分けが明確になった。プロジェクトのデータ取得層設計に直接活用できる重要な議論。',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    messages: [
      {
        id: 'msg-1-1',
        role: 'user',
        content: 'React Server Componentsでデータフェッチングする際のベストプラクティスを教えてください。特にNext.js App Routerでの実践的なパターンが知りたいです。',
        timestamp: daysAgo(5),
      },
      {
        id: 'msg-1-2',
        role: 'assistant',
        content: `React Server Components（RSC）でのデータフェッチングには、いくつかの重要なパターンがあります。

## 1. Server Componentでの直接フェッチ
最もシンプルで推奨されるパターンです。コンポーネント内で直接 \`async/await\` が使えます：

\`\`\`tsx
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId);
  return <div>{user.name}</div>;
}
\`\`\`

## 2. 並列データフェッチング
複数のデータを同時に取得する場合は \`Promise.all\` を活用します：

\`\`\`tsx
async function Dashboard() {
  const [users, posts, stats] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchStats(),
  ]);
  return <DashboardView users={users} posts={posts} stats={stats} />;
}
\`\`\`

## 3. Suspenseとの組み合わせ
重要度に応じてストリーミング表示を制御できます。

ポイントは「データの近くでフェッチする」というRSCの設計思想に沿うことです。`,
        timestamp: daysAgo(5),
      },
      {
        id: 'msg-1-3',
        role: 'user',
        content: 'Client ComponentからServer Componentのデータにアクセスしたい場合はどうすべきですか？',
        timestamp: daysAgo(5),
      },
      {
        id: 'msg-1-4',
        role: 'assistant',
        content: `Client ComponentからServer Componentのデータにアクセスするには、主に3つのアプローチがあります：

## 1. Props経由で渡す（推奨）
Server Componentでデータを取得し、Client Componentにpropsとして渡します：

\`\`\`tsx
// Server Component
async function Page() {
  const data = await fetchData();
  return <InteractiveChart data={data} />;
}
\`\`\`

## 2. Server Actions
フォーム送信やミューテーションには Server Actions を使います。

## 3. Route Handlers（API Routes）
リアルタイム更新や頻繁な再フェッチが必要な場合に適しています。

**原則**: 可能な限りServer Componentでデータを取得し、Client Componentは表示とインタラクションに専念させるのがベストです。`,
        timestamp: daysAgo(5),
      },
    ],
  },
  {
    id: 'conv-product-market-fit',
    title: 'スタートアップのプロダクトマーケットフィット分析',
    source: 'claude',
    status: 'active',
    tags: ['PMF', 'スタートアップ', 'ビジネス戦略'],
    note: 'PMFの定量的な測定方法とピボット判断の基準が整理された。Sean Ellisテストの40%基準と、リテンションカーブの分析手法が特に実用的。',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    messages: [
      {
        id: 'msg-2-1',
        role: 'user',
        content: 'プロダクトマーケットフィット（PMF）を定量的に測定する方法を教えてください。特にB2C SaaSの場合のフレームワークが知りたいです。',
        timestamp: daysAgo(3),
      },
      {
        id: 'msg-2-2',
        role: 'assistant',
        content: `PMFの定量的な測定には、複数の指標を組み合わせるアプローチが効果的です。

## 1. Sean Ellisテスト（最も一般的）
「このプロダクトが使えなくなったら、どう感じますか？」という質問で：
- **40%以上**が「とても残念」→ PMF達成の兆候
- 25-40% → 改善の余地あり
- 25%未満 → ピボット検討

## 2. リテンションカーブ分析
- **Day 1 / Day 7 / Day 30** のリテンション率を追跡
- カーブが平坦化するポイントがあれば、コアユーザー層が存在する証拠
- B2C SaaSの場合、Day 30で **20%以上** が目安

## 3. NPS（Net Promoter Score）
- **50以上** → 強いPMF
- **30-50** → 良好
- **30未満** → 要改善

## 4. オーガニック成長率
口コミ経由のユーザー獲得率。マーケティング費をかけずに成長しているかどうかが、PMFの最も確実な指標です。

これらを**週次ダッシュボード**で追跡し、トレンドの変化を見ることを推奨します。`,
        timestamp: daysAgo(3),
      },
    ],
  },
  {
    id: 'conv-ml-deploy-pipeline',
    title: '機械学習モデルの本番デプロイパイプライン設計',
    source: 'gemini',
    status: 'active',
    tags: ['MLOps', 'CI/CD', 'インフラ'],
    note: 'ML モデルのデプロイパイプラインの全体像が把握できた。特にモデルバージョニングとA/Bテストの組み合わせが参考になる。次回はモニタリング（データドリフト検知）について深掘りしたい。',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    messages: [
      {
        id: 'msg-3-1',
        role: 'user',
        content: '本番環境での機械学習モデルのデプロイパイプラインを設計したいです。GCPでのベストプラクティスを教えてください。',
        timestamp: daysAgo(2),
      },
      {
        id: 'msg-3-2',
        role: 'assistant',
        content: `GCPでのMLデプロイパイプラインは、以下の構成がベストプラクティスです：

## パイプライン全体像

\`\`\`
学習 → 評価 → レジストリ登録 → ステージング → A/Bテスト → 本番
\`\`\`

## 1. モデル学習・評価（Vertex AI Training）
- **Vertex AI Pipelines**（Kubeflow Pipelines ベース）でワークフロー定義
- 学習完了後に自動で評価メトリクス（精度/F1/AUC）をチェック
- 閾値を下回った場合はパイプラインを自動停止

## 2. モデルバージョニング（Vertex AI Model Registry）
- モデルをバージョン管理し、メタデータ（学習データ、ハイパーパラメータ）を紐付け
- **不可変バージョン**: 一度登録したモデルは変更不可

## 3. デプロイ（Vertex AI Endpoints）
- **トラフィック分割**: 新モデルに10%→30%→100%と段階的にルーティング
- **ロールバック**: メトリクス悪化時に旧バージョンへ即座に切り替え

## 4. モニタリング
- **Vertex AI Model Monitoring** でデータドリフト・コンセプトドリフトを検知
- アラート発火時に自動で再学習パイプラインをトリガー

この構成により、安全かつ迅速にモデルを本番に展開できます。`,
        timestamp: daysAgo(2),
      },
      {
        id: 'msg-3-3',
        role: 'user',
        content: 'A/Bテストの評価期間と判定基準はどう設定すべきですか？',
        timestamp: daysAgo(1),
      },
      {
        id: 'msg-3-4',
        role: 'assistant',
        content: `A/Bテストの設計は、モデルの用途と影響度に応じて調整が必要です：

## 評価期間の設定
- **推薦モデル**: 最低1週間（曜日による行動パターンの差を吸収）
- **リスク判定モデル**: 2-4週間（低頻度イベントの十分なサンプル確保）
- **リアルタイム予測**: 3-5日（トラフィック量が多い場合）

## 判定基準
1. **統計的有意性**: p値 < 0.05 を基本とする
2. **実用的有意性**: 統計的に有意でも、改善幅が0.1%なら見送る
3. **ガードレール指標**: メイン指標が改善しても、ユーザー体験を毀損していないか

## 段階的ロールアウト
\`\`\`
Day 1-3:   5% トラフィック → 異常検知
Day 4-7:  20% トラフィック → 初期評価
Day 8-14: 50% トラフィック → 本評価
Day 15:  100% ロールアウト or ロールバック
\`\`\`

**重要**: ロールバック判定は自動化し、レイテンシ悪化やエラー率上昇時は即座に旧バージョンに戻す仕組みにしてください。`,
        timestamp: daysAgo(1),
      },
    ],
  },
  {
    id: 'conv-typescript-type-level',
    title: 'TypeScript 5.x の型レベルプログラミング活用法',
    source: 'chatgpt',
    status: 'active',
    tags: ['TypeScript', '型安全', 'DX'],
    note: 'Conditional TypesとTemplate Literal Typesの組み合わせでAPIレスポンスの型を自動生成するパターンが秀逸。実プロジェクトのAPI層に適用予定。',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    messages: [
      {
        id: 'msg-4-1',
        role: 'user',
        content: 'TypeScript 5.xの型レベルプログラミングで、実務に役立つ実践的なテクニックを教えてください。',
        timestamp: daysAgo(4),
      },
      {
        id: 'msg-4-2',
        role: 'assistant',
        content: `TypeScript 5.xの型レベルプログラミングは、実務でも強力に活用できます。

## 1. Template Literal Types でAPIパスを型安全に

\`\`\`typescript
type ApiPath = \`/api/\${string}\`;
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiRoute<P extends ApiPath, M extends Method> = {
  path: P;
  method: M;
};
\`\`\`

## 2. Conditional Types で環境別の型切り替え

\`\`\`typescript
type Config<Env extends 'dev' | 'prod'> = Env extends 'prod'
  ? { apiUrl: string; sentry: { dsn: string } }
  : { apiUrl: string; debug: boolean };
\`\`\`

## 3. satisfies 演算子でリテラル型を保持

\`\`\`typescript
const routes = {
  home: '/',
  users: '/users',
  userDetail: '/users/:id',
} satisfies Record<string, string>;
// routes.home の型は '/' （string ではない）
\`\`\`

## 4. const Type Parameters（5.0+）
ジェネリクスに \`const\` 修飾子を付けてリテラル推論を強制できます。

これらを組み合わせることで、ランタイムエラーをコンパイル時に検出できる堅牢なコードベースが実現します。`,
        timestamp: daysAgo(4),
      },
    ],
  },
  {
    id: 'conv-user-interview',
    title: 'ユーザーインタビュー設計とインサイト抽出法',
    source: 'claude',
    status: 'active',
    tags: ['UXリサーチ', 'インタビュー', 'プロダクト開発'],
    note: '構造化インタビューのテンプレートと、アフィニティダイアグラムによるインサイト抽出の手順が明確になった。次のスプリントのユーザーテストで実践する。',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    messages: [
      {
        id: 'msg-5-1',
        role: 'user',
        content: '効果的なユーザーインタビューの設計方法と、インタビュー結果からインサイトを抽出する手法を教えてください。',
        timestamp: daysAgo(1),
      },
      {
        id: 'msg-5-2',
        role: 'assistant',
        content: `ユーザーインタビューは正しく設計すれば、プロダクトの方向性を大きく変えるインサイトが得られます。

## インタビュー設計の原則

### 1. 5段階構造
1. **ウォームアップ**（5分）: 自己紹介、日常的な話題
2. **コンテキスト理解**（10分）: 普段の業務/生活の流れ
3. **課題深掘り**（15分）: 具体的なエピソードを引き出す
4. **ソリューション探索**（10分）: 理想の状態を語ってもらう
5. **クロージング**（5分）: 追加コメント、お礼

### 2. 質問設計のコツ
- **「なぜ」を5回繰り返す**（表層→深層の動機へ）
- **具体的なエピソード**を聞く：「最後にXしたのはいつですか？」
- **誘導質問を避ける**：「Xは便利だと思いますか？」→ NG

## インサイト抽出法

### アフィニティダイアグラム
1. インタビューのメモから**事実カード**を作成
2. 類似するカードを**ボトムアップでグルーピング**
3. 各グループに**テーマラベル**を付ける
4. テーマ間の**関係性をマッピング**

### Jobs-to-be-Done フレームワーク
「ユーザーが"雇う"仕事」の視点で整理：
- **When**: どんな状況で
- **I want to**: 何をしたくて
- **So that**: どんな成果を期待している

これにより、機能要件ではなく**ユーザーの本質的なニーズ**が見えてきます。`,
        timestamp: daysAgo(1),
      },
    ],
  },
  {
    id: 'conv-microservices-async',
    title: 'マイクロサービス間の非同期通信パターン比較',
    source: 'gemini',
    status: 'active',
    tags: ['マイクロサービス', 'メッセージング', '分散システム'],
    note: 'イベント駆動 vs コレオグラフィ vs オーケストレーションの比較が明快。Pub/Subベースのイベント駆動パターンを次のプロジェクトで採用する方向で検討。',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
    messages: [
      {
        id: 'msg-6-1',
        role: 'user',
        content: 'マイクロサービス間の非同期通信パターンを比較検討したいです。イベント駆動、コレオグラフィ、オーケストレーションの使い分けを教えてください。',
        timestamp: daysAgo(6),
      },
      {
        id: 'msg-6-2',
        role: 'assistant',
        content: `マイクロサービス間の非同期通信パターンには、それぞれ明確な適用場面があります。

## パターン比較

| パターン | 結合度 | 複雑さ | 可視性 | 適用場面 |
|----------|--------|--------|--------|----------|
| イベント駆動 | 低 | 低 | 低 | 通知、ログ、監査 |
| コレオグラフィ | 低 | 中 | 低 | 独立性の高いワークフロー |
| オーケストレーション | 中 | 高 | 高 | 複雑なビジネスプロセス |

## 1. イベント駆動（Event-Driven）
- **仕組み**: サービスがイベントを発行し、関心のあるサービスがサブスクライブ
- **利点**: サービス間の結合度が最も低い
- **GCP実装**: Cloud Pub/Sub

## 2. コレオグラフィ（Choreography）
- **仕組み**: 各サービスが次のサービスにイベントを連鎖的に伝播
- **利点**: 中央制御なしで自律的に動作
- **注意**: サービス数が増えると追跡が困難になる

## 3. オーケストレーション（Orchestration）
- **仕組み**: 中央のオーケストレーターがワークフロー全体を制御
- **利点**: プロセス全体の可視性が高い
- **GCP実装**: Cloud Workflows

**推奨**: まずはイベント駆動で始め、ワークフローが複雑化したらオーケストレーションを導入するのが実用的です。`,
        timestamp: daysAgo(6),
      },
    ],
  },
];

// ─── デモスペースデータ ───
const spaces = [
  {
    id: 'space-fullstack-nextjs',
    title: 'Next.js フルスタック開発',
    description: 'React Server Components、TypeScript型安全、データフェッチングなど、Next.jsプロジェクトの技術的な知見をまとめたスペース。',
    conversationIds: ['conv-react-server-components', 'conv-typescript-type-level'],
    note: 'プロジェクトの技術基盤に関わる重要な議論をグループ化。設計判断の振り返りに活用する。',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'space-product-strategy',
    title: 'プロダクト開発戦略',
    description: 'PMF分析、ユーザーリサーチ、ビジネス戦略など、プロダクトの方向性に関する議論をまとめたスペース。',
    conversationIds: ['conv-product-market-fit', 'conv-user-interview'],
    note: '事業判断に関わる重要な洞察を集約。チーム内共有の際のリファレンスとして使う。',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

// ─── デモ洞察データ ───
const insights = [
  {
    id: 'insight-rsc-fetch-pattern',
    conversationId: 'conv-react-server-components',
    question: 'Server Componentでのデータフェッチングで最も重要な設計原則は？',
    answer: '「データの近くでフェッチする」がRSCの核心的な設計思想です。Server Componentでデータを取得し、Client Componentは表示とインタラクションに専念させることで、クライアントバンドルサイズを削減しつつ、データフェッチングの効率を最大化できます。',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'insight-rsc-client-access',
    conversationId: 'conv-react-server-components',
    question: 'Client ComponentからServer Componentのデータにアクセスする最善の方法は？',
    answer: 'Props経由で渡すのが最も推奨されるパターンです。Server Componentでデータを取得し、Client Componentにpropsとして渡します。ミューテーションにはServer Actions、リアルタイム更新にはRoute Handlersを使います。',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'insight-ml-ab-test',
    conversationId: 'conv-ml-deploy-pipeline',
    question: 'MLモデルのA/Bテストで最も注意すべき点は？',
    answer: '統計的有意性だけでなく実用的有意性も考慮すること。p値 < 0.05でも改善幅が0.1%なら見送るべきです。また、ガードレール指標（ユーザー体験の毀損がないか）を必ず設定し、ロールバック判定は自動化してレイテンシ悪化やエラー率上昇時に即座に旧バージョンに戻す仕組みにしてください。',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'insight-space-pmf-measurement',
    spaceId: 'space-product-strategy',
    question: 'PMFの最も確実な指標は何か？',
    answer: 'オーガニック成長率（口コミ経由のユーザー獲得率）が最も確実なPMF指標です。マーケティング費をかけずに成長しているかどうかで判断します。定量的にはSean Ellisテストで「とても残念」が40%以上、Day 30リテンション率が20%以上が目安です。',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

// ─── メイン処理 ───
async function main() {
  console.log('🗑️  既存データを削除中...');
  const deletedConv = await deleteCollection('conversations');
  const deletedSpaces = await deleteCollection('spaces');
  const deletedInsights = await deleteCollection('insights');
  console.log(`   conversations: ${deletedConv}件削除`);
  console.log(`   spaces: ${deletedSpaces}件削除`);
  console.log(`   insights: ${deletedInsights}件削除`);

  console.log('\n📝 デモ対話データを投入中...');
  for (const conv of conversations) {
    const { id, ...data } = conv;
    await db.collection('conversations').doc(id).set(data);
    console.log(`   ✅ ${conv.title}`);
  }

  console.log('\n📂 デモスペースデータを投入中...');
  for (const space of spaces) {
    const { id, ...data } = space;
    await db.collection('spaces').doc(id).set(data);
    console.log(`   ✅ ${space.title}`);
  }

  console.log('\n💡 デモ洞察データを投入中...');
  for (const insight of insights) {
    const { id, ...data } = insight;
    await db.collection('insights').doc(id).set(data);
    console.log(`   ✅ ${insight.question.slice(0, 40)}...`);
  }

  console.log('\n🎉 デモデータの投入が完了しました！');
  console.log(`   対話: ${conversations.length}件`);
  console.log(`   スペース: ${spaces.length}件`);
  console.log(`   洞察: ${insights.length}件`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ エラーが発生しました:', err);
  process.exit(1);
});
