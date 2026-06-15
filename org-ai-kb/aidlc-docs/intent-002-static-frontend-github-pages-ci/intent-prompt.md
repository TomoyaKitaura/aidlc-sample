# Intent Prompt

app/ で生成されたフロントエンドを静的ビルドし、GitHub Pages にアップロードする。これを main ブランチへの push 時に自動実行する CI(GitHub Actions) を構築する。現状の app は Express サーバ(/api バックエンド付き)で静的フロントを配信しているため、GitHub Pages(静的ホスティング)で動くよう /api 依存を静的化する対応も含む。
