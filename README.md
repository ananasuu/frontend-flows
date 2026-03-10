# frontend-flows

Wiederverwendbare Playwright-Test-Suite fuer Frontend-Repositories.

Dieses Repository stellt zentrale Frontend-Checks bereit, damit du Tests nicht in jedem Projekt neu bauen musst:

- Funktionale Smoke-Checks (`@functional`)
- Accessibility-Checks mit Axe (`@a11y`)
- Optionale Lighthouse-Checks (`@performance`)
- Wiederverwendbarer GitHub-Workflow fuer andere Repos

## Was wird getestet?

Die Test-Suite in `tests/all-pages.test.ts` laeuft fuer eine konfigurierbare Routenliste (`FRONTEND_FLOWS_URLS`):

- Seite antwortet mit Status < 400
- Seite hat einen nicht-leeren `<title>`
- Keine Axe-Verstoesse (Chromium)
- Optional Lighthouse-Scores (Chromium, wenn aktiviert)

`FRONTEND_FLOWS_URLS` legt fest, welche Seiten getestet werden.
Im reusable Workflow ist `urls: auto` der Default: Routen werden dabei automatisch aus der Sitemap der Ziel-App gelesen.
Wenn keine Sitemap gefunden wird, faellt der Workflow automatisch auf `/` zurueck.

## Dieses Repo lokal verwenden

```bash
npm ci
npx playwright install --with-deps
FRONTEND_FLOWS_BASE_URL=http://127.0.0.1:4173 FRONTEND_FLOWS_URLS="/,/contact,/impressum" npm test
```

Optionale Lighthouse-Pruefung:

```bash
FRONTEND_FLOWS_ENABLE_LIGHTHOUSE=true npm run test:performance
```

## Lokale Checks erzwingen (Husky)

Dieses Repo ist so eingerichtet, dass lokale Git-Hooks Quality-Checks erzwingen:

- `pre-commit`: `npm run git:pre-commit` (nutzt `lint-staged`, also Prettier/Biome auf geaenderten Dateien)
- `pre-push`: `npm run lint`

Nach `npm install` werden Hooks ueber `prepare` automatisch eingerichtet.

## In anderen Repositories verwenden (empfohlen)

In deinem Ziel-Repository erstellst du eine Workflow-Datei, z. B. `.github/workflows/frontend-tests.yml`:

```yaml
name: Frontend Tests

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
      lint-command: auto
      start-command: npm run start:prod -- --host 127.0.0.1 --port 4173
      base-url: http://127.0.0.1:4173
      urls: auto
      enable-lighthouse: false
```

Danach entstehen die GitHub Actions-Laeufe automatisch im Ziel-Repository bei Push und Pull Request.

Hinweis: Im Ziel-Repo reicht ein Sammel-Workflow (ein zentraler Einstieg per `uses`).
Die einzelnen Checks (`Dependency Review`, `Dependencies`, `NPM Build`, `PR Lint`, `NPM Test`, `Checks`) werden trotzdem getrennt angezeigt.

## Workflow-Dateien automatisch erzeugen

Ja, das kannst du automatisieren.

### Option 1: Direkt aus GitHub (One-Liner)

Im Ziel-Repo ausfuehren:

```bash
curl -fsSL https://raw.githubusercontent.com/ananasuu/frontend-flows/main/scripts/bootstrap-consumer-workflow.sh | bash
```

Mit zusaetzlichem projektspezifischem E2E-Job:

```bash
curl -fsSL https://raw.githubusercontent.com/ananasuu/frontend-flows/main/scripts/bootstrap-consumer-workflow.sh | bash -s -- --with-project-e2e
```

Mit eigenen Defaults fuer Node, Base URL und Routen:

```bash
curl -fsSL https://raw.githubusercontent.com/ananasuu/frontend-flows/main/scripts/bootstrap-consumer-workflow.sh | bash -s -- \
  --node-version 22 \
  --base-url http://127.0.0.1:4321 \
  --urls "auto"
```

Das Skript traegt standardmaessig `scripts.format` und `scripts.lint` in `package.json` ein.

Wenn du das explizit einschalten willst:

```bash
curl -fsSL https://raw.githubusercontent.com/ananasuu/frontend-flows/main/scripts/bootstrap-consumer-workflow.sh | bash -s -- --add-lint-scripts
```

### Option 2: Lokales Skript verwenden

```bash
bash scripts/bootstrap-consumer-workflow.sh
```

Optional mit zusaetzlichem E2E-Job:

```bash
bash scripts/bootstrap-consumer-workflow.sh --with-project-e2e
```

Mit benutzerdefinierten Werten:

```bash
bash scripts/bootstrap-consumer-workflow.sh \
  --node-version 22 \
  --working-directory apps/web \
  --install-command "npm ci" \
  --build-command "npm run build" \
  --lint-command "auto" \
  --start-command "npm run start:prod -- --host 127.0.0.1 --port 4321" \
  --base-url "http://127.0.0.1:4321" \
  --urls "auto"
```

`scripts.format` und `scripts.lint` werden standardmaessig geschrieben.

Explizites Einschalten (optional):

```bash
bash scripts/bootstrap-consumer-workflow.sh --add-lint-scripts
```

Opt-out, falls du keine package.json-Skripte aendern willst:

```bash
bash scripts/bootstrap-consumer-workflow.sh --no-add-lint-scripts
```

Mit `--force` kannst du eine bereits vorhandene Datei ueberschreiben.
Das Skript erzeugt:

- `.github/workflows/frontend-tests.yml`

Danach im Ziel-Repo:

- Datei pruefen
- committen
- pushen

Erst danach startet GitHub Actions im Ziel-Repo mit der neuen Workflow-Datei.

Unterstuetzte Flags:

- `--with-project-e2e`
- `--force`
- `--node-version`
- `--working-directory`
- `--install-command`
- `--build-command`
- `--lint-command`
- `--start-command`
- `--base-url`
- `--urls`
- `--add-lint-scripts`
- `--no-add-lint-scripts`

## Wichtige Inputs des Reusable Workflows

- `install-command`: Install-Befehl im Ziel-Repo (z. B. `npm ci`)
- `build-command`: Build-Befehl (Default: `npm run build`)
- `lint-command`: Lint-Befehl. Default `auto` fuehrt den eingebauten Lint aus diesem Repo aus (Prettier + Biome via `npx`). Du kannst stattdessen einen eigenen Befehl setzen (z. B. `npm run lint` oder `pnpm lint`).
- `start-command`: Startbefehl fuer die App (Default: `npm run start:prod -- --host 127.0.0.1 --port 4173`)
- `base-url`: URL, unter der die App im Runner erreichbar ist
- `urls`: Komma-separierte Routen oder `auto` (Default, Sitemap-basiert)
- `grep`: Optionales Playwright-Filterpattern
- `enable-lighthouse`: `true` oder `false`

### Was macht `lint-command: auto`?

Wenn `lint-command` auf `auto` steht (Default), fuehrt `PR Lint` direkt diese Checks aus:

- `npx --yes prettier@3 --check --ignore-unknown --no-error-on-unmatched-pattern .`
- `npx --yes @biomejs/biome@1.9.4 lint .`

Dadurch brauchst du im Ziel-Repo kein eigenes `lint`-Script in `package.json`.

Wenn du stattdessen deinen Projekt-Linter verwenden willst, setze `lint-command` explizit, z. B.:

```yaml
lint-command: npm run lint
```

## Wann darf Build optional sein?

`build-command` kann angepasst werden, wenn dein Testlauf andere Build-Anforderungen hat.

Typische Faelle:

- Die App wird fuer den Test direkt im Dev-Modus gestartet (z. B. mit `npm run start`).
- Ihr testet gegen eine bereits laufende Umgebung (z. B. Staging/Preview-URL).
- Das Projekt hat keinen separaten Build-Schritt.

Build sollte gesetzt werden, wenn:

- `start-command` auf erzeugte Artefakte angewiesen ist (z. B. `dist/`, `.next/`).
- Ihr den produktionsnahen Stand im CI absichern wollt.
- Build-Fehler frueh sichtbar sein sollen (Bundling, SSR, Type-Checks im Build).

Empfehlung:

- PR-Schnellchecks: Build optional.
- Merge-/Release-Gate: Build verpflichtend.

## Welche Actions im Ziel-Repo entstehen?

Der reusable Workflow erzeugt getrennte Checks:

- `Dependency Review` (bei Pull Requests)
- `Dependencies`
- `NPM Build`
- `PR Lint`
- `NPM Test`
- `Checks`

So bekommst du nicht nur einen einzelnen Sammel-Job, sondern klare Einzel-Checks pro Bereich.

## Mapping zu deinen bisherigen Workflow-Dateien

Wenn du vorher getrennte Workflows wie `checks`, `dependencies`, `deploy`, `npm build`, `npm test`, `pr lint`, `visual test` hattest, ist die Zuordnung in diesem Setup so:

- `checks` -> `Consolidate Test Results`
- `dependencies` -> `Dependency Review` und `Dependencies`
- `npm build` -> `NPM Build`
- `npm test` -> `NPM Test`
- `pr lint` -> `PR Lint`
- `deploy` -> bewusst nicht enthalten (Deployment bleibt im Ziel-Repo separat)
- `visual test` -> bewusst nicht enthalten

`visual test` wird in diesem Setup absichtlich nicht ausgefuehrt.

## Typische Varianten

Nur A11y laufen lassen:

```yaml
grep: "@a11y"
```

Nur funktionale Checks laufen lassen:

```yaml
grep: "@functional"
```

Lighthouse aktivieren:

```yaml
enable-lighthouse: true
```

## Zusaetzliche E2E-Tests im Ziel-Repo einbinden

Du kannst im Ziel-Repo eigene E2E-Tests zusaetzlich laufen lassen, unabhaengig von `frontend-flows`.
Empfehlung: eigener Job, damit du getrennte Checks fuer Standard-Checks und projektspezifische E2E bekommst.

Beispiel fuer `.github/workflows/frontend-tests.yml` im Ziel-Repo:

```yaml
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
      lint-command: auto
      start-command: npm run start:prod -- --host 127.0.0.1 --port 4173
      base-url: http://127.0.0.1:4173
      urls: auto
      enable-lighthouse: false

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
```

Damit hast du im Ziel-Repo getrennte Checks fuer:

- Standardisierte `frontend-flows` Qualitaetspruefungen
- Eure projektspezifischen End-to-End-Flows

## Was muss im Ziel-Repo fuer E2E installiert sein?

Fuer den `frontend-flows`-Teil musst du im Ziel-Repo keine zusaetzlichen Test-Libraries installieren.
Die eigentliche Playwright- und Axe/Lighthouse-Logik kommt aus diesem Repository und wird im CI-Run mit ausgecheckt.

Im Ziel-Repo benoetigst du nur:

- Eine funktionierende Node-Installation im CI (kommt ueber `actions/setup-node`)
- Ein funktionierendes Install-Kommando (z. B. `npm ci`, alternativ `pnpm install --frozen-lockfile`)
- Einen Build- und Start-Flow, den der Workflow aufrufen kann (`build-command`, `start-command`)
- Falls du eigene projektspezifische E2E-Tests zusaetzlich laufen laesst: dort die fuer diese Tests benoetigten Dependencies

Kurz gesagt:

- Nur `frontend-flows` nutzen: keine extra E2E-Pakete im Ziel-Repo erforderlich.
- Eigene E2E-Suite im Ziel-Repo: dafuer musst du die benoetigten Pakete im Ziel-Repo selbst installieren.

## Noetige Dateistruktur im Ziel-Repo

Minimal benoetigt:

- `.github/workflows/frontend-tests.yml` (oder anderer Workflow-Name mit `uses` auf `frontend-flows`)
- `package.json` mit den referenzierten Skripten (mindestens fuer `install-command`, `build-command`, `start-command`, optional `lint-command`)
- Ein passender Lockfile zum Paketmanager (`package-lock.json`, `pnpm-lock.yaml` oder `yarn.lock`)

Empfohlene Struktur:

- Monorepo: `working-directory` auf das Frontend-Paket setzen (z. B. `apps/web`)
- Optional eigene E2E-Tests in einem klaren Ordner (z. B. `tests/e2e`) inklusive eigener Playwright-Konfiguration im Ziel-Repo

Zusatz fuer automatische URL-Erkennung (`urls: auto`):

- Die laufende App sollte eine Sitemap unter `/sitemap-index.xml` oder `/sitemap.xml` bereitstellen.
- Falls keine Sitemap verfuegbar ist, wird automatisch nur `/` getestet.

## Hinweise

- Das Ziel-Repo muss durch `start-command` wirklich eine erreichbare App starten.
- Falls du `pnpm` oder `yarn` nutzt, passe `install-command`, `build-command` und `start-command` entsprechend an.
- Fuer stabile Ergebnisse sollten die in `urls` angegebenen Seiten in jeder Umgebung verfuegbar sein.
