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
      start-command: npm run preview -- --host 127.0.0.1 --port 4173
      base-url: http://127.0.0.1:4173
      urls: "/,/about,/contact,/impressum"
      enable-lighthouse: false
```

Danach entstehen die GitHub Actions-Laeufe automatisch im Ziel-Repository bei Push und Pull Request.

## Wichtige Inputs des Reusable Workflows

- `install-command`: Install-Befehl im Ziel-Repo (z. B. `npm ci`)
- `build-command`: Optionaler Build-Befehl (z. B. `npm run build`)
- `start-command`: Startbefehl fuer die App (muss gesetzt sein)
- `base-url`: URL, unter der die App im Runner erreichbar ist
- `urls`: Komma-separierte Routen
- `grep`: Optionales Playwright-Filterpattern
- `enable-lighthouse`: `true` oder `false`

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

## Hinweise

- Das Ziel-Repo muss durch `start-command` wirklich eine erreichbare App starten.
- Falls du `pnpm` oder `yarn` nutzt, passe `install-command`, `build-command` und `start-command` entsprechend an.
- Fuer stabile Ergebnisse sollten die in `urls` angegebenen Seiten in jeder Umgebung verfuegbar sein.
