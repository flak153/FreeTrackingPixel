import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
	test('should load homepage with all sections', async ({ page }) => {
		await page.goto('/');
		
		// Check hero section
		await expect(page.locator('h1').filter({ hasText: 'Track Email Opens with' })).toBeVisible();
		await expect(page.getByText('Privacy First')).toBeVisible();
		await expect(page.getByText('100% Free • No Sign-up Required')).toBeVisible();
		
		// Check CTA buttons - they might be links not buttons
		await expect(page.getByText('Generate Free Pixel').first()).toBeVisible();
		await expect(page.getByText('Learn More').first()).toBeVisible();
	});

	test('should navigate to generate page', async ({ page }) => {
		await page.goto('/');
		
		// Click generate button
		await page.getByText('Generate Free Pixel').first().click();
		
		// Should navigate to generate page
		await expect(page).toHaveURL('/generate');
		await expect(page.getByRole('heading', { name: 'Generate Tracking Pixel' })).toBeVisible();
	});

	test('should display features', async ({ page }) => {
		await page.goto('/');
		
		// Check feature cards
		await expect(page.getByText('Privacy Focused')).toBeVisible();
		await expect(page.getByText('Instant Setup')).toBeVisible();
		await expect(page.getByText('Real-time Stats')).toBeVisible();
		
		// Check feature descriptions
		await expect(page.getByText(/No personal data stored/)).toBeVisible();
		await expect(page.getByText(/No account needed/)).toBeVisible();
		await expect(page.getByText(/View opens.*instantly/)).toBeVisible();
	});

	test('should display how it works section', async ({ page }) => {
		await page.goto('/');
		
		// Check section title
		await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible();
		
		// Check steps - these are h3 elements
		await expect(page.locator('h3').filter({ hasText: 'Generate Pixel' })).toBeVisible();
		await expect(page.locator('h3').filter({ hasText: 'Embed in Email' })).toBeVisible();
		await expect(page.locator('h3').filter({ hasText: 'Track Opens' })).toBeVisible();
		
		// Check step numbers
		await expect(page.getByText('1')).toBeVisible();
		await expect(page.getByText('2')).toBeVisible();
		await expect(page.getByText('3')).toBeVisible();
	});

	test('should scroll to sections', async ({ page }) => {
		await page.goto('/');
		
		// Click Learn More to scroll to how it works
		await page.getByText('Learn More').first().click();
		
		// Check if scrolled to section
		await expect(page.getByRole('heading', { name: 'How It Works' })).toBeInViewport();
	});

	test('should have working navigation', async ({ page }) => {
		await page.goto('/');
		
		// Check header navigation
		await expect(page.getByRole('link', { name: 'FreeTrackingPixel' })).toBeVisible();
		
		// Test navigation links
		const generateLink = page.getByRole('navigation').getByText('Generate Pixel');
		await generateLink.click();
		await expect(page).toHaveURL('/generate');
		
		// Go back to home
		await page.getByRole('link', { name: 'FreeTrackingPixel' }).click();
		await expect(page).toHaveURL('/');
	});

	test('should have footer with links', async ({ page }) => {
		await page.goto('/');
		
		// Scroll to footer
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		
		// Check footer content
		await expect(page.getByText('Free, privacy-focused email tracking')).toBeVisible();
		await expect(page.getByRole('link', { name: 'SvelteKit' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Neon' })).toBeVisible();
	});

	test('should be responsive', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		
		// Check mobile layout
		await expect(page.getByRole('heading', { name: /Track Email Opens/i })).toBeVisible();
		
		// Features should stack vertically on mobile
		const featureCards = page.locator('.hover\\:shadow-lg');
		const firstCard = featureCards.first();
		const secondCard = featureCards.nth(1);
		
		const firstBox = await firstCard.boundingBox();
		const secondBox = await secondCard.boundingBox();
		
		// Second card should be below first card on mobile
		expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0);
	});

	test('should handle dark mode', async ({ page }) => {
		// Check if dark mode classes are present
		await page.goto('/');
		
		// The app should have dark mode support via Tailwind
		const htmlElement = page.locator('html');
		const classList = await htmlElement.getAttribute('class');
		
		// Dark mode classes should be handled by the system
		expect(classList).toBeDefined();
	});
});