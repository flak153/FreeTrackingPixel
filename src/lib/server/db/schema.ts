import { pgTable, uuid, varchar, timestamp, boolean, serial, text, integer } from 'drizzle-orm/pg-core';

export const pixels = pgTable('pixels', {
	id: uuid('id').primaryKey().defaultRandom(),
	label: varchar('label', { length: 255 }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	statsPublic: boolean('stats_public').default(true).notNull()
});

export const pixelEvents = pgTable('pixel_events', {
	id: serial('id').primaryKey(),
	pixelId: uuid('pixel_id').references(() => pixels.id, { onDelete: 'cascade' }).notNull(),
	openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
	userAgent: text('user_agent'),
	clientIp: varchar('client_ip', { length: 45 }), // Max length for IPv6
	referer: text('referer'),
	countryCode: varchar('country_code', { length: 2 }),
	city: varchar('city', { length: 100 }),
	region: varchar('region', { length: 100 }),
	isUnique: boolean('is_unique').default(true).notNull(),
	// Basic device info parsed from user agent
	browser: varchar('browser', { length: 100 }),
	os: varchar('os', { length: 100 }),
	deviceType: varchar('device_type', { length: 50 }), // mobile, tablet, desktop
	emailClient: varchar('email_client', { length: 100 }), // Gmail, Outlook, Apple Mail, etc.
	// Track if this is pre-send (setup/compose) or post-send (real open)
	eventPhase: varchar('event_phase', { length: 20 }).default('open').notNull() // 'setup' or 'open'
});

export const pixelCreators = pgTable('pixel_creators', {
	id: serial('id').primaryKey(),
	pixelId: uuid('pixel_id').references(() => pixels.id, { onDelete: 'cascade' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	clientIp: varchar('client_ip', { length: 45 }), // Max length for IPv6
	fingerprint: text('fingerprint'),
	// Browser and device info
	browser: varchar('browser', { length: 100 }),
	browserVersion: varchar('browser_version', { length: 50 }),
	os: varchar('os', { length: 100 }),
	osVersion: varchar('os_version', { length: 50 }),
	device: varchar('device', { length: 100 }),
	deviceType: varchar('device_type', { length: 50 }),
	// Screen and display
	screenWidth: integer('screen_width'),
	screenHeight: integer('screen_height'),
	screenDepth: integer('screen_depth'),
	viewportWidth: integer('viewport_width'),
	viewportHeight: integer('viewport_height'),
	// Location and timezone
	timezone: varchar('timezone', { length: 100 }),
	timezoneOffset: integer('timezone_offset'),
	language: varchar('language', { length: 10 }),
	languages: text('languages'), // JSON array of languages
	// Technical details
	platform: varchar('platform', { length: 100 }),
	vendor: varchar('vendor', { length: 100 }),
	hardwareConcurrency: integer('hardware_concurrency'),
	deviceMemory: integer('device_memory'),
	maxTouchPoints: integer('max_touch_points'),
	// Feature detection
	cookiesEnabled: boolean('cookies_enabled'),
	doNotTrack: boolean('do_not_track'),
	webglVendor: text('webgl_vendor'),
	webglRenderer: text('webgl_renderer'),
	// Canvas fingerprint and other hashes
	canvasHash: text('canvas_hash'),
	audioHash: text('audio_hash'),
	fontsHash: text('fonts_hash'),
	// Full fingerprint data for analysis
	fullFingerprint: text('full_fingerprint') // JSON data
});
