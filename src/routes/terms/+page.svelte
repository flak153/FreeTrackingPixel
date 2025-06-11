<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<Card>
		<CardHeader>
			<CardTitle class="text-2xl">Terms of Service</CardTitle>
		</CardHeader>
		<CardContent class="prose dark:prose-invert max-w-none">
			<p class="text-sm text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
			<p class="text-sm mb-4">
				By using FreeTrackingPixel, you agree to these Terms of Service and consent to our data collection practices.
			</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">2. Data Collection from Service Users</h3>
			<p class="text-sm mb-4">
				When you create tracking pixels, we collect comprehensive browser fingerprinting data including:
			</p>
			<ul class="list-disc list-inside text-sm mb-4 space-y-1">
				<li>Browser type, version, and configuration</li>
				<li>Operating system and device information</li>
				<li>Screen resolution and color depth</li>
				<li>Timezone and language settings</li>
				<li>Hardware specifications (CPU cores, memory)</li>
				<li>WebGL and canvas fingerprints</li>
				<li>Audio context fingerprint</li>
				<li>Installed fonts hash</li>
				<li>And other technical identifiers</li>
			</ul>
			<p class="text-sm mb-4">
				This data helps us improve our service, prevent abuse, and understand usage patterns.
			</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">3. Data Collection from Email Recipients</h3>
			<p class="text-sm mb-4">
				For email recipients who trigger tracking pixels, we only collect:
			</p>
			<ul class="list-disc list-inside text-sm mb-4 space-y-1">
				<li>Basic browser and email client information from user agent</li>
				<li>General geographic location (country, city)</li>
				<li>Timestamp of email open</li>
				<li>No personal data or cookies</li>
			</ul>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">4. Use of Service</h3>
			<p class="text-sm mb-4">
				You agree to use this service only for lawful purposes and in compliance with all applicable laws and regulations.
			</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">5. Privacy and Data Security</h3>
			<p class="text-sm mb-4">
				We take reasonable measures to protect collected data. IP addresses are hashed, and no personally identifiable information is stored from email recipients.
			</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">6. Limitation of Liability</h3>
			<p class="text-sm mb-4">
				This service is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of this service.
			</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">7. Changes to Terms</h3>
			<p class="text-sm mb-4">
				We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.
			</p>
			
			<h3 class="text-lg font-semibold mt-6 mb-3">8. Contact</h3>
			<p class="text-sm">
				For questions about these terms, please contact us through our GitHub repository.
			</p>
		</CardContent>
	</Card>
</div>