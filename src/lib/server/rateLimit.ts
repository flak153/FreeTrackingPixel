// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
	const now = Date.now();
	const userLimit = rateLimitStore.get(ip);
	
	if (!userLimit || now > userLimit.resetTime) {
		rateLimitStore.set(ip, {
			count: 1,
			resetTime: now + windowMs
		});
		return true;
	}
	
	if (userLimit.count >= limit) {
		return false;
	}
	
	userLimit.count++;
	return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [ip, limit] of rateLimitStore.entries()) {
		if (now > limit.resetTime) {
			rateLimitStore.delete(ip);
		}
	}
}, 5 * 60 * 1000);