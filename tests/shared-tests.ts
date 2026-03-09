import { expect as expectA11y, test as testA11y } from './fixtures/a11y.ts';
import { lighthouseTest, thresholds } from './fixtures/performance.ts';

export async function pageTests(url: string, tags: string[]): Promise<void> {
	testA11y.describe('a11y', { tag: [...tags, '@a11y'] }, () => {
		testA11y(`a11y test for ${url}`, async ({ page, makeAxeBuilder }) => {
			await page.goto(url);

			const accessibilityScanResults = await makeAxeBuilder()
				// Automatically uses the shared AxeBuilder configuration,
				// but supports additional test-specific configuration too
				// .include('#specific-element-under-test')
				.analyze();

			expectA11y(accessibilityScanResults.violations).toEqual([]);
		});
	});

	lighthouseTest.describe('performance', { tag: [...tags, '@performance'] }, () => {
		lighthouseTest(`lighthouse tests of ${url}`, async ({ page, port }) => {
			await page.goto(url);

			// Dynamischer Import von playAudit
			const { playAudit } = await import('playwright-lighthouse');
			await playAudit({
				page,
				thresholds: thresholds,
				port,
			});
		});
	});
}
