<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { acapyClient } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';

	let loading = $state(true);
	let stats = $state({
		connections: 0,
		credentials: 0,
		schemas: 0,
		credDefs: 0
	});
	let agentStatus = $state<any>(null);

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		if (!authStore.token) return;

		loading = true;
		try {
			// Load agent status
			try {
				agentStatus = await acapyClient.getStatus();
				console.log('Agent status response:', agentStatus);
			} catch (err) {
				console.error('Failed to load agent status:', err);
			}

			// Load connections count
			try {
				const connections = await acapyClient.getConnections(authStore.token);
				stats.connections = (connections as any).results?.length || 0;
			} catch (err) {
				console.error('Failed to load connections:', err);
			}

			// Load credentials count
			try {
				const credentials = await acapyClient.getCredentials(authStore.token);
				stats.credentials = (credentials as any).results?.length || 0;
			} catch (err) {
				console.error('Failed to load credentials:', err);
			}

			// Load schemas count
			try {
				const schemas = await acapyClient.getSchemas(authStore.token);
				stats.schemas = (schemas as any).schema_ids?.length || 0;
			} catch (err) {
				console.error('Failed to load schemas:', err);
			}

			// Load cred defs count
			try {
				const credDefs = await acapyClient.getCredentialDefinitions(authStore.token);
				stats.credDefs = (credDefs as any).credential_definition_ids?.length || 0;
			} catch (err) {
				console.error('Failed to load cred defs:', err);
			}
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Dashboard Overview</h1>
		<p class="text-gray-500 dark:text-gray-400">Welcome to your ACA-Py tenant dashboard</p>
	</div>

	<!-- Agent Status -->
	<Card>
		<CardHeader>
			<CardTitle>Agent Status</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="flex items-center gap-2">
					<Badge variant="secondary">
						⏳ Loading...
					</Badge>
				</div>
			{:else if agentStatus}
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<Badge variant="default">
							✅ Connected
						</Badge>
						{#if agentStatus.version}
							<span class="text-sm text-gray-500">Version: {agentStatus.version}</span>
						{/if}
					</div>
					{#if agentStatus.label}
						<p class="text-sm text-gray-600 dark:text-gray-400">Label: {agentStatus.label}</p>
					{/if}
					{#if agentStatus.timing}
						<p class="text-xs text-gray-500">Timing: {JSON.stringify(agentStatus.timing)}</p>
					{/if}
				</div>
			{:else}
				<div class="flex items-center gap-2">
					<Badge variant="default">
						✅ Connected
					</Badge>
					<span class="text-sm text-gray-500">Agent is running</span>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Stats Grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Connections</CardTitle>
				<span class="text-2xl">🔗</span>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{loading ? '...' : stats.connections}</div>
				<p class="text-xs text-gray-500">Active connections</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Credentials</CardTitle>
				<span class="text-2xl">🎫</span>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{loading ? '...' : stats.credentials}</div>
				<p class="text-xs text-gray-500">Issued/received</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Schemas</CardTitle>
				<span class="text-2xl">📋</span>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{loading ? '...' : stats.schemas}</div>
				<p class="text-xs text-gray-500">Created schemas</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Cred Definitions</CardTitle>
				<span class="text-2xl">📝</span>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{loading ? '...' : stats.credDefs}</div>
				<p class="text-xs text-gray-500">Active definitions</p>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Actions -->
	<Card>
		<CardHeader>
			<CardTitle>Quick Actions</CardTitle>
			<CardDescription>Common tasks to get started</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<a
					href="/dashboard/connections"
					class="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
				>
					<span class="text-2xl">🔗</span>
					<div>
						<p class="font-medium">Create Connection</p>
						<p class="text-xs text-gray-500">Generate invitation</p>
					</div>
				</a>

				<a
					href="/dashboard/schemas"
					class="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
				>
					<span class="text-2xl">📋</span>
					<div>
						<p class="font-medium">Create Schema</p>
						<p class="text-xs text-gray-500">Define credential schema</p>
					</div>
				</a>

				<a
					href="/dashboard/credentials"
					class="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
				>
					<span class="text-2xl">🎫</span>
					<div>
						<p class="font-medium">Issue Credential</p>
						<p class="text-xs text-gray-500">Send credential to holder</p>
					</div>
				</a>
			</div>
		</CardContent>
	</Card>
</div>
