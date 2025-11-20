<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { acapyClient } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';

	interface DID {
		did: string;
		verkey: string;
		method?: string;
		posture?: string;
		key_type?: string;
		posted?: boolean;
	}

	interface DIDsResponse {
		results: DID[];
	}

	let dids = $state<DID[]>([]);
	let publicDid = $state<DID | null>(null);
	let loading = $state(true);
	let showCreateDialog = $state(false);
	let creating = $state(false);
	let settingPublic = $state(false);
	let error = $state('');

	// Create DID form
	let didMethod = $state('sov');
	let didOptions = $state(''); // Empty by default

	onMount(async () => {
		await loadDIDs();
	});

	async function loadDIDs() {
		if (!authStore.token) return;

		loading = true;
		error = '';
		try {
			const response = await acapyClient.getDIDs(authStore.token) as DIDsResponse;
			console.log('DIDs response:', response);
			dids = response.results || [];
			console.log('DIDs list:', dids);

			// Find public DID - check multiple possible fields
			publicDid = dids.find(d => 
				d.posture === 'public' || 
				d.posture === 'posted' ||
				(d as any).posted === true
			) || null;
			
			console.log('Public DID found:', publicDid);
		} catch (err: any) {
			console.error('Failed to load DIDs:', err);
			error = 'Failed to load DIDs';
			toast.error('Failed to load DIDs', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loading = false;
		}
	}

	async function createDID() {
		if (!authStore.token) return;

		creating = true;
		error = '';
		try {
			let requestBody: any = {
				method: didMethod
			};

			// Parse options if provided
			if (didOptions.trim() && didOptions !== '{}') {
				try {
					const parsedOptions = JSON.parse(didOptions);
					requestBody.options = parsedOptions;
				} catch {
					error = 'Invalid JSON in options';
					creating = false;
					return;
				}
			}

			console.log('Creating DID with:', requestBody);
			const result = await acapyClient.createDID(authStore.token, requestBody);

			showCreateDialog = false;
			didMethod = 'sov';
			didOptions = '';
			
			toast.success('DID created successfully!', {
				description: `Method: ${requestBody.method}`
			});
			
			await loadDIDs();
		} catch (err: any) {
			console.error('Failed to create DID:', err);
			error = err.message || 'Failed to create DID';
			toast.error('Failed to create DID', {
				description: err.message || 'Unknown error'
			});
		} finally {
			creating = false;
		}
	}

	async function setPublicDID(did: string) {
		if (!authStore.token) return;
		if (!confirm('Set this DID as public? This action cannot be undone.')) return;

		settingPublic = true;
		try {
			const result = await acapyClient.setPublicDID(authStore.token, did);
			console.log('Set public DID result:', result);
			
			toast.success('Public DID set successfully!', {
				description: 'Refreshing DID list...'
			});
			
			// Force reload after a short delay to ensure ledger update
			setTimeout(async () => {
				await loadDIDs();
				settingPublic = false;
			}, 1500);
		} catch (err: any) {
			console.error('Failed to set public DID:', err);
			toast.error('Failed to set public DID', {
				description: err.message || 'Unknown error'
			});
			settingPublic = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard!');
	}

	function formatDID(did: string) {
		if (did.length > 40) {
			return did.substring(0, 20) + '...' + did.substring(did.length - 20);
		}
		return did;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Wallet & DIDs</h1>
			<p class="text-gray-500 dark:text-gray-400">Manage your decentralized identifiers</p>
		</div>
		<Button onclick={() => showCreateDialog = true}>
			➕ Create DID
		</Button>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
			{error}
		</div>
	{/if}

	<!-- Public DID Section -->
	{#if publicDid}
		<Card class="border-2 border-blue-200 dark:border-blue-800">
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle class="flex items-center gap-2">
							<span>🌐</span>
							Public DID
						</CardTitle>
						<CardDescription>Your publicly registered DID</CardDescription>
					</div>
					<Badge variant="default">Public</Badge>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">DID</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 rounded bg-gray-100 p-2 text-sm dark:bg-gray-800">
							{publicDid.did}
						</code>
						<Button size="sm" variant="outline" onclick={() => copyToClipboard(publicDid!.did)}>
							📋 Copy
						</Button>
					</div>
				</div>

				<div>
					<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Verification Key</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 rounded bg-gray-100 p-2 text-sm dark:bg-gray-800">
							{publicDid.verkey}
						</code>
						<Button size="sm" variant="outline" onclick={() => copyToClipboard(publicDid!.verkey)}>
							📋 Copy
						</Button>
					</div>
				</div>

				{#if publicDid.method}
					<div>
						<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Method</p>
						<Badge variant="secondary">{publicDid.method}</Badge>
					</div>
				{/if}
			</CardContent>
		</Card>
	{:else}
		<Card class="border-2 border-yellow-200 dark:border-yellow-800">
			<CardContent class="py-8 text-center">
				<div class="mb-4 text-5xl">⚠️</div>
				<h3 class="mb-2 text-lg font-semibold">No Public DID</h3>
				<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
					You need a public DID to issue credentials and interact with the ledger
				</p>
				<p class="text-xs text-gray-500">
					Create a DID below and set it as public
				</p>
			</CardContent>
		</Card>
	{/if}

	<!-- All DIDs Section -->
	<Card>
		<CardHeader>
			<CardTitle>All DIDs ({dids.length})</CardTitle>
			<CardDescription>List of all DIDs in your wallet</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading DIDs...</div>
			{:else if dids.length === 0}
				<div class="py-8 text-center">
					<p class="text-gray-500">No DIDs yet</p>
					<p class="mt-2 text-sm text-gray-400">Create your first DID to get started</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each dids as did}
						<div class="rounded-lg border p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-3">
									<div>
										<div class="mb-1 flex items-center gap-2">
											<span class="text-sm font-medium text-gray-500 dark:text-gray-400">DID</span>
											{#if did.posture === 'public' || did.posture === 'posted' || did.posted === true}
												<Badge variant="default" class="text-xs">Public</Badge>
											{:else}
												<Badge variant="secondary" class="text-xs">Local</Badge>
											{/if}
											{#if did.method}
												<Badge variant="outline" class="text-xs">{did.method}</Badge>
											{/if}
										</div>
										<div class="flex items-center gap-2">
											<code class="text-sm">{formatDID(did.did)}</code>
											<button
												onclick={() => copyToClipboard(did.did)}
												class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
												title="Copy DID"
											>
												📋
											</button>
										</div>
									</div>

									<div>
										<p class="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Verification Key</p>
										<div class="flex items-center gap-2">
											<code class="text-xs text-gray-600 dark:text-gray-400">{formatDID(did.verkey)}</code>
											<button
												onclick={() => copyToClipboard(did.verkey)}
												class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
												title="Copy Verkey"
											>
												📋
											</button>
										</div>
									</div>
								</div>

								<div class="flex flex-col gap-2">
									{#if did.posture !== 'public' && did.posture !== 'posted' && did.posted !== true}
										<Button 
											size="sm" 
											variant="outline" 
											onclick={() => setPublicDID(did.did)}
											disabled={settingPublic}
										>
											{settingPublic ? '⏳ Setting...' : '🌐 Set Public'}
										</Button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Info Card -->
	<Card class="bg-blue-50 dark:bg-blue-900/20">
		<CardContent class="pt-6">
			<h3 class="mb-3 font-semibold text-blue-900 dark:text-blue-100">
				💡 About DIDs
			</h3>
			<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
				<li>✓ <strong>Local DID:</strong> Only stored in your wallet, not on ledger</li>
				<li>✓ <strong>Public DID:</strong> Registered on ledger, can be resolved by others</li>
				<li>✓ <strong>Verkey:</strong> Public key for verifying signatures</li>
				<li>✓ You need a public DID to create schemas and credential definitions</li>
			</ul>
		</CardContent>
	</Card>
</div>

<!-- Create DID Dialog -->
<Dialog open={showCreateDialog} onOpenChange={(open) => showCreateDialog = open}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Create New DID</DialogTitle>
			<DialogDescription>Create a new decentralized identifier in your wallet</DialogDescription>
		</DialogHeader>

		<form onsubmit={(e) => { e.preventDefault(); createDID(); }} class="space-y-4">
			<div class="space-y-2">
				<Label for="didMethod">DID Method</Label>
				<select
					id="didMethod"
					bind:value={didMethod}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={creating}
				>
					<option value="sov">sov (Sovrin) - Recommended</option>
					<option value="key">key (did:key)</option>
				</select>
				<p class="text-xs text-gray-500">
					<strong>sov</strong> is recommended for ledger-based DIDs
				</p>
			</div>

			<div class="space-y-2">
				<Label for="didOptions">Options (JSON) - Optional</Label>
				<textarea
					id="didOptions"
					bind:value={didOptions}
					rows={4}
					class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
					placeholder="Leave empty for default"
					disabled={creating}
				></textarea>
				<p class="text-xs text-gray-500">
					Optional: Leave empty to use defaults. Example: <code class="text-xs">{"{"}"key_type": "ed25519"{"}"}</code>
				</p>
			</div>

			{#if error}
				<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
					{error}
				</div>
			{/if}

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={() => showCreateDialog = false} disabled={creating}>
					Cancel
				</Button>
				<Button type="submit" disabled={creating}>
					{creating ? 'Creating...' : 'Create DID'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
