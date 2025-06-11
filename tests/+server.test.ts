import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the database
vi.mock('$lib/server/db', () => ({
	db: {
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockResolvedValue([{
			id: 'test-pixel-id',
			label: 'Test Pixel',
			expiresAt: null
		}])
	}
}));

// Mock the schema
vi.mock('$lib/server/db/schema', () => ({
	pixels: {},
	pixelCreators: {}
}));

// Mock rate limiting
vi.mock('$lib/server/rateLimit', () => ({
	checkRateLimit: vi.fn().mockReturnValue(true)
}));

describe('POST /api/pixels', () => {
	const mockUrl = new URL('http://localhost:5173');
	
	const createMockRequest = (body: any) => ({
		request: {
			json: vi.fn().mockResolvedValue(body),
			headers: new Headers({
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
			})
		},
		url: mockUrl,
		getClientAddress: vi.fn().mockReturnValue('127.0.0.1')
	} as unknown as RequestEvent);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create a pixel without expiration', async () => {
		const mockRequest = createMockRequest({
			label: 'Test Campaign',
			expiresIn: 'never'
		});

		const response = await POST(mockRequest);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('id', 'test-pixel-id');
		expect(data).toHaveProperty('trackingUrl', 'http://localhost:5173/api/track/test-pixel-id');
		expect(data).toHaveProperty('statsUrl', 'http://localhost:5173/stats/test-pixel-id');
	});

	it('should create a pixel with 24h expiration', async () => {
		const mockRequest = createMockRequest({
			label: 'Short Campaign',
			expiresIn: '24h'
		});

		const response = await POST(mockRequest);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('id');
	});

	it('should handle rate limiting', async () => {
		const { checkRateLimit } = await import('$lib/server/rateLimit');
		(checkRateLimit as any).mockReturnValueOnce(false);

		const mockRequest = createMockRequest({
			label: 'Test',
			expiresIn: '30d'
		});

		const response = await POST(mockRequest);
		const data = await response.json();

		expect(response.status).toBe(429);
		expect(data.error).toContain('Rate limit exceeded');
	});

	it('should store fingerprint data when provided', async () => {
		const mockRequest = createMockRequest({
			label: 'Fingerprinted Pixel',
			expiresIn: '30d',
			fingerprint: {
				visitorId: 'test-visitor-id',
				components: {
					canvas: { value: 'canvas-hash' },
					webgl: { value: { vendor: 'NVIDIA', renderer: 'GeForce GTX' } }
				}
			},
			browserData: {
				screenWidth: 1920,
				screenHeight: 1080,
				timezone: 'America/New_York',
				language: 'en-US'
			}
		});

		const response = await POST(mockRequest);
		expect(response.status).toBe(200);
	});

	it('should handle database errors gracefully', async () => {
		const { db } = await import('$lib/server/db');
		(db.insert as any).mockImplementationOnce(() => {
			throw new Error('Database error');
		});

		const mockRequest = createMockRequest({
			label: 'Error Test',
			expiresIn: '7d'
		});

		const response = await POST(mockRequest);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe('Failed to create pixel');
	});
});