#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_PATH=".github/workflows/frontend-tests.yml"
FORCE=false
WITH_PROJECT_E2E=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-project-e2e)
      WITH_PROJECT_E2E=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: bash bootstrap-consumer-workflow.sh [--with-project-e2e] [--force]"
      exit 1
      ;;
  esac
done

if [[ -f "$WORKFLOW_PATH" && "$FORCE" != "true" ]]; then
  echo "File already exists: $WORKFLOW_PATH"
  echo "Use --force to overwrite."
  exit 1
fi

mkdir -p .github/workflows

cat > "$WORKFLOW_PATH" <<'YAML'
name: Frontend Quality

on:
  pull_request:
  push:
    branches: [main]

jobs:
  frontend-flows:
    uses: ananasuu/frontend-flows/.github/workflows/reusable-frontend-tests.yml@main
    with:
      node-version: "20"
      working-directory: .
      install-command: npm ci
      build-command: npm run build
      lint-command: npm run lint
      start-command: npm run preview -- --host 127.0.0.1 --port 4173
      base-url: http://127.0.0.1:4173
      urls: "/,/about,/contact"
      enable-lighthouse: false
YAML

if [[ "$WITH_PROJECT_E2E" == "true" ]]; then
  cat >> "$WORKFLOW_PATH" <<'YAML'

  project-e2e:
    name: Project E2E
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build app
        run: npm run build

      - name: Start app
        run: |
          nohup npm run preview -- --host 127.0.0.1 --port 4173 > /tmp/project-e2e.log 2>&1 &
          echo $! > /tmp/project-e2e.pid

      - name: Wait for app
        run: |
          for i in {1..60}; do
            if curl -fsS http://127.0.0.1:4173 > /dev/null; then
              exit 0
            fi
            sleep 2
          done
          cat /tmp/project-e2e.log || true
          exit 1

      - name: Run project E2E suite
        run: npx playwright test tests/e2e

      - name: Upload project E2E report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: project-e2e-report
          path: playwright-report/

      - name: Stop app
        if: ${{ always() }}
        run: |
          if [ -f /tmp/project-e2e.pid ]; then
            kill "$(cat /tmp/project-e2e.pid)" || true
          fi
YAML
fi

echo "Created $WORKFLOW_PATH"
if [[ "$WITH_PROJECT_E2E" == "true" ]]; then
  echo "Included additional project-e2e job."
fi
