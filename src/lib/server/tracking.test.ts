import { describe, it, expect, vi } from 'vitest';
import { parseUserAgent, getLocationFromIP } from './tracking';

describe('parseUserAgent', () => {
	it('should detect Chrome browser', () => {
		const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
		const result = parseUserAgent(ua);
		
		expect(result.browser).toBe('Chrome');
		expect(result.os).toBe('Windows');
		expect(result.deviceType).toBe('desktop');
	});

	it('should detect Safari on iOS', () => {
		const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
		const result = parseUserAgent(ua);
		
		expect(result.browser).toBe('Safari');
		expect(result.os).toBe('iOS');
		expect(result.deviceType).toBe('mobile');
	});

	it('should detect email clients', () => {
		const gmailUA = 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)';
		const result = parseUserAgent(gmailUA);
		
		expect(result.emailClient).toBe('Gmail');
	});

	it('should handle null user agent', () => {
		const result = parseUserAgent(null);
		
		expect(result.browser).toBeNull();
		expect(result.os).toBeNull();
		expect(result.deviceType).toBeNull();
		expect(result.emailClient).toBeNull();
	});
});

describe('getLocationFromIP', () => {
	it('should fetch location data from IP', async () => {
		// Mock fetch
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				country_code: 'US',
				city: 'New York',
				region: 'New York'
			})
		} as Response);

		const result = await getLocationFromIP('8.8.8.8');
		
		expect(result.countryCode).toBe('US');
		expect(result.city).toBe('New York');
		expect(result.region).toBe('New York');
		expect(fetch).toHaveBeenCalledWith('https://ipapi.co/8.8.8.8/json/');
	});

	it('should handle API errors gracefully', async () => {
		global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

		const result = await getLocationFromIP('8.8.8.8');
		
		expect(result.countryCode).toBeNull();
		expect(result.city).toBeNull();
		expect(result.region).toBeNull();
	});

	it('should handle non-OK responses', async () => {
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 429
		} as Response);

		const result = await getLocationFromIP('8.8.8.8');
		
		expect(result.countryCode).toBeNull();
		expect(result.city).toBeNull();
		expect(result.region).toBeNull();
	});
});