# All Pages Test

`tests/all-pages.test.ts` ist ein generischer Testlauf fuer mehrere Routen.

## Konfiguration

- `FRONTEND_FLOWS_BASE_URL`: Basis-URL der laufenden Anwendung
- `FRONTEND_FLOWS_URLS`: Komma-separierte Routen, z. B. `/,/about,/contact`
- `FRONTEND_FLOWS_ENABLE_LIGHTHOUSE`: `true` oder `false`

## Enthaltene Checks

- `@functional`: Response-Status und Titel-Pruefung
- `@a11y`: Axe-Scan (Chromium)
- `@performance`: Lighthouse (optional, Chromium)

## Beispiele

Alle Checks:

```bash
FRONTEND_FLOWS_BASE_URL=http://127.0.0.1:4173 FRONTEND_FLOWS_URLS="/,/about,/contact" npx playwright test
```

Nur A11y:

```bash
npx playwright test --grep "@a11y"
```

Lighthouse aktivieren:

```bash
FRONTEND_FLOWS_ENABLE_LIGHTHOUSE=true npx playwright test --grep "@performance"
```
