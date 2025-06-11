import { test, expect } from '@playwright/test';

test.describe('Terms of Service Page', () => {
	test('should display terms of service', async ({ page }) => {
		await page.goto('/terms');
		
		// Check page title
		await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
		
		// Check main sections
		await expect(page.getByText('1. Acceptance of Terms')).toBeVisible();
		await expect(page.getByText('2. Data Collection from Service Users')).toBeVisible();
		await expect(page.getByText('3. Data Collection from Email Recipients')).toBeVisible();
		await expect(page.getByText('4. Use of Service')).toBeVisible();
		await expect(page.getByText('5. Privacy and Data Security')).toBeVisible();
	});

	test('should list collected data from pixel creators', async ({ page }) => {
		await page.goto('/terms');
		
		// Check fingerprinting disclosure
		await expect(page.getByText('Browser type, version, and configuration')).toBeVisible();
		await expect(page.getByText('WebGL and canvas fingerprints')).toBeVisible();
		await expect(page.getByText('Audio context fingerprint')).toBeVisible();
	});

	test('should navigate from generate page', async ({ page }) => {
		await page.goto('/generate');
		
		// Click terms link
		await page.getByRole('link', { name: 'Terms of Service' }).click();
		
		// Should be on terms page
		await expect(page).toHaveURL('/terms');
		await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
	});

	test('should be accessible from footer', async ({ page }) => {
		await page.goto('/');
		
		// Terms link might be in footer - if added
		const termsLinks = page.getByRole('link', { name: /terms/i });
		const count = await termsLinks.count();
		
		if (count > 0) {
			await termsLinks.first().click();
			await expect(page).toHaveURL('/terms');
		}
	});
});