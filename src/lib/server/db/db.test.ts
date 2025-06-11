import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './index';
import { pixels, pixelEvents, pixelCreators } from './schema';
import { eq } from 'drizzle-orm';

// Skip these tests if no database URL is set
const skip = !process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL;

describe.skipIf(skip)('Database Operations', () => {
	let testPixelId: string;

	beforeAll(async () => {
		// Clean up any existing test data
		await db.delete(pixels).where(eq(pixels.label, 'Test Pixel'));
	});

	afterAll(async () => {
		// Clean up test data
		if (testPixelId) {
			await db.delete(pixels).where(eq(pixels.id, testPixelId));
		}
	});

	it('should create a pixel', async () => {
		const [pixel] = await db.insert(pixels).values({
			label: 'Test Pixel',
			expiresAt: null
		}).returning();

		expect(pixel).toBeDefined();
		expect(pixel.id).toBeTruthy();
		expect(pixel.label).toBe('Test Pixel');
		expect(pixel.statsPublic).toBe(true);
		
		testPixelId = pixel.id;
	});

	it('should track pixel events', async () => {
		const [event] = await db.insert(pixelEvents).values({
			pixelId: testPixelId,
			userAgent: 'Test User Agent',
			ipHash: 'test-hash',
			isUnique: true,
			browser: 'Chrome',
			os: 'Windows',
			deviceType: 'desktop'
		}).returning();

		expect(event).toBeDefined();
		expect(event.pixelId).toBe(testPixelId);
		expect(event.browser).toBe('Chrome');
	});

	it('should store pixel creator data', async () => {
		const [creator] = await db.insert(pixelCreators).values({
			pixelId: testPixelId,
			ipHash: 'creator-hash',
			fingerprint: 'test-fingerprint',
			browser: 'Firefox',
			os: 'macOS',
			screenWidth: 1920,
			screenHeight: 1080,
			timezone: 'America/New_York'
		}).returning();

		expect(creator).toBeDefined();
		expect(creator.fingerprint).toBe('test-fingerprint');
		expect(creator.screenWidth).toBe(1920);
	});

	it('should query pixel with events', async () => {
		const pixelWithEvents = await db.select()
			.from(pixels)
			.where(eq(pixels.id, testPixelId))
			.limit(1);

		expect(pixelWithEvents).toHaveLength(1);
		expect(pixelWithEvents[0].id).toBe(testPixelId);
	});

	it('should count events correctly', async () => {
		// Add another event
		await db.insert(pixelEvents).values({
			pixelId: testPixelId,
			userAgent: 'Another User Agent',
			ipHash: 'another-hash',
			isUnique: false
		});

		const events = await db.select()
			.from(pixelEvents)
			.where(eq(pixelEvents.pixelId, testPixelId));

		expect(events).toHaveLength(2);
		expect(events.filter(e => e.isUnique)).toHaveLength(1);
	});

	it('should handle pixel expiration', async () => {
		const expiredDate = new Date();
		expiredDate.setHours(expiredDate.getHours() - 1);

		const [expiredPixel] = await db.insert(pixels).values({
			label: 'Expired Pixel',
			expiresAt: expiredDate
		}).returning();

		expect(expiredPixel.expiresAt).toBeDefined();
		expect(new Date(expiredPixel.expiresAt!).getTime()).toBeLessThan(Date.now());

		// Clean up
		await db.delete(pixels).where(eq(pixels.id, expiredPixel.id));
	});

	it('should cascade delete events when pixel is deleted', async () => {
		const [tempPixel] = await db.insert(pixels).values({
			label: 'Temp Pixel'
		}).returning();

		await db.insert(pixelEvents).values({
			pixelId: tempPixel.id,
			userAgent: 'Test',
			ipHash: 'test'
		});

		// Delete pixel
		await db.delete(pixels).where(eq(pixels.id, tempPixel.id));

		// Events should be deleted too
		const events = await db.select()
			.from(pixelEvents)
			.where(eq(pixelEvents.pixelId, tempPixel.id));

		expect(events).toHaveLength(0);
	});
});