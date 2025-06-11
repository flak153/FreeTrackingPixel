import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pixels, pixelEvents } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';
import { parseUserAgent, getLocationFromIP } from '$lib/server/tracking';

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export const GET: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { id } = params;
	
	try {
		// Check if pixel exists and is not expired
		const [pixel] = await db.select().from(pixels).where(eq(pixels.id, id)).limit(1);
		
		if (!pixel) {
			return new Response(TRANSPARENT_GIF, {
				headers: {
					'Content-Type': 'image/gif',
					'Cache-Control': 'no-store, no-cache, must-revalidate, private'
				}
			});
		}
		
		// Check if pixel is expired
		if (pixel.expiresAt && new Date() > pixel.expiresAt) {
			return new Response(TRANSPARENT_GIF, {
				headers: {
					'Content-Type': 'image/gif',
					'Cache-Control': 'no-store, no-cache, must-revalidate, private'
				}
			});
		}
		
		// Extract tracking information
		const userAgent = request.headers.get('user-agent') || null;
		const referer = request.headers.get('referer') || null;
		const clientIp = getClientAddress();
		
		// Hash IP for privacy
		const ipHash = clientIp ? createHash('sha256').update(clientIp).digest('hex') : null;
		
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
					eq(pixelEvents.ipHash, ipHash),
					// Check if opened in last 24 hours
				)
			)
			.limit(1);
		
		const isUnique = existingEvent.length === 0;
		
		// Record the event with enhanced tracking data
		await db.insert(pixelEvents).values({
			pixelId: id,
			userAgent,
			ipHash,
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
		
		// Return the transparent GIF
		return new Response(TRANSPARENT_GIF, {
			headers: {
				'Content-Type': 'image/gif',
				'Cache-Control': 'no-store, no-cache, must-revalidate, private',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('Error tracking pixel:', error);
		// Still return the GIF even if tracking fails
		return new Response(TRANSPARENT_GIF, {
			headers: {
				'Content-Type': 'image/gif',
				'Cache-Control': 'no-store, no-cache, must-revalidate, private'
			}
		});
	}
};