import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pixels, pixelEvents, pixelCreators } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { parseUserAgent, getLocationFromIP } from '$lib/server/tracking';

// 5x5 blue square - looks like a small bullet point or icon
const TRACKING_IMAGE = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
	'base64'
);

export const GET: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { id } = params;
	console.log(`[TRACKING] Pixel accessed: ${id}`);
	
	try {
		// Validate UUID format
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			// Return GIF for invalid UUIDs
			return new Response(TRACKING_IMAGE, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'no-store, no-cache, must-revalidate, private'
				}
			});
		}
		
		// Check if pixel exists and is not expired
		const [pixel] = await db.select().from(pixels).where(eq(pixels.id, id)).limit(1);
		
		if (!pixel) {
			return new Response(TRACKING_IMAGE, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'no-store, no-cache, must-revalidate, private'
				}
			});
		}
		
		// Check if pixel is expired
		if (pixel.expiresAt && new Date() > pixel.expiresAt) {
			return new Response(TRACKING_IMAGE, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'no-store, no-cache, must-revalidate, private'
				}
			});
		}
		
		// Extract tracking information
		const userAgent = request.headers.get('user-agent') || null;
		const referer = request.headers.get('referer') || null;
		
		// Get client IP - Netlify provides it in x-nf-client-connection-ip header
		const clientIp = request.headers.get('x-nf-client-connection-ip') || 
						request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
						getClientAddress();
		
		console.log(`[TRACKING] Client IP: ${clientIp}`);
		console.log(`[TRACKING] User Agent: ${userAgent}`);
		console.log(`[TRACKING] Referer: ${referer}`);
		
		// Log all headers to debug Gmail access
		const headers: Record<string, string> = {};
		request.headers.forEach((value, key) => {
			headers[key] = value;
		});
		console.log(`[TRACKING] All headers:`, JSON.stringify(headers, null, 2));
		
		// Check if this is the pixel creator's machine
		const [creator] = await db.select()
			.from(pixelCreators)
			.where(
				and(
					eq(pixelCreators.pixelId, id),
					eq(pixelCreators.clientIp, clientIp)
				)
			)
			.limit(1);
		
		// If this is the creator, return the image without tracking
		if (creator) {
			console.log(`[TRACKING] Skipping - request from creator IP: ${clientIp}`);
			return new Response(TRACKING_IMAGE, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'no-store, no-cache, must-revalidate, private'
				}
			});
		}
		
		// Parse user agent for browser/device info
		const trackingData = parseUserAgent(userAgent);
		
		// Get location data from IP
		const location = clientIp ? await getLocationFromIP(clientIp) : {
			countryCode: null,
			city: null,
			region: null
		};
		
		// Check if this is a unique open (based on IP hash within last 24 hours)
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const existingEvent = await db.select()
			.from(pixelEvents)
			.where(
				and(
					eq(pixelEvents.pixelId, id),
					eq(pixelEvents.clientIp, clientIp),
					// Check if opened in last 24 hours
				)
			)
			.limit(1);
		
		const isUnique = existingEvent.length === 0;
		
		// Record the event with enhanced tracking data
		console.log(`[TRACKING] Recording event - isUnique: ${isUnique}`);
		await db.insert(pixelEvents).values({
			pixelId: id,
			userAgent,
			clientIp,
			referer,
			isUnique,
			browser: trackingData.browser,
			os: trackingData.os,
			deviceType: trackingData.deviceType,
			emailClient: trackingData.emailClient,
			countryCode: location.countryCode,
			city: location.city,
			region: location.region
		});
		console.log(`[TRACKING] Event recorded successfully`);
		
		// Return the transparent GIF
		return new Response(TRACKING_IMAGE, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store, no-cache, must-revalidate, private',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('Error tracking pixel:', error);
		// Still return the GIF even if tracking fails
		return new Response(TRACKING_IMAGE, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store, no-cache, must-revalidate, private'
			}
		});
	}
};