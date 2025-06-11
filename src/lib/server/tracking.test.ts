import { describe, it, expect, vi } from 'vitest';
import { parseUserAgent, getLocationFromIP } from './tracking';

// Mock geoip-lite
vi.mock('geoip-lite', () => ({
	default: {
		lookup: vi.fn((ip: string) => {
			// Return different results based on IP for testing
			if (ip === '8.8.8.8') {
				return {
					country: 'US',
					city: 'Mountain View',
					region: 'CA'
				};
			}
			if (ip === '75.75.75.75') {
				return {
					country: 'GB',
					city: 'London',
					region: 'England'
				};
			}
			return null;
		})
	}
}));

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
		
		expect(result.browser).toBe('Mobile Safari');
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
	it('should return local data for localhost IPs', async () => {
		const result = await getLocationFromIP('127.0.0.1');
		
		expect(result.countryCode).toBe('US');
		expect(result.city).toBe('Local');
		expect(result.region).toBe('Development');
	});

	it('should return US data for Google DNS IP', async () => {
		const result = await getLocationFromIP('8.8.8.8');
		
		expect(result.countryCode).toBe('US');
		expect(result.city).toBe('Mountain View');
		expect(result.region).toBe('CA');
	});

	it('should return GB data for UK IP', async () => {
		const result = await getLocationFromIP('75.75.75.75');
		
		expect(result.countryCode).toBe('GB');
		expect(result.city).toBe('London');
		expect(result.region).toBe('England');
	});

	it('should handle private network IPs', async () => {
		const result = await getLocationFromIP('192.168.1.100');
		
		expect(result.countryCode).toBe('US');
		expect(result.city).toBe('Local');
		expect(result.region).toBe('Development');
	});

	it('should handle unknown IPs', async () => {
		const result = await getLocationFromIP('255.255.255.255');
		
		expect(result.countryCode).toBeNull();
		expect(result.city).toBeNull();
		expect(result.region).toBeNull();
	});
});