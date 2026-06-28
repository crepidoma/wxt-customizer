# wxt-customizer

WXT React プロジェクトを作成した直後に、自分用の初期設定を追加する post-init customizer です。

[English](./README.md)

## 使い方

先に WXT のプロジェクトを作成し、そのプロジェクトディレクトリで customizer を実行します。

```sh
pnpm dlx wxt@latest init my-extension --template react --pm pnpm
cd my-extension
pnpm dlx github:crepidoma/wxt-customizer
```

CLI は `package.json#name` を質問します。初期値には現在のディレクトリ名を使います。

## 変更内容

- `package.json#name` を質問して更新します。
- `package.json` に formatter / linter 用 scripts を追加します。
- `packageManager`、lockfile、npm user agent から npm / yarn / pnpm / bun を判定します。判定できない場合は npm を使います。
- 判定した package manager の `add` コマンドで runtime / dev dependencies を追加します。
- 依存関係の追加後、最後に `wxt prepare` を実行します。
- WXT が生成した `.gitignore` に `.vscode/settings.json` の例外を追加します。
- `overlay/` 配下のファイルを対象プロジェクトへコピーします。
- `@webext-core/messaging`、`vault.debug`、`@1natsu/wait-element` の簡単なサンプルを `entrypoints/` と `utils/` に追加します。
- WXT が生成したリソースを土台にし、このリポジトリのカスタマイズだけを後から適用します。
- TypeScript CLI は tsdown で `bin/index.mjs` に build します。`@inquirer/prompts` と `commander` は package dependencies として扱います。

## オプション

- `--name <name>`: 質問せずに `package.json#name` を設定します。
- `--dir <path>`: 対象ディレクトリを指定します。省略時は現在のディレクトリです。
- `--pm <pm>`: `npm`、`yarn`、`pnpm`、`bun` のいずれかを明示します。
- `--dry-run`: ファイル変更や依存追加を実行せず、予定される処理だけを表示します。
- `--no-overwrite`: 既存の overlay 対象ファイルを上書きしません。
- `--no-install`: 依存関係の追加コマンドを実行しません。

