import { test as base } from '@playwright/test';
import getPort from 'get-port';
import type { Browser } from 'playwright';
import { chromium } from 'playwright';

export const lighthouseTest = base.extend<object, { port: number; browser: Browser }>({
	port: [
		// biome-ignore lint/correctness/noEmptyPattern: Required by lighthouseTest
		async ({}, use) => {
			const port = await getPort();
			await use(port);
		},
		{ scope: 'worker' },
	],

	browser: [
		async ({ port }, use) => {
			const browser = await chromium.launch({
				args: [`--remote-debugging-port=${port}`],
			});
			await use(browser);
		},
		{ scope: 'worker' },
	],
});

export const thresholds = {
	performance: 60,
	accessibility: 100,
	'best-practices': 96, // TODO: increase when all stock images are replaced
	seo: 100,
};
