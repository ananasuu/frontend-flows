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
      lint-command: npm run lint
      start-command: npm run preview -- --host 127.0.0.1 --port 4173
      base-url: http://127.0.0.1:4173
      urls: "/,/about,/contact,/impressum"
      enable-lighthouse: false
```

Danach entstehen die GitHub Actions-Laeufe automatisch im Ziel-Repository bei Push und Pull Request.

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

### Option 2: Lokales Skript verwenden

```bash
bash scripts/bootstrap-consumer-workflow.sh
```

Optional mit zusaetzlichem E2E-Job:

```bash
bash scripts/bootstrap-consumer-workflow.sh --with-project-e2e
```

Mit `--force` kannst du eine bereits vorhandene Datei ueberschreiben.
Das Skript erzeugt:

- `.github/workflows/frontend-tests.yml`

## Wichtige Inputs des Reusable Workflows

- `install-command`: Install-Befehl im Ziel-Repo (z. B. `npm ci`)
- `build-command`: Optionaler Build-Befehl (z. B. `npm run build`)
- `lint-command`: Optionaler Lint-Befehl (z. B. `npm run lint`)
- `start-command`: Startbefehl fuer die App (muss gesetzt sein)
- `base-url`: URL, unter der die App im Runner erreichbar ist
- `urls`: Komma-separierte Routen
- `grep`: Optionales Playwright-Filterpattern
- `enable-lighthouse`: `true` oder `false`

## Wann darf Build optional sein?

`build-command` kann leer bleiben, wenn dein Testlauf keine frischen Build-Artefakte benoetigt.

Typische Faelle:

- Die App wird fuer den Test direkt im Dev-Modus gestartet.
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
- `Build`
- `Lint`
- `Tests`
- `Consolidate Test Results`

So bekommst du nicht nur einen einzelnen Sammel-Job, sondern klare Einzel-Checks pro Bereich.

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

Nur die `frontend-flows` A11y-Tests:

```yaml
grep: "@a11y"
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
      lint-command: npm run lint
      start-command: npm run preview -- --host 127.0.0.1 --port 4173
      base-url: http://127.0.0.1:4173
      urls: "/,/about,/contact"
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
```

Damit hast du im Ziel-Repo getrennte Checks fuer:

- Standardisierte `frontend-flows` Qualitaetspruefungen
- Eure projektspezifischen End-to-End-Flows

## Hinweise

- Das Ziel-Repo muss durch `start-command` wirklich eine erreichbare App starten.
- Falls du `pnpm` oder `yarn` nutzt, passe `install-command`, `build-command` und `start-command` entsprechend an.
- Fuer stabile Ergebnisse sollten die in `urls` angegebenen Seiten in jeder Umgebung verfuegbar sein.
