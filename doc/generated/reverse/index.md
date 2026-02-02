# ThinkResume 設計ドキュメント

## このドキュメントについて

- **生成日時**: 2026-02-02
- **解析対象**: `apps/web`, `apps/extension`, `packages/shared`
- **SSOT参照**: `doc/input/rdd.md`, `doc/input/architecture.md`

## 読む順番（推奨）

1. [overview.md](overview.md) - まず全体像を把握
2. [architecture.md](architecture.md) - 設計判断の背景を理解
3. [database.md](database.md) - データ構造を確認
4. [api.md](api.md) - APIインターフェースを確認
5. [modules/](modules/) - 必要なモジュールを深掘り
   - [modules/web.md](modules/web.md) - Webアプリケーション
   - [modules/extension.md](modules/extension.md) - Chrome拡張機能
   - [modules/shared.md](modules/shared.md) - 共通型定義

## SSOT差分（要確認）

- [ssot_diff.md](ssot_diff.md) - SSOTとの差分提案

## ドキュメント更新ポリシー

このディレクトリ（`doc/generated/reverse/`）内のファイルは**上書き更新可能**です。
履歴はGitで追跡されます。SSOTとの差分がある場合は `ssot_diff.md` に記録し、
勝手に `doc/input/` を変更しないでください。
