#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_PATH=".github/workflows/frontend-tests.yml"
FORCE=false
WITH_PROJECT_E2E=false
NODE_VERSION="20"
WORKING_DIRECTORY="."
INSTALL_COMMAND="npm ci"
BUILD_COMMAND="npm run build"
LINT_COMMAND="auto"
START_COMMAND="npm run start:prod -- --host 127.0.0.1 --port 4173"
BASE_URL="http://127.0.0.1:4173"
URLS="auto"
ADD_LINT_SCRIPTS=true

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
    --node-version)
      NODE_VERSION="$2"
      shift 2
      ;;
    --working-directory)
      WORKING_DIRECTORY="$2"
      shift 2
      ;;
    --install-command)
      INSTALL_COMMAND="$2"
      shift 2
      ;;
    --build-command)
      BUILD_COMMAND="$2"
      shift 2
      ;;
    --lint-command)
      LINT_COMMAND="$2"
      shift 2
      ;;
    --start-command)
      START_COMMAND="$2"
      shift 2
      ;;
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --urls)
      URLS="$2"
      shift 2
      ;;
    --add-lint-scripts)
      ADD_LINT_SCRIPTS=true
      shift
      ;;
    --no-add-lint-scripts)
      ADD_LINT_SCRIPTS=false
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: bash bootstrap-consumer-workflow.sh [options]"
      echo "  --with-project-e2e"
      echo "  --force"
      echo "  --node-version <value>"
      echo "  --working-directory <value>"
      echo "  --install-command <value>"
      echo "  --build-command <value>"
      echo "  --lint-command <value>"
      echo "  --start-command <value>"
      echo "  --base-url <value>"
      echo "  --urls <value>"
      echo "  --add-lint-scripts"
      echo "  --no-add-lint-scripts"
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

cat > "$WORKFLOW_PATH" <<YAML
name: Frontend Quality

on:
  pull_request:
  push:
    branches: [main]

jobs:
  frontend-flows:
    uses: ananasuu/frontend-flows/.github/workflows/reusable-frontend-tests.yml@main
    with:
      node-version: "$NODE_VERSION"
      working-directory: $WORKING_DIRECTORY
      install-command: $INSTALL_COMMAND
      build-command: $BUILD_COMMAND
      lint-command: $LINT_COMMAND
      start-command: $START_COMMAND
      base-url: $BASE_URL
      urls: "$URLS"
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
          nohup npm run start:prod -- --host 127.0.0.1 --port 4173 > /tmp/project-e2e.log 2>&1 &
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

if [[ "$ADD_LINT_SCRIPTS" == "true" ]]; then
  if ! command -v npm > /dev/null 2>&1; then
    echo "npm is required for --add-lint-scripts but was not found in PATH."
    exit 1
  fi

  PACKAGE_JSON_PATH="$WORKING_DIRECTORY/package.json"
  if [[ ! -f "$PACKAGE_JSON_PATH" ]]; then
    echo "Cannot add scripts because package.json was not found at: $PACKAGE_JSON_PATH"
    exit 1
  fi

  echo "Adding scripts.format and scripts.lint to $PACKAGE_JSON_PATH"
  npm --prefix "$WORKING_DIRECTORY" pkg set \
    scripts.format="npx --yes prettier@3 --write --ignore-unknown --no-error-on-unmatched-pattern ." \
    scripts.lint="npx --yes prettier@3 --check --ignore-unknown --no-error-on-unmatched-pattern . && npx --yes @biomejs/biome@1.9.4 lint ."
fi

echo "Created $WORKFLOW_PATH"
if [[ "$WITH_PROJECT_E2E" == "true" ]]; then
  echo "Included additional project-e2e job."
fi
if [[ "$ADD_LINT_SCRIPTS" == "true" ]]; then
  echo "Added npm scripts: format, lint"
fi
echo "Defaults used:"
echo "  node-version=$NODE_VERSION"
echo "  working-directory=$WORKING_DIRECTORY"
echo "  install-command=$INSTALL_COMMAND"
echo "  build-command=$BUILD_COMMAND"
echo "  lint-command=$LINT_COMMAND"
echo "  start-command=$START_COMMAND"
echo "  base-url=$BASE_URL"
echo "  urls=$URLS"
echo "  add-lint-scripts=$ADD_LINT_SCRIPTS"
