<script lang="ts">
	import '../app.css';
	import { Button } from '$lib/components/ui/button';
	import { Mail } from '@lucide/svelte';
	
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<header class="border-b">
		<div class="container mx-auto px-4 py-4 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2 font-semibold text-lg">
				<Mail class="w-6 h-6" />
				FreeTrackingPixel
			</a>
			<nav class="flex items-center gap-4">
				<Button href="/generate" variant="ghost">Generate Pixel</Button>
				<Button href="/#how-it-works" variant="ghost">How it Works</Button>
			</nav>
		</div>
	</header>
	
	<main class="flex-1">
		{@render children()}
	</main>
	
	<footer class="border-t mt-auto">
		<div class="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
			<p>Free, privacy-focused email tracking. No personal data collected.</p>
			<p class="mt-2">
				Built with 
				<a href="https://kit.svelte.dev" class="underline hover:no-underline">SvelteKit</a> & 
				<a href="https://neon.tech" class="underline hover:no-underline">Neon</a>
			</p>
		</div>
	</footer>
</div>
