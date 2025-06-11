import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pixels, pixelEvents } from '$lib/server/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	
	try {
		// Get pixel information
		const [pixel] = await db.select().from(pixels).where(eq(pixels.id, id)).limit(1);
		
		if (!pixel) {
			return json({ error: 'Pixel not found' }, { status: 404 });
		}
		
		// Check if stats are public
		if (!pixel.statsPublic) {
			return json({ error: 'Stats are private' }, { status: 403 });
		}
		
		// Get total opens
		const [totalResult] = await db.select({
			count: sql<number>`count(*)`
		}).from(pixelEvents).where(eq(pixelEvents.pixelId, id));
		
		// Get unique opens
		const [uniqueResult] = await db.select({
			count: sql<number>`count(*)`
		}).from(pixelEvents).where(
			and(
				eq(pixelEvents.pixelId, id),
				eq(pixelEvents.isUnique, true)
			)
		);
		
		// Get timeline data (hourly for last 24 hours)
		const timeline = await db.select({
			hour: sql<string>`date_trunc('hour', opened_at)`,
			count: sql<number>`count(*)`
		})
		.from(pixelEvents)
		.where(eq(pixelEvents.pixelId, id))
		.groupBy(sql`date_trunc('hour', opened_at)`)
		.orderBy(sql`date_trunc('hour', opened_at)`);
		
		// Get recent events with details (last 10)
		const recentEvents = await db.select({
			openedAt: pixelEvents.openedAt,
			isUnique: pixelEvents.isUnique,
			emailClient: pixelEvents.emailClient,
			browser: pixelEvents.browser,
			deviceType: pixelEvents.deviceType,
			city: pixelEvents.city,
			region: pixelEvents.region,
			countryCode: pixelEvents.countryCode
		})
		.from(pixelEvents)
		.where(eq(pixelEvents.pixelId, id))
		.orderBy(desc(pixelEvents.openedAt))
		.limit(10);
		
		// Get email client distribution
		const emailClients = await db.select({
			name: pixelEvents.emailClient,
			count: sql<number>`count(*)`
		})
		.from(pixelEvents)
		.where(eq(pixelEvents.pixelId, id))
		.groupBy(pixelEvents.emailClient)
		.orderBy(desc(sql`count(*)`));
		
		// Get device type distribution
		const devices = await db.select({
			type: pixelEvents.deviceType,
			count: sql<number>`count(*)`
		})
		.from(pixelEvents)
		.where(eq(pixelEvents.pixelId, id))
		.groupBy(pixelEvents.deviceType)
		.orderBy(desc(sql`count(*)`));
		
		// Get location distribution (top 10 countries)
		const locations = await db.select({
			country: pixelEvents.countryCode,
			count: sql<number>`count(*)`
		})
		.from(pixelEvents)
		.where(
			and(
				eq(pixelEvents.pixelId, id),
				sql`${pixelEvents.countryCode} IS NOT NULL`
			)
		)
		.groupBy(pixelEvents.countryCode)
		.orderBy(desc(sql`count(*)`))
		.limit(10);
		
		return json({
			pixel: {
				id: pixel.id,
				label: pixel.label,
				createdAt: pixel.createdAt,
				expiresAt: pixel.expiresAt
			},
			stats: {
				total: Number(totalResult.count),
				unique: Number(uniqueResult.count),
				timeline: timeline.map(t => ({
					time: t.hour,
					count: Number(t.count)
				})),
				recentEvents: recentEvents.map(e => ({
					time: e.openedAt,
					isUnique: e.isUnique,
					emailClient: e.emailClient,
					browser: e.browser,
					device: e.deviceType,
					location: [e.city, e.region, e.countryCode].filter(Boolean).join(', ') || null
				})),
				emailClients: emailClients.map(c => ({
					name: c.name,
					count: Number(c.count)
				})),
				devices: devices.map(d => ({
					type: d.type,
					count: Number(d.count)
				})),
				locations: locations.map(l => ({
					country: l.country,
					count: Number(l.count)
				}))
			}
		});
	} catch (error) {
		console.error('Error fetching stats:', error);
		return json({ error: 'Failed to fetch stats' }, { status: 500 });
	}
};