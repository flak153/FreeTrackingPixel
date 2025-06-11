import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

export interface TrackingData {
	browser: string | null;
	os: string | null;
	deviceType: 'mobile' | 'tablet' | 'desktop' | null;
	emailClient: string | null;
}

export function parseUserAgent(userAgent: string | null): TrackingData {
	if (!userAgent) {
		return {
			browser: null,
			os: null,
			deviceType: null,
			emailClient: null
		};
	}
	
	const parser = new UAParser(userAgent);
	const result = parser.getResult();
	
	// Get basic info
	const browser = result.browser.name || null;
	const os = result.os.name || null;
	
	// Determine device type
	let deviceType: 'mobile' | 'tablet' | 'desktop' | null = null;
	if (result.device.type === 'mobile') {
		deviceType = 'mobile';
	} else if (result.device.type === 'tablet') {
		deviceType = 'tablet';
	} else {
		deviceType = 'desktop';
	}
	
	// Detect email client
	const emailClient = detectEmailClient(userAgent);
	
	return {
		browser,
		os,
		deviceType,
		emailClient
	};
}

function detectEmailClient(userAgent: string): string | null {
	const ua = userAgent.toLowerCase();
	
	// Gmail
	if (ua.includes('googleimageproxy')) {
		return 'Gmail';
	}
	
	// Outlook variants
	if (ua.includes('microsoft outlook') || ua.includes('msoffice')) {
		return 'Microsoft Outlook';
	}
	if (ua.includes('outlook-express')) {
		return 'Outlook Express';
	}
	if (ua.includes('outlook.com')) {
		return 'Outlook.com';
	}
	
	// Apple Mail
	if (ua.includes('applemail')) {
		return 'Apple Mail';
	}
	
	// Yahoo Mail
	if (ua.includes('yahoomail')) {
		return 'Yahoo Mail';
	}
	
	// Thunderbird
	if (ua.includes('thunderbird')) {
		return 'Mozilla Thunderbird';
	}
	
	// iOS Mail
	if (ua.includes('iphone') || ua.includes('ipad')) {
		if (ua.includes('mail/')) {
			return 'iOS Mail';
		}
	}
	
	// Android Mail
	if (ua.includes('android')) {
		if (ua.includes('mail')) {
			return 'Android Mail';
		}
	}
	
	// Samsung Mail
	if (ua.includes('samsungemail')) {
		return 'Samsung Mail';
	}
	
	// Other patterns
	if (ua.includes('mail/') || ua.includes('email/')) {
		return 'Email Client';
	}
	
	return null;
}

// IP geolocation using geoip-lite library
export async function getLocationFromIP(ip: string): Promise<{
	countryCode: string | null;
	city: string | null;
	region: string | null;
}> {
	// For testing and local development, return mock data
	if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
		return {
			countryCode: 'US',
			city: 'Local',
			region: 'Development'
		};
	}
	
	// Use geoip-lite for geolocation
	const geo = geoip.lookup(ip);
	
	if (!geo) {
		return {
			countryCode: null,
			city: null,
			region: null
		};
	}
	
	return {
		countryCode: geo.country || null,
		city: geo.city || null,
		region: geo.region || null
	};
}