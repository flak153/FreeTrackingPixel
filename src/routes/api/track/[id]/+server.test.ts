import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock dependencies
vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockResolvedValue([])
	}
}));

vi.mock('$lib/server/tracking', () => ({
	parseUserAgent: vi.fn().mockReturnValue({
		browser: 'Chrome',
		os: 'Windows',
		deviceType: 'desktop',
		emailClient: null
	}),
	getLocationFromIP: vi.fn().mockResolvedValue({
		countryCode: 'US',
		city: 'New York',
		region: 'NY'
	})
}));

describe('GET /api/track/[id]', () => {
	const mockPixelId = 'test-pixel-123';
	
	const createMockRequest = (headers: Record<string, string> = {}) => ({
		params: { id: mockPixelId },
		request: {
			headers: new Headers({
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
				...headers
			})
		},
		getClientAddress: vi.fn().mockReturnValue('192.168.1.100')
	} as unknown as RequestEvent);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return transparent GIF for valid pixel', async () => {
		const { db } = await import('$lib/server/db');
		
		// Mock pixel exists
		(db.select as any).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([{
				id: mockPixelId,
				expiresAt: null
			}])
		});

		const mockRequest = createMockRequest();
		const response = await GET(mockRequest);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/gif');
		expect(response.headers.get('Cache-Control')).toContain('no-store');
	});

	it('should return GIF even for non-existent pixel', async () => {
		const { db } = await import('$lib/server/db');
		
		// Mock pixel doesn't exist
		(db.select as any).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([])
		});

		const mockRequest = createMockRequest();
		const response = await GET(mockRequest);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/gif');
	});

	it('should not track expired pixels', async () => {
		const { db } = await import('$lib/server/db');
		
		// Mock expired pixel
		(db.select as any).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([{
				id: mockPixelId,
				expiresAt: new Date('2020-01-01')
			}])
		});

		const mockRequest = createMockRequest();
		const response = await GET(mockRequest);

		// Should return GIF but not track
		expect(response.status).toBe(200);
		expect(db.insert).not.toHaveBeenCalled();
	});

	it('should track unique opens correctly', async () => {
		const { db } = await import('$lib/server/db');
		
		// Mock pixel exists
		(db.select as any).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([{ id: mockPixelId, expiresAt: null }])
		});

		// Mock no existing events (unique open)
		(db.select as any).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([])
		});

		const mockRequest = createMockRequest({
			referer: 'https://gmail.com'
		});
		await GET(mockRequest);

		expect(db.insert).toHaveBeenCalled();
		const insertCall = (db.values as any).mock.calls[0][0];
		expect(insertCall.isUnique).toBe(true);
		expect(insertCall.browser).toBe('Chrome');
		expect(insertCall.countryCode).toBe('US');
	});

	it('should detect email clients from user agent', async () => {
		const { parseUserAgent } = await import('$lib/server/tracking');
		(parseUserAgent as any).mockReturnValueOnce({
			browser: 'Unknown',
			os: 'Unknown',
			deviceType: null,
			emailClient: 'Gmail'
		});

		const { db } = await import('$lib/server/db');
		(db.select as any).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([{ id: mockPixelId, expiresAt: null }])
		});

		const mockRequest = createMockRequest({
			'user-agent': 'GoogleImageProxy'
		});
		await GET(mockRequest);

		const insertCall = (db.values as any).mock.calls[0][0];
		expect(insertCall.emailClient).toBe('Gmail');
	});

	it('should handle errors gracefully', async () => {
		const { db } = await import('$lib/server/db');
		(db.select as any).mockImplementationOnce(() => {
			throw new Error('Database error');
		});

		const mockRequest = createMockRequest();
		const response = await GET(mockRequest);

		// Should still return GIF even on error
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/gif');
	});
});