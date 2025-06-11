import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rateLimit';

describe('checkRateLimit', () => {
	beforeEach(() => {
		// Clear the rate limit store before each test
		vi.clearAllTimers();
		vi.useFakeTimers();
	});

	it('should allow requests within rate limit', () => {
		const ip = '192.168.1.1';
		
		// First 5 requests should pass
		for (let i = 0; i < 5; i++) {
			expect(checkRateLimit(ip, 5, 60000)).toBe(true);
		}
	});

	it('should block requests exceeding rate limit', () => {
		const ip = '192.168.1.2';
		
		// First 3 requests pass
		for (let i = 0; i < 3; i++) {
			expect(checkRateLimit(ip, 3, 60000)).toBe(true);
		}
		
		// 4th request should be blocked
		expect(checkRateLimit(ip, 3, 60000)).toBe(false);
	});

	it('should reset limit after time window', () => {
		const ip = '192.168.1.3';
		
		// Use up the limit
		for (let i = 0; i < 2; i++) {
			expect(checkRateLimit(ip, 2, 1000)).toBe(true);
		}
		expect(checkRateLimit(ip, 2, 1000)).toBe(false);
		
		// Advance time past the window
		vi.advanceTimersByTime(1001);
		
		// Should be allowed again
		expect(checkRateLimit(ip, 2, 1000)).toBe(true);
	});

	it('should track different IPs separately', () => {
		const ip1 = '192.168.1.4';
		const ip2 = '192.168.1.5';
		
		// Use up limit for ip1
		expect(checkRateLimit(ip1, 1, 60000)).toBe(true);
		expect(checkRateLimit(ip1, 1, 60000)).toBe(false);
		
		// ip2 should still be allowed
		expect(checkRateLimit(ip2, 1, 60000)).toBe(true);
	});

	it('should use default values when not provided', () => {
		const ip = '192.168.1.6';
		
		// Default is 10 requests per minute
		for (let i = 0; i < 10; i++) {
			expect(checkRateLimit(ip)).toBe(true);
		}
		expect(checkRateLimit(ip)).toBe(false);
	});
});