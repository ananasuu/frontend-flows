# Automated Tests for All Pages

## Overview

The new automated test in `tests/all-pages.test.ts` provides the following features:

- **Automatic Route Detection**: Reads the generated sitemap and extracts all available URLs
- **Generic Tests**: Executes accessibility, performance, and functionality tests for all pages
- **Tag-based Organization**: Automatically creates tags based on URL structure (language, page type)
- **Minimal Maintenance**: No manual maintenance of individual test files required

## Features

### 1. Automatic URL Extraction

The test reads sitemap files from the `dist/` directory:

- `sitemap-index.xml` - Main index of sitemaps
- `sitemap-0.xml` - Contains all page URLs

### 2. Test Categories

#### Accessibility Tests (`@a11y`)

- Uses Axe-Core for accessibility testing
- Runs only in Chromium (sufficient for accessibility checks)
- Validates WCAG guidelines

#### Performance Tests (`@performance`)

- Uses Playwright-Lighthouse for performance measurements
- Runs only in Chromium (Lighthouse requirement)
- Validates defined performance thresholds

#### Functional Tests (`@functional`)

- Runs in all browsers (Chromium, Firefox, WebKit)
- Validates:
  - HTTP status (< 400)
  - Presence of a page title
  - Have exactly one H1 element
  - No critical JavaScript errors

### 3. Automatic Tag Generation

The system automatically creates tags for better test organization:

- **Language**: `@en`, `@de`
- **Page Type**: `@homepage`, `@contact`, `@legal`, `@about`, `@services`, `@career`, `@products`, `@investor-relations`
- **Test Type**: `@a11y`, `@performance`, `@functional`

## Usage

### Run all tests

```bash
npm run test tests/all-pages.test.ts
```

### Functional tests only

```bash
npx playwright test tests/all-pages.test.ts --grep "@functional"
```

### Test German pages only

```bash
npx playwright test tests/all-pages.test.ts --grep "@de"
```

### Accessibility tests only

```bash
npx playwright test tests/all-pages.test.ts --grep "@a11y"
```

### Test specific page types

```bash
npx playwright test tests/all-pages.test.ts --grep "@contact"
npx playwright test tests/all-pages.test.ts --grep "@services"
```

## Prerequisites

1. **Website Build**: The sitemap must be generated:

   ```bash
   npm run build
   ```

2. **Dev Server**: The server must be running for tests:
   ```bash
   npm run start:prod
   ```
