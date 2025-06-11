<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Eye, Users, Clock, Share2, RefreshCw } from '@lucide/svelte';
	
	let stats: any = null;
	let loading = true;
	let error = '';
	let refreshing = false;
	
	$: pixelId = $page.params.id;
	
	async function fetchStats() {
		try {
			const response = await fetch(`/api/stats/${pixelId}`);
			if (!response.ok) {
				if (response.status === 404) {
					error = 'Tracking pixel not found';
				} else {
					error = 'Failed to load stats';
				}
				return;
			}
			stats = await response.json();
			error = '';
		} catch (e) {
			error = 'Failed to load stats';
		} finally {
			loading = false;
			refreshing = false;
		}
	}
	
	async function refresh() {
		refreshing = true;
		await fetchStats();
	}
	
	onMount(() => {
		fetchStats();
		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchStats, 30000);
		return () => clearInterval(interval);
	});
	
	function formatTime(date: string) {
		return new Date(date).toLocaleString();
	}
	
	function getTimeAgo(date: string) {
		const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	{#if loading}
		<div class="space-y-4">
			<Skeleton class="h-8 w-64" />
			<div class="grid md:grid-cols-3 gap-4">
				<Skeleton class="h-32" />
				<Skeleton class="h-32" />
				<Skeleton class="h-32" />
			</div>
		</div>
	{:else if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if stats}
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold">Tracking Stats</h1>
					{#if stats.pixel.label}
						<Badge variant="outline" class="mt-2">{stats.pixel.label}</Badge>
					{/if}
				</div>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" on:click={refresh} disabled={refreshing}>
						<RefreshCw class="w-4 h-4 mr-2 {refreshing ? 'animate-spin' : ''}" />
						Refresh
					</Button>
					<Button variant="outline" size="sm">
						<Share2 class="w-4 h-4 mr-2" />
						Share
					</Button>
				</div>
			</div>

			<!-- Stats Cards -->
			<div class="grid md:grid-cols-3 gap-4">
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-medium">Total Opens</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex items-center justify-between">
							<span class="text-3xl font-bold">{stats.stats.total}</span>
							<Eye class="w-8 h-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-medium">Unique Opens</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex items-center justify-between">
							<span class="text-3xl font-bold">{stats.stats.unique}</span>
							<Users class="w-8 h-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-medium">Created</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex items-center justify-between">
							<span class="text-lg">{getTimeAgo(stats.pixel.createdAt)}</span>
							<Clock class="w-8 h-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Timeline Chart -->
			{#if stats.stats.timeline.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Opens Timeline</CardTitle>
						<CardDescription>Hourly breakdown of email opens</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="h-64 flex items-end gap-1">
							{#each stats.stats.timeline as point}
								{@const maxCount = Math.max(...stats.stats.timeline.map(p => p.count))}
								{@const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0}
								<div 
									class="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
									style="height: {height}%"
									title="{point.count} opens at {formatTime(point.time)}"
								/>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Recent Activity -->
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>Last 10 email opens with details</CardDescription>
				</CardHeader>
				<CardContent>
					{#if stats.stats.recentEvents.length === 0}
						<p class="text-muted-foreground">No opens yet</p>
					{:else}
						<div class="space-y-3">
							{#each stats.stats.recentEvents as event}
								<div class="py-3 border-b last:border-0">
									<div class="flex items-center justify-between mb-2">
										<span class="text-sm font-medium">{formatTime(event.time)}</span>
										<div class="flex items-center gap-2">
											{#if event.isUnique}
												<Badge variant="secondary" class="text-xs">Unique</Badge>
											{/if}
											<span class="text-sm text-muted-foreground">{getTimeAgo(event.time)}</span>
										</div>
									</div>
									<div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
										{#if event.location}
											<div>📍 {event.location}</div>
										{/if}
										{#if event.emailClient}
											<div>✉️ {event.emailClient}</div>
										{/if}
										{#if event.browser}
											<div>🌐 {event.browser}</div>
										{/if}
										{#if event.device}
											<div>📱 {event.device}</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
			
			<!-- Analytics Overview -->
			<div class="grid md:grid-cols-2 gap-4">
				<!-- Email Clients -->
				<Card>
					<CardHeader>
						<CardTitle>Email Clients</CardTitle>
						<CardDescription>Distribution of email clients</CardDescription>
					</CardHeader>
					<CardContent>
						{#if stats.stats.emailClients && stats.stats.emailClients.length > 0}
							<div class="space-y-2">
								{#each stats.stats.emailClients as client}
									<div class="flex items-center justify-between">
										<span class="text-sm">{client.name || 'Unknown'}</span>
										<div class="flex items-center gap-2">
											<div class="w-32 bg-muted rounded-full h-2">
												<div 
													class="bg-blue-500 h-2 rounded-full" 
													style="width: {(client.count / stats.stats.total) * 100}%"
												/>
											</div>
											<span class="text-sm text-muted-foreground w-12 text-right">{client.count}</span>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No data yet</p>
						{/if}
					</CardContent>
				</Card>
				
				<!-- Devices -->
				<Card>
					<CardHeader>
						<CardTitle>Devices</CardTitle>
						<CardDescription>Device type breakdown</CardDescription>
					</CardHeader>
					<CardContent>
						{#if stats.stats.devices && stats.stats.devices.length > 0}
							<div class="space-y-2">
								{#each stats.stats.devices as device}
									<div class="flex items-center justify-between">
										<span class="text-sm capitalize">{device.type || 'Unknown'}</span>
										<div class="flex items-center gap-2">
											<div class="w-32 bg-muted rounded-full h-2">
												<div 
													class="bg-purple-500 h-2 rounded-full" 
													style="width: {(device.count / stats.stats.total) * 100}%"
												/>
											</div>
											<span class="text-sm text-muted-foreground w-12 text-right">{device.count}</span>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No data yet</p>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Expiration Notice -->
			{#if stats.pixel.expiresAt}
				{@const isExpired = new Date() > new Date(stats.pixel.expiresAt)}
				<Alert variant={isExpired ? "destructive" : "default"}>
					<AlertDescription>
						{#if isExpired}
							This tracking pixel has expired and is no longer collecting data.
						{:else}
							This tracking pixel will expire on {new Date(stats.pixel.expiresAt).toLocaleDateString()}.
						{/if}
					</AlertDescription>
				</Alert>
			{/if}
		</div>
	{/if}
</div>