# Intent

## Prompt

app/ で生成されたフロントエンドを静的ビルドし、GitHub Pages にアップロードする。これを main ブランチへの push 時に自動実行する CI(GitHub Actions) を構築する。現状の app は Express サーバ(/api バックエンド付き)で静的フロントを配信しているため、GitHub Pages(静的ホスティング)で動くよう /api 依存を静的化する対応も含む。

## Summary

A brownfield intent targeting the existing sample EC application at `app/` (built by intent-001-sample-ec-site). The app is a Node.js/Express server that serves a static frontend from `app/public` and backs it with a mock JSON API under `/api` (products list, product detail, order creation). This intent transforms the frontend so it can run as a fully static site on GitHub Pages: the `/api` runtime dependencies are replaced with static data and client-side logic, the frontend is built into a deployable static bundle, and a GitHub Actions workflow is added to automatically build and publish that bundle to GitHub Pages on every push to the `main` branch.

## Slug

static-frontend-github-pages-ci

## Type

feature (CI/CD pipeline plus brownfield refactor to static-host the existing frontend)
