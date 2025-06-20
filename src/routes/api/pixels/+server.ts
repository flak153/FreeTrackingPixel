import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pixels, pixelCreators } from '$lib/server/db/schema';
import { checkRateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	console.log('POST /api/pixels - Request received');
	try {
		// Check if request is coming from our UI (not direct API call)
		const origin = request.headers.get('origin');
		const referer = request.headers.get('referer');
		const testHeader = request.headers.get('x-test-suite');
		
		// Allow test suite access
		const isTest = testHeader === 'playwright-e2e';
		
		if (!isTest && import.meta.env.PROD) {
			// In production, ensure requests come from our domain
			const allowedOrigin = url.origin;
			if (origin !== allowedOrigin && !referer?.startsWith(allowedOrigin)) {
				return json({ error: 'Direct API access is not available yet. Please use our web interface.' }, { status: 403 });
			}
		}
		
		// Get client IP - Netlify provides it in x-nf-client-connection-ip header
		const clientIp = request.headers.get('x-nf-client-connection-ip') || 
						request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
						getClientAddress();
		
		// Rate limiting (skip for tests)
		if (!isTest) {
			if (!checkRateLimit(clientIp, 10, 60000)) { // 10 pixels per minute
				return json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
			}
		}
		
		const { label, expiresIn, fingerprint, browserData } = await request.json();
		
		// Validate expiration option
		const validExpirations = ['24h', '7d', '30d'];
		if (!validExpirations.includes(expiresIn)) {
			return json({ error: 'Invalid expiration option. Must be 24h, 7d, or 30d.' }, { status: 400 });
		}
		
		// Calculate expiration date (always set, no more "never" option)
		const now = new Date();
		let expiresAt: Date;
		switch (expiresIn) {
			case '24h':
				expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
				break;
			case '7d':
				expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
				break;
			case '30d':
			default:
				expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
				break;
		}
		
		// Create pixel in database
		const [pixel] = await db.insert(pixels).values({
			label: label || null,
			expiresAt
		}).returning();
		
		// Store creator fingerprint data if available
		if (fingerprint && browserData) {
			try {
				console.log(`[PIXEL CREATE] Storing creator IP: ${clientIp} for pixel: ${pixel.id}`);
				
				// Extract WebGL info if available
				const webglInfo = fingerprint.components?.webgl || {};
				const webglVendor = webglInfo.value?.vendor || null;
				const webglRenderer = webglInfo.value?.renderer || null;
				
				// Extract other component hashes
				const canvasHash = fingerprint.components?.canvas?.value || null;
				const audioHash = fingerprint.components?.audio?.value || null;
				const fontsHash = fingerprint.components?.fonts?.value || null;
				
				// Parse user agent for browser info
				const userAgent = request.headers.get('user-agent') || '';
				const browserInfo = parseBrowserInfo(userAgent);
				
				await db.insert(pixelCreators).values({
					pixelId: pixel.id,
					clientIp,
					fingerprint: fingerprint.visitorId,
					// Browser and device info
					browser: browserInfo.browser,
					browserVersion: browserInfo.browserVersion,
					os: browserInfo.os,
					osVersion: browserInfo.osVersion,
					device: browserInfo.device,
					deviceType: browserInfo.deviceType,
					// Screen and display
					screenWidth: browserData.screenWidth,
					screenHeight: browserData.screenHeight,
					screenDepth: browserData.screenDepth,
					viewportWidth: browserData.viewportWidth,
					viewportHeight: browserData.viewportHeight,
					// Location and timezone
					timezone: browserData.timezone,
					timezoneOffset: browserData.timezoneOffset,
					language: browserData.language,
					languages: JSON.stringify(browserData.languages),
					// Technical details
					platform: browserData.platform,
					vendor: browserData.vendor,
					hardwareConcurrency: browserData.hardwareConcurrency,
					deviceMemory: browserData.deviceMemory,
					maxTouchPoints: browserData.maxTouchPoints,
					// Feature detection
					cookiesEnabled: browserData.cookiesEnabled,
					doNotTrack: browserData.doNotTrack,
					webglVendor,
					webglRenderer,
					// Hashes
					canvasHash,
					audioHash,
					fontsHash,
					// Full data for analysis
					fullFingerprint: JSON.stringify(fingerprint)
				});
			} catch (error) {
				// Log error but don't fail pixel creation
				console.error('Failed to store creator fingerprint:', error);
			}
		}
		
		// Generate URLs
		const baseUrl = url.origin;
		const trackingUrl = `${baseUrl}/api/track/${pixel.id}`;
		const statsUrl = `${baseUrl}/stats/${pixel.id}`;
		
		return json({
			id: pixel.id,
			trackingUrl,
			statsUrl
		});
	} catch (error) {
		console.error('Error creating pixel:', error);
		return json({ error: 'Failed to create pixel' }, { status: 500 });
	}
};

function parseBrowserInfo(userAgent: string) {
	const ua = userAgent.toLowerCase();
	
	// Browser detection
	let browser = 'Unknown';
	let browserVersion = '';
	
	if (ua.includes('firefox/')) {
		browser = 'Firefox';
		browserVersion = ua.match(/firefox\/(\d+\.\d+)/)?.[1] || '';
	} else if (ua.includes('chrome/') && !ua.includes('edg/')) {
		browser = 'Chrome';
		browserVersion = ua.match(/chrome\/(\d+\.\d+)/)?.[1] || '';
	} else if (ua.includes('safari/') && !ua.includes('chrome')) {
		browser = 'Safari';
		browserVersion = ua.match(/version\/(\d+\.\d+)/)?.[1] || '';
	} else if (ua.includes('edg/')) {
		browser = 'Edge';
		browserVersion = ua.match(/edg\/(\d+\.\d+)/)?.[1] || '';
	}
	
	// OS detection
	let os = 'Unknown';
	let osVersion = '';
	
	if (ua.includes('windows nt')) {
		os = 'Windows';
		const version = ua.match(/windows nt (\d+\.\d+)/)?.[1];
		osVersion = version || '';
	} else if (ua.includes('mac os x')) {
		os = 'macOS';
		osVersion = ua.match(/mac os x (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
	} else if (ua.includes('android')) {
		os = 'Android';
		osVersion = ua.match(/android (\d+\.\d+)/)?.[1] || '';
	} else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
		os = 'iOS';
		osVersion = ua.match(/os (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
	} else if (ua.includes('linux')) {
		os = 'Linux';
	}
	
	// Device type
	let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
	let device = 'Unknown';
	
	if (/mobile|android|iphone/i.test(ua)) {
		deviceType = 'mobile';
		if (ua.includes('iphone')) device = 'iPhone';
		else if (ua.includes('android')) device = 'Android Phone';
	} else if (/ipad|tablet/i.test(ua)) {
		deviceType = 'tablet';
		if (ua.includes('ipad')) device = 'iPad';
		else device = 'Android Tablet';
	} else {
		device = 'Desktop';
	}
	
	return { browser, browserVersion, os, osVersion, device, deviceType };
}
