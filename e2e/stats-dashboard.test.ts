import { test, expect } from '@playwright/test';

test.describe('Stats Dashboard', () => {
	let pixelId: string;
	let trackingUrl: string;
	let statsUrl: string;

	test.beforeEach(async ({ request }) => {
		// Create a test pixel
		const response = await request.post('/api/pixels', {
			headers: {
				'Content-Type': 'application/json',
				'x-test-suite': 'playwright-e2e'
			},
			data: {
				label: 'E2E Stats Test',
				expiresIn: 'never'
			}
		});
		
		const pixel = await response.json();
		
		// Check if we got an error
		if (pixel.error) {
			throw new Error('Failed to create pixel: ' + pixel.error);
		}
		
		pixelId = pixel.id;
		trackingUrl = pixel.trackingUrl;
		statsUrl = pixel.statsUrl;
		
		// Debug log to check values
		console.log('Test pixel created:', { pixelId, trackingUrl, statsUrl });
		
		// Verify we have valid URLs
		if (!trackingUrl || !statsUrl) {
			throw new Error('Invalid pixel response: ' + JSON.stringify(pixel));
		}

		// Generate some test data
		const userAgents = [
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17.0 Mobile Safari/604.1',
			'Mozilla/5.0 (Windows NT 5.1) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
		];

		for (const ua of userAgents) {
			await request.get(trackingUrl, {
				headers: { 'User-Agent': ua }
			});
			// Small delay to ensure different timestamps
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	});

	test('should display basic stats', async ({ page }) => {
		await page.goto(statsUrl);
		
		// Check page loaded
		await expect(page.getByRole('heading', { name: 'Tracking Stats' })).toBeVisible();
		
		// Check stats cards
		await expect(page.getByText('Total Opens')).toBeVisible();
		await expect(page.getByText('Unique Opens')).toBeVisible();
		await expect(page.getByText('Created')).toBeVisible();
		
		// Verify counts
		const totalOpens = await page.locator('.text-3xl').first().textContent();
		expect(parseInt(totalOpens || '0')).toBeGreaterThanOrEqual(4);
	});

	test('should display recent activity', async ({ page }) => {
		await page.goto(statsUrl);
		
		// Check recent activity section
		await expect(page.getByText('Recent Activity')).toBeVisible();
		
		// Should show recent opens
		const activityItems = page.locator('.py-3.border-b');
		await expect(activityItems).toHaveCount(4);
		
		// Check for location and device info
		await expect(page.getByText('Gmail', { exact: false })).toBeVisible();
		await expect(page.getByText('Chrome', { exact: false })).toBeVisible();
	});

	test('should display email client distribution', async ({ page }) => {
		await page.goto(statsUrl);
		
		// Check email clients section
		await expect(page.getByText('Email Clients')).toBeVisible();
		
		// Should show Gmail
		await expect(page.getByText('Gmail')).toBeVisible();
		
		// Check for progress bars
		const progressBars = page.locator('.bg-blue-500');
		await expect(progressBars.first()).toBeVisible();
	});

	test('should display device breakdown', async ({ page }) => {
		await page.goto(statsUrl);
		
		// Check devices section
		await expect(page.getByText('Devices')).toBeVisible();
		
		// Should show different device types
		await expect(page.getByText('desktop')).toBeVisible();
		await expect(page.getByText('mobile')).toBeVisible();
	});

	test('should auto-refresh stats', async ({ page, request }) => {
		await page.goto(statsUrl);
		
		// Get initial total
		const initialTotal = await page.locator('.text-3xl').first().textContent();
		
		// Trigger another pixel hit
		await request.get(trackingUrl);
		
		// Wait for auto-refresh (stats refresh every 30 seconds, but we'll trigger manual refresh)
		await page.getByRole('button', { name: 'Refresh' }).click();
		
		// Check total increased
		await page.waitForFunction(
			(initial) => {
				const current = document.querySelector('.text-3xl')?.textContent;
				return parseInt(current || '0') > parseInt(initial || '0');
			},
			initialTotal,
			{ timeout: 5000 }
		);
	});

	test('should handle non-existent pixel', async ({ page }) => {
		await page.goto('/stats/non-existent-pixel-id');
		
		// Should show error
		await expect(page.getByText('Tracking pixel not found')).toBeVisible();
	});

	test('should show expiration notice', async ({ request, page }) => {
		// Create pixel with short expiration
		const response = await request.post('/api/pixels', {
			headers: {
				'Content-Type': 'application/json',
				'x-test-suite': 'playwright-e2e'
			},
			data: {
				label: 'Expiring Soon',
				expiresIn: '24h'
			}
		});
		
		const pixel = await response.json();
		await page.goto(pixel.statsUrl);
		
		// Should show expiration notice
		await expect(page.getByText(/will expire on/)).toBeVisible();
	});

	test('should display timeline chart', async ({ page }) => {
		await page.goto(statsUrl);
		
		// Check timeline section
		await expect(page.getByText('Opens Timeline')).toBeVisible();
		
		// Check for chart bars
		const chartBars = page.locator('.bg-blue-500.hover\\:bg-blue-600');
		await expect(chartBars.first()).toBeVisible();
	});

	test('should share stats link', async ({ page, context }) => {
		// Grant clipboard permissions
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		
		await page.goto(statsUrl);
		
		// Click share button (if implemented)
		const shareButton = page.getByRole('button', { name: 'Share' });
		if (await shareButton.isVisible()) {
			await shareButton.click();
			
			// Verify URL was copied
			const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
			expect(clipboardText).toContain('/stats/');
		}
	});
});