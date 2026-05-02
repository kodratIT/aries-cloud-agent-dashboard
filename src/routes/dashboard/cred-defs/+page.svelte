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

	interface CredDef {
		credential_definition_id: string;
		credential_definition: {
			issuerId: string;
			schemaId: string;
			tag: string;
			type: string;
		};
	}

	interface Schema {
		schema_id: string;
		schema: {
			name: string;
			version: string;
			attrNames: string[];
		};
	}

	let credDefs = $state<CredDef[]>([]);
	let schemas = $state<Schema[]>([]);
	let loading = $state(true);
	let showCreateDialog = $state(false);
	let creating = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let publicDid = $state<string | null>(null);

	// Create cred def form
	let selectedSchemaId = $state('');
	let tag = $state('');
	let supportRevocation = $state(false);

	// Cred def details
	let selectedCredDef = $state<CredDef | null>(null);
	let showDetailsDialog = $state(false);

	onMount(async () => {
		await loadPublicDid();
		await loadSchemas();
		await loadCredDefs();
	});

	async function loadPublicDid() {
		if (!authStore.token) return;

		try {
			const response = await acapyClient.getDIDs(authStore.token) as any;
			const dids = response.results || [];
			const publicDidObj = dids.find((d: any) => 
				d.posture === 'public' || 
				d.posture === 'posted' ||
				d.posted === true
			);
			
			if (publicDidObj) {
				publicDid = publicDidObj.did;
			}
		} catch (err) {
			console.error('Failed to load public DID:', err);
		}
	}

	async function loadSchemas() {
		if (!authStore.token) return;

		try {
			const response = await acapyClient.getSchemas(authStore.token) as any;
			
			if (response.schema_ids && response.schema_ids.length > 0) {
				const schemaDetails = await Promise.all(
					response.schema_ids.map(async (schemaId: string) => {
						try {
							return await acapyClient.getSchemaById(authStore.token, schemaId);
						} catch (err) {
							return null;
						}
					})
				);
				schemas = schemaDetails.filter(s => s !== null) as Schema[];
			}
		} catch (err) {
			console.error('Failed to load schemas:', err);
		}
	}

	async function loadCredDefs() {
		if (!authStore.token) return;

		loading = true;
		error = '';
		try {
			const response = await acapyClient.getCredentialDefinitions(authStore.token) as any;
			console.log('Cred defs response:', response);

			if (response.credential_definition_ids && response.credential_definition_ids.length > 0) {
				const credDefDetails = await Promise.all(
					response.credential_definition_ids.map(async (credDefId: string) => {
						try {
							const details = await acapyClient.getCredDefById(authStore.token, credDefId);
							return details;
						} catch (err) {
							console.error(`Failed to load cred def ${credDefId}:`, err);
							return null;
						}
					})
				);
				credDefs = credDefDetails.filter(c => c !== null) as CredDef[];
			} else {
				credDefs = [];
			}

			console.log('Cred defs loaded:', credDefs);
		} catch (err: any) {
			console.error('Failed to load credential definitions:', err);
			error = 'Failed to load credential definitions';
			toast.error('Failed to load credential definitions', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loading = false;
		}
	}

	async function createCredDef() {
		if (!authStore.token) return;

		// Check prerequisites
		if (!publicDid) {
			error = 'You need a public DID to create credential definitions';
			toast.error('Public DID required');
			return;
		}

		if (!selectedSchemaId) {
			error = 'Please select a schema';
			return;
		}

		if (!tag.trim()) {
			error = 'Tag is required';
			return;
		}

		// Check if tag already exists for this schema
		const existingCredDef = credDefs.find(cd => 
			cd.credential_definition.schemaId === selectedSchemaId && 
			cd.credential_definition.tag === tag.trim()
		);
		
		if (existingCredDef) {
			error = `A credential definition with tag "${tag.trim()}" already exists for this schema. Please use a different tag.`;
			toast.error('Duplicate tag', {
				description: 'This tag is already used for this schema'
			});
			return;
		}

		creating = true;
		error = '';
		try {
			const requestBody = {
				credential_definition: {
					issuerId: publicDid,
					schemaId: selectedSchemaId,
					tag: tag.trim()
				},
				options: {
					support_revocation: supportRevocation
				}
			};

			console.log('Creating credential definition with:', requestBody);
			const result = await acapyClient.createCredentialDefinition(authStore.token, requestBody);
			console.log('Credential definition created:', result);

			showCreateDialog = false;
			selectedSchemaId = '';
			tag = '';
			supportRevocation = false;

			toast.success('Credential definition created successfully!');

			await loadCredDefs();
		} catch (err: any) {
			console.error('Failed to create credential definition:', err);
			error = err.message || 'Failed to create credential definition';
			toast.error('Failed to create credential definition', {
				description: err.message || 'Unknown error'
			});
		} finally {
			creating = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard!');
	}

	function viewCredDefDetails(credDef: CredDef) {
		selectedCredDef = credDef;
		showDetailsDialog = true;
	}

	function getSchemaName(schemaId: string): string {
		// If schemaId is just a sequence number, we need to find the actual schema
		if (schemaId && !schemaId.includes(':')) {
			console.log('Schema ID is a sequence number:', schemaId);
			// Can't determine schema from sequence number alone without more context
			return 'Unknown Schema';
		}
		
		const schema = schemas.find(s => s.schema_id === schemaId);
		return schema ? schema.schema.name : 'Unknown Schema';
	}

	function getSchemaForCredDef(credDefId: string, schemaId: string): Schema | null {
		// If schemaId is just a sequence number, try to find the actual schema
		if (schemaId && !schemaId.includes(':')) {
			// Extract issuer from credential_definition_id
			// Format: issuer:3:CL:schema_seq_no:tag
			const credDefParts = credDefId.split(':');
			if (credDefParts.length >= 1) {
				const issuer = credDefParts[0];
				// Find schema with matching issuer
				const matchingSchemas = schemas.filter(s => s.schema_id.startsWith(issuer));
				if (matchingSchemas.length > 0) {
					// Return first matching schema
					return matchingSchemas[0];
				}
			}
		}
		
		// Try to find by full schema ID
		const schema = schemas.find(s => s.schema_id === schemaId);
		return schema || null;
	}

	function matchesSearch(credDef: CredDef): boolean {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		const schema = getSchemaForCredDef(credDef.credential_definition_id, credDef.credential_definition.schemaId);
		const schemaName = schema?.schema.name || 'Unknown Schema';
		return (
			credDef.credential_definition_id.toLowerCase().includes(query) ||
			credDef.credential_definition.tag.toLowerCase().includes(query) ||
			schemaName.toLowerCase().includes(query)
		);
	}

	let filteredCredDefs = $derived(credDefs.filter(matchesSearch));

</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Credential Definitions</h1>
			<p class="text-gray-500 dark:text-gray-400">Define credential types for issuance</p>
		</div>
		<Button onclick={() => showCreateDialog = true} disabled={!publicDid || schemas.length === 0}>
			➕ Create Credential Definition
		</Button>
	</div>

	{#if !publicDid && !loading}
		<Card class="border-2 border-yellow-200 dark:border-yellow-800">
			<CardContent class="py-6">
				<div class="flex items-start gap-4">
					<div class="text-4xl">⚠️</div>
					<div class="flex-1">
						<h3 class="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
							Public DID Required
						</h3>
						<p class="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
							You need a public DID to create credential definitions.
						</p>
						<Button onclick={() => window.location.href = '/dashboard/wallet'}>
							Go to Wallet & DIDs
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	{:else if schemas.length === 0 && !loading}
		<Card class="border-2 border-yellow-200 dark:border-yellow-800">
			<CardContent class="py-6">
				<div class="flex items-start gap-4">
					<div class="text-4xl">📋</div>
					<div class="flex-1">
						<h3 class="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
							Schema Required
						</h3>
						<p class="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
							You need to create at least one schema before creating credential definitions.
						</p>
						<Button onclick={() => window.location.href = '/dashboard/schemas'}>
							Go to Schemas
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	{#if error && !loading}
		<div class="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
			{error}
		</div>
	{/if}

	<!-- Search -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex items-center gap-2">
				<Input
					type="text"
					placeholder="Search credential definitions..."
					bind:value={searchQuery}
					class="flex-1"
				/>
				<Button variant="outline" onclick={() => searchQuery = ''}>
					Clear
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Credential Definitions List -->
	<Card>
		<CardHeader>
			<CardTitle>All Credential Definitions ({filteredCredDefs.length})</CardTitle>
			<CardDescription>List of all credential definition templates</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading credential definitions...</div>
			{:else if filteredCredDefs.length === 0}
				<div class="py-8 text-center">
					{#if searchQuery.trim()}
						<p class="text-gray-500">No credential definitions found matching "{searchQuery}"</p>
						<Button variant="link" onclick={() => searchQuery = ''}>Clear search</Button>
					{:else}
						<p class="text-gray-500">No credential definitions yet</p>
						<p class="mt-2 text-sm text-gray-400">Create your first credential definition to start issuing credentials</p>
						{#if publicDid && schemas.length > 0}
							<Button class="mt-4" onclick={() => showCreateDialog = true}>
								Create Credential Definition
							</Button>
						{/if}
					{/if}
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredCredDefs as credDef}
						{@const schema = getSchemaForCredDef(credDef.credential_definition_id, credDef.credential_definition.schemaId)}
						<div class="rounded-lg border p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-2">
									<div>
										<div class="mb-1 flex items-center gap-2">
											<h3 class="font-semibold">{schema?.schema.name || 'Unknown Schema'}</h3>
											<Badge variant="outline">{credDef.credential_definition.tag}</Badge>
										</div>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											ID: {credDef.credential_definition_id.substring(0, 60)}...
										</p>
									</div>

									<div class="flex flex-wrap gap-2 text-xs">
										<Badge variant="secondary">
											Schema: {credDef.credential_definition.schemaId.split(':').pop()}
										</Badge>
									</div>
								</div>

								<div class="flex gap-2">
									<Button size="sm" variant="outline" onclick={() => viewCredDefDetails(credDef)}>
										👁️ View
									</Button>
									<Button size="sm" variant="outline" onclick={() => copyToClipboard(credDef.credential_definition_id)}>
										📋 Copy ID
									</Button>
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
				💡 About Credential Definitions
			</h3>
			<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
				<li>✓ <strong>Credential Definition</strong> is a template for issuing credentials</li>
				<li>✓ Based on a <strong>schema</strong> that defines the structure</li>
				<li>✓ Each issuer creates their own cred def for a schema</li>
				<li>✓ <strong>Tag</strong> helps identify different versions or types</li>
				<li>✓ Required before you can issue credentials</li>
			</ul>
		</CardContent>
	</Card>
</div>

<!-- Create Credential Definition Dialog -->
<Dialog open={showCreateDialog} onOpenChange={(open) => showCreateDialog = open}>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>Create Credential Definition</DialogTitle>
			<DialogDescription>Create a template for issuing credentials based on a schema</DialogDescription>
		</DialogHeader>

		<form onsubmit={(e) => { e.preventDefault(); createCredDef(); }} class="space-y-4">
			<div class="space-y-2">
				<Label for="schema">Schema *</Label>
				<select
					id="schema"
					bind:value={selectedSchemaId}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={creating}
					required
				>
					<option value="">Select a schema...</option>
					{#each schemas as schema}
						<option value={schema.schema_id}>
							{schema.schema.name} v{schema.schema.version} ({schema.schema.attrNames.length} attributes)
						</option>
					{/each}
				</select>
				<p class="text-xs text-gray-500">Select the schema this credential definition will be based on</p>
			</div>

			<div class="space-y-2">
				<Label for="tag">Tag *</Label>
				<Input
					id="tag"
					type="text"
					placeholder="e.g., default, v1, premium, employee-2024"
					bind:value={tag}
					disabled={creating}
					required
				/>
				<p class="text-xs text-gray-500">
					A unique tag to identify this credential definition. Each tag creates a separate credential definition.
				</p>
				{#if selectedSchemaId}
					{@const existingTags = credDefs
						.filter(cd => cd.credential_definition.schemaId === selectedSchemaId)
						.map(cd => cd.credential_definition.tag)}
					{#if existingTags.length > 0}
						<p class="text-xs text-yellow-600 dark:text-yellow-400">
							⚠️ Existing tags for this schema: {existingTags.join(', ')}
						</p>
					{/if}
				{/if}
			</div>

			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="revocation"
					bind:checked={supportRevocation}
					disabled={creating}
					class="h-4 w-4 rounded border-gray-300"
				/>
				<Label for="revocation" class="cursor-pointer">
					Support Revocation
				</Label>
			</div>
			<p class="text-xs text-gray-500">
				Enable if you want to be able to revoke credentials issued with this definition
			</p>

			{#if error}
				<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
					{error}
				</div>
			{/if}

			<div class="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
				<strong>⚠️ Important:</strong> Credential definitions are immutable once created. Make sure all information is correct.
			</div>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={() => showCreateDialog = false} disabled={creating}>
					Cancel
				</Button>
				<Button type="submit" disabled={creating}>
					{creating ? 'Creating...' : 'Create Credential Definition'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

<!-- Credential Definition Details Dialog -->
{#if selectedCredDef}
	<Dialog open={showDetailsDialog} onOpenChange={(open) => showDetailsDialog = open}>
		<DialogContent class="max-w-2xl">
			{@const schema = getSchemaForCredDef(selectedCredDef.credential_definition_id, selectedCredDef.credential_definition.schemaId)}
			<DialogHeader>
				<DialogTitle>{schema?.schema.name || 'Unknown Schema'}</DialogTitle>
				<DialogDescription>Credential definition details</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div>
					<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Credential Definition ID</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
							{selectedCredDef.credential_definition_id}
						</code>
						<Button size="sm" variant="outline" onclick={() => copyToClipboard(selectedCredDef!.credential_definition_id)}>
							📋 Copy
						</Button>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Tag</p>
						<Badge variant="outline">{selectedCredDef.credential_definition.tag}</Badge>
					</div>
					<div>
						<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Type</p>
						<Badge variant="secondary">{selectedCredDef.credential_definition.type || 'CL'}</Badge>
					</div>
				</div>

				<div>
					<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Schema ID</p>
					<code class="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
						{selectedCredDef.credential_definition.schemaId}
					</code>
				</div>

				<div>
					<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Issuer ID</p>
					<code class="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
						{selectedCredDef.credential_definition.issuerId}
					</code>
				</div>

				<div class="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
					<p class="font-medium text-blue-900 dark:text-blue-100">💡 Next Steps:</p>
					<ul class="mt-2 list-inside list-disc space-y-1 text-blue-800 dark:text-blue-200">
						<li>Use this credential definition to issue credentials</li>
						<li>Share the cred def ID with verifiers if needed</li>
					</ul>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
