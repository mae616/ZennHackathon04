/**
 * Firebase Admin SDK 初期化モジュール
 *
 * サーバーサイドでFirestoreにアクセスするための初期化ロジック。
 * 環境変数から認証情報を読み取り、シングルトンパターンでアプリを初期化する。
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDKを初期化する
 *
 * 既に初期化済みの場合は既存のアプリを返す。
 * 環境変数が未設定の場合はエラーをスローする。
 *
 * @returns 初期化されたFirebase Adminアプリ
 * @throws 環境変数が未設定の場合
 */
function initFirebaseAdmin(): App {
  // 既存アプリがあれば再利用
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // 環境変数の検証
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK の初期化に必要な環境変数が設定されていません。' +
        'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY を確認してください。'
    );
  }

  // 新規アプリを初期化して返す
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // 環境変数内の改行文字（\\n）を実際の改行に変換
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * Firestoreインスタンスを取得する
 *
 * Firebase Admin SDKを初期化し、Firestoreクライアントを返す。
 *
 * @returns Firestoreインスタンス
 * @throws Firebase初期化に失敗した場合
 */
export function getDb(): Firestore {
  const adminApp = initFirebaseAdmin();
  return getFirestore(adminApp);
}

/**
 * Firebase Admin が初期化済みかどうかを確認する
 *
 * @returns 初期化済みの場合true
 */
export function isFirebaseInitialized(): boolean {
  return getApps().length > 0;
}
