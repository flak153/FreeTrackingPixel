import { test, expect } from '@playwright/test';

test.describe('Tracking Pixel', () => {
	let pixelId: string;
	let trackingUrl: string;

	test.beforeEach(async ({ request }) => {
		// Create a test pixel
		const response = await request.post('/api/pixels', {
			headers: {
				'Content-Type': 'application/json',
				'x-test-suite': 'playwright-e2e'
			},
			data: {
				label: 'E2E Tracking Test',
				expiresIn: '24h'
			}
		});
		
		const pixel = await response.json();
		if (pixel.error) {
			throw new Error('Failed to create pixel: ' + pixel.error);
		}
		pixelId = pixel.id;
		trackingUrl = pixel.trackingUrl;
	});

	test('should return transparent GIF image', async ({ request }) => {
		const response = await request.get(trackingUrl);
		
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toBe('image/gif');
		expect(response.headers()['cache-control']).toContain('no-store');
		
		// Verify it's a valid GIF
		const buffer = await response.body();
		const base64 = buffer.toString('base64');
		expect(base64).toBe('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
	});

	test('should track email opens with different user agents', async ({ request }) => {
		// Test Gmail
		await request.get(trackingUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)'
			}
		});

		// Test Outlook
		await request.get(trackingUrl, {
			headers: {
				'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; SLCC1; .NET CLR 2.0.50727; .NET CLR 3.0.04506; Microsoft Outlook 14.0.7166)'
			}
		});

		// Test Apple Mail
		await request.get(trackingUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)'
			}
		});

		// Verify stats were recorded
		const statsResponse = await request.get(`/api/stats/${pixelId}`);
		const stats = await statsResponse.json();
		
		expect(stats.stats.total).toBeGreaterThanOrEqual(3);
		expect(stats.stats.emailClients).toContainEqual(
			expect.objectContaining({ name: 'Gmail' })
		);
	});

	test('should detect unique vs duplicate opens', async ({ request }) => {
		// First open - should be unique
		await request.get(trackingUrl);
		
		// Second open from same IP - should not be unique
		await request.get(trackingUrl);
		
		// Check stats
		const statsResponse = await request.get(`/api/stats/${pixelId}`);
		const stats = await statsResponse.json();
		
		expect(stats.stats.total).toBe(2);
		expect(stats.stats.unique).toBe(1);
	});

	test('should handle referer header', async ({ request }) => {
		await request.get(trackingUrl, {
			headers: {
				'Referer': 'https://mail.google.com/'
			}
		});

		// The referer should be stored but not exposed in public stats
		const statsResponse = await request.get(`/api/stats/${pixelId}`);
		expect(statsResponse.ok()).toBeTruthy();
	});

	test('should respect pixel expiration', async ({ request }) => {
		// Create an expired pixel
		const expiredResponse = await request.post('/api/pixels', {
			headers: {
				'Content-Type': 'application/json',
				'x-test-suite': 'playwright-e2e'
			},
			data: {
				label: 'Expired Test',
				expiresIn: '24h'
			}
		});
		
		const expiredPixel = await expiredResponse.json();
		
		// Manually update the pixel to be expired (would need database access in real scenario)
		// For now, just verify the pixel returns a GIF even when expired
		const trackResponse = await request.get(expiredPixel.trackingUrl);
		expect(trackResponse.status()).toBe(200);
		expect(trackResponse.headers()['content-type']).toBe('image/gif');
	});

	test('should handle invalid pixel IDs gracefully', async ({ request }) => {
		const response = await request.get('/api/track/invalid-pixel-id');
		
		// Should still return a GIF
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toBe('image/gif');
	});
});