<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Copy, QrCode, ExternalLink, Loader2, BarChart, Check } from '@lucide/svelte';
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
	let copiedItem: string | null = null;
	
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
		
		console.log('Starting pixel generation...');
		console.log('Fingerprint data:', fingerprintData);
		
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
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to generate pixel');
			}
			
			const data = await response.json();
			pixelData = {
				...data,
				embedCode: `<img src="${data.trackingUrl}" width="3" height="3" alt="•" style="opacity:0.3">`
			};
		} catch (e) {
			console.error('Pixel generation error:', e);
			error = e instanceof Error ? e.message : 'Failed to generate pixel. Please try again.';
		} finally {
			isGenerating = false;
		}
	}
	
	async function copyToClipboard(text: string, itemName: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedItem = itemName;
			setTimeout(() => {
				copiedItem = null;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	async function copyPixelImage() {
		try {
			// Fetch the PNG image
			const response = await fetch(pixelData.trackingUrl);
			const blob = await response.blob();
			
			// Create a ClipboardItem with the PNG
			const item = new ClipboardItem({ 'image/png': blob });
			await navigator.clipboard.write([item]);
			
			copiedItem = 'image';
			setTimeout(() => {
				copiedItem = null;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy image:', e);
			// Fallback message
			alert('Unable to copy image. Please right-click and select "Copy Image" instead.');
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
							{#if expiresIn === '24h'}
								24 hours
							{:else if expiresIn === '7d'}
								7 days
							{:else if expiresIn === '30d'}
								30 days
							{:else}
								Select expiration
							{/if}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">24 hours</SelectItem>
							<SelectItem value="7d">7 days</SelectItem>
							<SelectItem value="30d">30 days (maximum)</SelectItem>
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
						onclick={generatePixel} 
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
						By clicking "Generate Tracking Pixel", you agree to our <a href="/terms" class="underline hover:no-underline">Terms of Service</a>.
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
						<div class="mb-2">
							<span class="text-sm font-medium">How to Add the Tracking Pixel</span>
						</div>
						<div class="bg-muted p-4 rounded-md space-y-4">
							<div>
								<p class="text-sm font-medium mb-2">Option 1: Copy pixel image</p>
								<p class="text-xs text-muted-foreground mb-2">Copy and paste directly into your email composer:</p>
								<div class="flex items-center gap-4">
									<div class="relative inline-block">
										<div class="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none"></div>
										<img 
											src={pixelData.trackingUrl} 
											width="3" 
											height="3" 
											alt="•"
											class="block"
											style="min-width: 40px; min-height: 40px; opacity: 0.3;"
										/>
									</div>
									<Button
										variant="outline"
										size="sm"
										onclick={() => copyPixelImage()}
									>
										{#if copiedItem === 'image'}
											<Check class="w-4 h-4 mr-2" />
											Copied!
										{:else}
											<Copy class="w-4 h-4 mr-2" />
											Copy Pixel
										{/if}
									</Button>
									<span class="text-xs text-muted-foreground">(Shown enlarged - displays as tiny dot)</span>
								</div>
							</div>
							<div>
								<p class="text-sm font-medium mb-2">Option 2: Insert image by URL</p>
								<p class="text-xs text-muted-foreground mb-2">Use your email editor's "Insert Image" feature with this URL:</p>
								<div class="flex items-start gap-2">
									<code class="bg-background p-2 rounded text-xs flex-1 select-all break-all">{pixelData.trackingUrl}</code>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => copyToClipboard(pixelData.trackingUrl, 'imgurl')}
									>
										{#if copiedItem === 'imgurl'}
											<Check class="w-4 h-4" />
										{:else}
											<Copy class="w-4 h-4" />
										{/if}
									</Button>
								</div>
							</div>
						</div>
					</div>


					<div>
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium">Tracking URL</span>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => copyToClipboard(pixelData.trackingUrl, 'url')}
							>
								{#if copiedItem === 'url'}
									<Check class="w-4 h-4 mr-2" />
									Copied!
								{:else}
									<Copy class="w-4 h-4 mr-2" />
									Copy
								{/if}
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
								onclick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixelData.statsUrl)}`)}
							>
								<QrCode class="w-4 h-4 mr-2" />
								QR Code
							</Button>
							<Button
								variant="outline"
								class="flex-1"
								onclick={() => pixelData = null}
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
