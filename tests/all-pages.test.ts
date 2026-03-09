import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@chromatic-com/playwright';
import { lighthouseTest } from './fixtures/performance.ts';

async function extractUrlsFromSitemap(): Promise<string[]> {
	try {
		const sitemapIndexPath = join(process.cwd(), 'dist', 'sitemap-index.xml');
		const sitemapIndexContent = readFileSync(sitemapIndexPath, 'utf-8');

		const urls: string[] = [];

		const sitemapUrls = sitemapIndexContent.match(/<loc>(.*?)<\/loc>/g) || [];

		for (const sitemapUrlMatch of sitemapUrls) {
			const sitemapUrl = sitemapUrlMatch.replace(/<\/?loc>/g, '');
			const sitemapFilename = sitemapUrl.split('/').pop();

			if (sitemapFilename) {
				const sitemapPath = join(process.cwd(), 'dist', sitemapFilename);

				try {
					const sitemapContent = readFileSync(sitemapPath, 'utf-8');

					const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];

					for (const urlMatch of urlMatches) {
						const fullUrl = urlMatch.replace(/<\/?loc>/g, '');
						const relativeUrl = fullUrl.replace('https://www.cycos.com', '');
						urls.push(relativeUrl || '/');
					}
				} catch {
					console.warn(`Konnte Sitemap-Datei nicht lesen: ${sitemapPath}`);
				}
			}
		}

		return [...new Set(urls)];
	} catch (error) {
		console.error('Fehler beim Lesen der Sitemap:', error);
		return [];
	}
}

function getLanguageFromUrl(url: string): 'en' | 'de' {
	return url.startsWith('/de') ? 'de' : 'en';
}

function getTagsForUrl(url: string): string[] {
	const tags: string[] = [];

	tags.push(`@${getLanguageFromUrl(url)}`);

	if (url === '/' || url === '/de') {
		tags.push('@homepage');
	} else if (url.includes('contact') || url.includes('kontakt')) {
		tags.push('@contact');
	} else if (
		url.includes('legal') ||
		url.includes('impressum') ||
		url.includes('datenschutz') ||
		url.includes('privacy')
	) {
		tags.push('@legal');
	} else if (url.includes('about') || url.includes('ueber-uns')) {
		tags.push('@about');
	} else if (url.includes('services') || url.includes('leistungen')) {
		tags.push('@services');
	} else if (url.includes('career') || url.includes('karriere')) {
		tags.push('@career');
	} else if (url.includes('products') || url.includes('produkte')) {
		tags.push('@products');
	} else if (url.includes('investor-relations')) {
		tags.push('@investor-relations');
	}

	return tags;
}

async function generateTests() {
	const urls = await extractUrlsFromSitemap();

	for (const url of urls) {
		const tags = getTagsForUrl(url);

		test.describe(`Tests für ${url}`, () => {
			// Accessibility Tests
			test.describe('a11y', { tag: [...tags, '@a11y'] }, () => {
				// run tests in chromium with light and dark mode
				test.skip(
					({ browserName }) => !browserName.startsWith('chromium'),
					'A11y tests only need to run in one browser',
				);

				test(`a11y test for ${url}`, async ({ page }) => {
					const { expect: expectA11y } = await import('./fixtures/a11y.ts');

					await page.goto(url);

					const { default: AxeBuilder } = await import('@axe-core/playwright');
					const axeBuilder = new AxeBuilder({ page });
					const accessibilityScanResults = await axeBuilder.analyze();

					expectA11y(accessibilityScanResults.violations).toEqual([]);
				});
			});

			test.describe('performance', { tag: [...tags, '@performance'] }, () => {
				lighthouseTest(`lighthouse tests of ${url}`, async ({ page, port }) => {
					test.setTimeout(90000); // 90 seconds for Lighthouse tests

					await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

					const { playAudit } = await import('playwright-lighthouse');
					const { thresholds } = await import('./fixtures/performance.ts');

					await playAudit({
						page,
						thresholds: thresholds,
						port: port,
						opts: {
							logLevel: 'error',
							onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
							throttling: {
								cpuSlowdownMultiplier: 2, // Less aggressive than default 4x
							},
							screenEmulation: {
								disabled: true,
							},
						},
					});
				});
			});

			test.describe('functional', { tag: [...tags, '@functional'] }, () => {
				test.skip(({ browserName }) => browserName.endsWith('--dark'), 'No need to run functional tests in dark mode');

				test(`Seite lädt ohne Fehler: ${url}`, async ({ page }) => {
					const response = await page.goto(url);

					expect(response?.status()).toBeLessThan(400);

					const title = await page.title();
					expect(title).toBeTruthy();
					expect(title.length).toBeGreaterThan(0);

					const h1Elements = await page.locator('h1').count();
					expect(h1Elements).toBe(1);
				});
			});
		});
	}
}

(async () => {
	await generateTests();
})();
