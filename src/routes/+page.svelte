<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Mail, Shield, Zap, BarChart } from '@lucide/svelte';
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<!-- Hero Section -->
	<section class="container mx-auto px-4 py-16 text-center">
		<Badge variant="secondary" class="mb-4">100% Free • No Sign-up Required</Badge>
		<h1 class="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
			Track Email Opens with
			<span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
				Privacy First
			</span>
		</h1>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
			Generate free tracking pixels to monitor email opens. No personal data collected, no cookies, just anonymous insights.
		</p>
		<div class="flex gap-4 justify-center">
			<Button href="/generate" size="lg" class="shadow-lg">
				Generate Free Pixel
			</Button>
			<Button href="#how-it-works" variant="outline" size="lg">
				Learn More
			</Button>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="container mx-auto px-4 py-16">
		<div class="grid md:grid-cols-3 gap-8">
			<Card class="p-6 text-center hover:shadow-lg transition-shadow">
				<Shield class="w-12 h-12 mx-auto mb-4 text-blue-600" />
				<h3 class="text-xl font-semibold mb-2">Privacy Focused</h3>
				<p class="text-muted-foreground">
					No personal data stored. Only anonymous counters and basic geographic info.
				</p>
			</Card>
			<Card class="p-6 text-center hover:shadow-lg transition-shadow">
				<Zap class="w-12 h-12 mx-auto mb-4 text-purple-600" />
				<h3 class="text-xl font-semibold mb-2">Instant Setup</h3>
				<p class="text-muted-foreground">
					Generate a tracking pixel in seconds. No account needed, just copy and paste.
				</p>
			</Card>
			<Card class="p-6 text-center hover:shadow-lg transition-shadow">
				<BarChart class="w-12 h-12 mx-auto mb-4 text-green-600" />
				<h3 class="text-xl font-semibold mb-2">Real-time Stats</h3>
				<p class="text-muted-foreground">
					View opens, unique opens, and timeline data instantly on your private dashboard.
				</p>
			</Card>
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="container mx-auto px-4 py-16">
		<h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
		<div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
			<div class="text-center">
				<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<span class="text-2xl font-bold text-blue-600">1</span>
				</div>
				<h3 class="font-semibold mb-2">Generate Pixel</h3>
				<p class="text-muted-foreground">
					Click generate and optionally add a label to identify your campaign
				</p>
			</div>
			<div class="text-center">
				<div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<span class="text-2xl font-bold text-purple-600">2</span>
				</div>
				<h3 class="font-semibold mb-2">Embed in Email</h3>
				<p class="text-muted-foreground">
					Copy the HTML code and paste it into your email template
				</p>
			</div>
			<div class="text-center">
				<div class="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<span class="text-2xl font-bold text-green-600">3</span>
				</div>
				<h3 class="font-semibold mb-2">Track Opens</h3>
				<p class="text-muted-foreground">
					Visit your unique stats page to see real-time open tracking data
				</p>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="container mx-auto px-4 py-16 text-center">
		<Card class="p-12 max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-0">
			<Mail class="w-16 h-16 mx-auto mb-4 text-blue-600" />
			<h2 class="text-2xl font-bold mb-4">Ready to Track Your Emails?</h2>
			<p class="text-muted-foreground mb-6">
				Start tracking email opens in seconds. No credit card, no sign-up.
			</p>
			<Button href="/generate" size="lg" class="shadow-lg">
				Generate Your First Pixel
			</Button>
		</Card>
	</section>
</div>
