<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Copy, QrCode, ExternalLink, Loader2, BarChart } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import FingerprintJS from '@fingerprintjs/fingerprintjs';
	
	let label = '';
	let expiresIn = '30d';
	let isGenerating = false;
	let pixelData: {
		id: string;
		trackingUrl: string;
		statsUrl: string;
		embedCode: string;
	} | null = null;
	let error = '';
	let fingerprintData: any = null;
	
	onMount(async () => {
		// Initialize FingerprintJS and collect data
		try {
			const fp = await FingerprintJS.load();
			const result = await fp.get();
			fingerprintData = {
				visitorId: result.visitorId,
				components: result.components,
				confidence: result.confidence
			};
		} catch (e) {
			console.error('Failed to collect fingerprint:', e);
		}
	});
	
	async function generatePixel() {
		isGenerating = true;
		error = '';
		
		try {
			// Collect additional browser data
			const browserData = {
				screenWidth: screen.width,
				screenHeight: screen.height,
				screenDepth: screen.colorDepth,
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				timezoneOffset: new Date().getTimezoneOffset(),
				language: navigator.language,
				languages: navigator.languages,
				platform: navigator.platform,
				vendor: navigator.vendor,
				hardwareConcurrency: navigator.hardwareConcurrency,
				deviceMemory: (navigator as any).deviceMemory,
				maxTouchPoints: navigator.maxTouchPoints,
				cookiesEnabled: navigator.cookieEnabled,
				doNotTrack: navigator.doNotTrack === '1'
			};
			
			const response = await fetch('/api/pixels', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					label, 
					expiresIn,
					fingerprint: fingerprintData,
					browserData
				})
			});
			
			if (!response.ok) {
				throw new Error('Failed to generate pixel');
			}
			
			const data = await response.json();
			pixelData = {
				...data,
				embedCode: `<img src="${data.trackingUrl}" width="1" height="1" style="display:none" alt="">`
			};
		} catch (e) {
			error = 'Failed to generate pixel. Please try again.';
		} finally {
			isGenerating = false;
		}
	}
	
	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Generate Tracking Pixel</h1>
		<p class="text-muted-foreground">Create a free tracking pixel to monitor email opens anonymously.</p>
	</div>

	{#if !pixelData}
		<Card>
			<CardHeader>
				<CardTitle>Pixel Configuration</CardTitle>
				<CardDescription>Customize your tracking pixel settings</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<div>
					<label for="label" class="block text-sm font-medium mb-2">
						Label (Optional)
					</label>
					<Input
						id="label"
						bind:value={label}
						placeholder="e.g., Newsletter Campaign March 2024"
						class="max-w-md"
					/>
					<p class="text-sm text-muted-foreground mt-1">
						Add a label to identify this pixel in your stats
					</p>
				</div>

				<div>
					<label for="expires" class="block text-sm font-medium mb-2">
						Expiration
					</label>
					<Select bind:value={expiresIn}>
						<SelectTrigger class="max-w-md">
							<SelectValue placeholder="Select expiration" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">24 hours</SelectItem>
							<SelectItem value="7d">7 days</SelectItem>
							<SelectItem value="30d">30 days</SelectItem>
							<SelectItem value="never">Never expire</SelectItem>
						</SelectContent>
					</Select>
					<p class="text-sm text-muted-foreground mt-1">
						Pixel will stop tracking after this period
					</p>
				</div>

				{#if error}
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				<div class="space-y-4">
					<Button 
						on:click={generatePixel} 
						disabled={isGenerating}
						size="lg"
						class="w-full sm:w-auto"
					>
						{#if isGenerating}
							<Loader2 class="w-4 h-4 mr-2 animate-spin" />
							Generating...
						{:else}
							Generate Tracking Pixel
						{/if}
					</Button>
					
					<p class="text-xs text-muted-foreground">
						By clicking "Generate Tracking Pixel", you agree to our <a href="/terms" class="underline hover:no-underline">Terms of Service</a> and consent to the collection of browser fingerprinting data for service improvement and abuse prevention.
					</p>
				</div>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-6">
			<Alert>
				<AlertDescription>
					Your tracking pixel has been generated successfully! Copy the code below and embed it in your email.
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle>Your Tracking Pixel</CardTitle>
					{#if label}
						<Badge variant="outline">{label}</Badge>
					{/if}
				</CardHeader>
				<CardContent class="space-y-6">
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-sm font-medium">Embed Code</label>
							<Button
								variant="ghost"
								size="sm"
								on:click={() => copyToClipboard(pixelData.embedCode)}
							>
								<Copy class="w-4 h-4 mr-2" />
								Copy
							</Button>
						</div>
						<pre class="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{pixelData.embedCode}</pre>
					</div>

					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-sm font-medium">Tracking URL</label>
							<Button
								variant="ghost"
								size="sm"
								on:click={() => copyToClipboard(pixelData.trackingUrl)}
							>
								<Copy class="w-4 h-4 mr-2" />
								Copy
							</Button>
						</div>
						<code class="bg-muted p-2 rounded text-sm block break-all">
							{pixelData.trackingUrl}
						</code>
					</div>

					<div class="pt-4 border-t space-y-4">
						<Button href={pixelData.statsUrl} class="w-full">
							<BarChart class="w-4 h-4 mr-2" />
							View Stats Dashboard
						</Button>
						
						<div class="flex gap-2">
							<Button
								variant="outline"
								class="flex-1"
								on:click={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixelData.statsUrl)}`)}
							>
								<QrCode class="w-4 h-4 mr-2" />
								QR Code
							</Button>
							<Button
								variant="outline"
								class="flex-1"
								on:click={() => pixelData = null}
							>
								Generate Another
							</Button>
						</div>
					</div>

					<Alert>
						<AlertDescription>
							<strong>Important:</strong> Save your stats URL. This is the only way to access your tracking data.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
</script>