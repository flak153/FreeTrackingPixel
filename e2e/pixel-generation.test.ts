import { test, expect } from '@playwright/test';

test.describe('Pixel Generation Flow', () => {
	test('should generate a tracking pixel with label', async ({ page }) => {
		// Navigate to generate page
		await page.goto('/generate');
		
		// Check page loaded
		await expect(page.getByRole('heading', { name: 'Generate Tracking Pixel' })).toBeVisible();
		
		// Fill in the form
		await page.getByLabel('Label (Optional)').fill('E2E Test Campaign');
		
		// Select expiration
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: '7 days' }).click();
		
		// Check terms of service text is visible
		await expect(page.getByText(/By clicking "Generate Tracking Pixel"/)).toBeVisible();
		
		// Generate pixel
		await page.getByRole('button', { name: 'Generate Tracking Pixel' }).click();
		
		// Wait for success
		await expect(page.getByText('Your tracking pixel has been generated successfully!')).toBeVisible();
		
		// Check embed code is shown
		await expect(page.getByText('Embed Code')).toBeVisible();
		await expect(page.getByText(/img src=/)).toBeVisible();
		
		// Check buttons are present
		await expect(page.getByRole('button', { name: 'View Stats Dashboard' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Generate Another' })).toBeVisible();
	});

	test('should copy embed code to clipboard', async ({ page, context }) => {
		// Grant clipboard permissions
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		
		await page.goto('/generate');
		
		// Generate a pixel
		await page.getByRole('button', { name: 'Generate Tracking Pixel' }).click();
		await expect(page.getByText('Embed Code')).toBeVisible();
		
		// Click copy button
		const copyButton = page.getByRole('button', { name: 'Copy' }).first();
		await copyButton.click();
		
		// Verify clipboard content
		const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toContain('<img src=');
		expect(clipboardText).toContain('width="1" height="1"');
	});

	test('should navigate to stats page', async ({ page }) => {
		await page.goto('/generate');
		
		// Generate a pixel
		await page.getByRole('button', { name: 'Generate Tracking Pixel' }).click();
		await expect(page.getByText('Your tracking pixel has been generated successfully!')).toBeVisible();
		
		// Click stats button
		await page.getByRole('button', { name: 'View Stats Dashboard' }).click();
		
		// Should navigate to stats page
		await expect(page).toHaveURL(/\/stats\/.+/);
		await expect(page.getByRole('heading', { name: 'Tracking Stats' })).toBeVisible();
	});

	test('should handle rate limiting', async ({ page }) => {
		await page.goto('/generate');
		
		// Generate multiple pixels quickly
		for (let i = 0; i < 11; i++) {
			await page.getByRole('button', { name: 'Generate Tracking Pixel' }).click();
			
			// If we generated successfully, click "Generate Another"
			const generateAnother = page.getByRole('button', { name: 'Generate Another' });
			if (await generateAnother.isVisible({ timeout: 1000 })) {
				await generateAnother.click();
			}
		}
		
		// Should eventually show rate limit error
		await expect(page.getByText(/Rate limit exceeded/)).toBeVisible();
	});

	test('should validate fingerprint collection', async ({ page }) => {
		await page.goto('/generate');
		
		// Intercept the API call
		const requestPromise = page.waitForRequest(request => 
			request.url().includes('/api/pixels') && request.method() === 'POST'
		);
		
		// Generate pixel
		await page.getByRole('button', { name: 'Generate Tracking Pixel' }).click();
		
		// Check the request
		const request = await requestPromise;
		const postData = request.postDataJSON();
		
		// Verify fingerprint data is sent
		expect(postData).toHaveProperty('fingerprint');
		expect(postData).toHaveProperty('browserData');
		expect(postData.browserData).toHaveProperty('screenWidth');
		expect(postData.browserData).toHaveProperty('timezone');
		expect(postData.browserData).toHaveProperty('language');
	});
});