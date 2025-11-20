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

	interface Schema {
		schema_id: string;
		schema: {
			name: string;
			version: string;
			attrNames: string[];
		};
	}

	interface SchemasResponse {
		schema_ids: string[];
	}

	let schemas = $state<Schema[]>([]);
	let loading = $state(true);
	let showCreateDialog = $state(false);
	let creating = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let publicDid = $state<string | null>(null);

	// Create schema form
	let schemaName = $state('');
	let schemaVersion = $state('1.0');
	let attributes = $state<string[]>(['']);

	// Schema details
	let selectedSchema = $state<Schema | null>(null);
	let showDetailsDialog = $state(false);

	onMount(async () => {
		await loadPublicDid();
		await loadSchemas();
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
				console.log('Public DID found:', publicDid);
			} else {
				console.warn('No public DID found');
			}
		} catch (err) {
			console.error('Failed to load public DID:', err);
		}
	}

	async function loadSchemas() {
		if (!authStore.token) return;

		loading = true;
		error = '';
		try {
			const response = await acapyClient.getSchemas(authStore.token) as SchemasResponse;
			console.log('Schemas response:', response);

			// Get details for each schema
			if (response.schema_ids && response.schema_ids.length > 0) {
				const schemaDetails = await Promise.all(
					response.schema_ids.map(async (schemaId) => {
						try {
							const details = await acapyClient.getSchemaById(authStore.token, schemaId);
							return details;
						} catch (err) {
							console.error(`Failed to load schema ${schemaId}:`, err);
							return null;
						}
					})
				);
				schemas = schemaDetails.filter(s => s !== null) as Schema[];
			} else {
				schemas = [];
			}

			console.log('Schemas loaded:', schemas);
		} catch (err: any) {
			console.error('Failed to load schemas:', err);
			error = 'Failed to load schemas';
			toast.error('Failed to load schemas', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loading = false;
		}
	}

	async function createSchema() {
		if (!authStore.token) return;

		// Check if public DID exists
		if (!publicDid) {
			error = 'You need a public DID to create schemas. Please create and set a public DID first.';
			toast.error('Public DID required', {
				description: 'Go to Wallet page to create and set a public DID'
			});
			return;
		}

		// Validation
		if (!schemaName.trim()) {
			error = 'Schema name is required';
			return;
		}

		if (!schemaVersion.trim()) {
			error = 'Schema version is required';
			return;
		}

		// Filter empty attributes
		const validAttributes = attributes.filter(attr => attr.trim() !== '');
		if (validAttributes.length === 0) {
			error = 'At least one attribute is required';
			return;
		}

		creating = true;
		error = '';
		try {
			const requestBody = {
				schema: {
					issuerId: publicDid,
					name: schemaName.trim(),
					version: schemaVersion.trim(),
					attrNames: validAttributes.map(attr => attr.trim())
				}
			};

			console.log('Creating schema with:', requestBody);
			const result = await acapyClient.createSchema(authStore.token, requestBody);
			console.log('Schema created:', result);

			showCreateDialog = false;
			schemaName = '';
			schemaVersion = '1.0';
			attributes = [''];

			toast.success('Schema created successfully!', {
				description: `${requestBody.schema_name} v${requestBody.schema_version}`
			});

			await loadSchemas();
		} catch (err: any) {
			console.error('Failed to create schema:', err);
			error = err.message || 'Failed to create schema';
			toast.error('Failed to create schema', {
				description: err.message || 'Unknown error'
			});
		} finally {
			creating = false;
		}
	}

	function addAttribute() {
		attributes = [...attributes, ''];
	}

	function removeAttribute(index: number) {
		if (attributes.length > 1) {
			attributes = attributes.filter((_, i) => i !== index);
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard!');
	}

	function viewSchemaDetails(schema: Schema) {
		selectedSchema = schema;
		showDetailsDialog = true;
	}

	function matchesSearch(schema: Schema): boolean {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			schema.schema.name.toLowerCase().includes(query) ||
			schema.schema_id.toLowerCase().includes(query) ||
			schema.schema.version.includes(query)
		);
	}

	let filteredSchemas = $derived(schemas.filter(matchesSearch));

</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Schemas</h1>
			<p class="text-gray-500 dark:text-gray-400">Define credential schemas for your organization</p>
		</div>
		<Button onclick={() => showCreateDialog = true}>
			➕ Create Schema
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
							You need a public DID to create schemas. A public DID is registered on the ledger and allows you to create schemas and credential definitions.
						</p>
						<Button onclick={() => window.location.href = '/dashboard/wallet'}>
							Go to Wallet & DIDs
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
					placeholder="Search schemas by name, ID, or version..."
					bind:value={searchQuery}
					class="flex-1"
				/>
				<Button variant="outline" onclick={() => searchQuery = ''}>
					Clear
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Schemas List -->
	<Card>
		<CardHeader>
			<CardTitle>All Schemas ({filteredSchemas.length})</CardTitle>
			<CardDescription>List of all credential schemas</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading schemas...</div>
			{:else if filteredSchemas.length === 0}
				<div class="py-8 text-center">
					{#if searchQuery.trim()}
						<p class="text-gray-500">No schemas found matching "{searchQuery}"</p>
						<Button variant="link" onclick={() => searchQuery = ''}>Clear search</Button>
					{:else}
						<p class="text-gray-500">No schemas yet</p>
						<p class="mt-2 text-sm text-gray-400">Create your first schema to get started</p>
						<Button class="mt-4" onclick={() => showCreateDialog = true}>
							Create Schema
						</Button>
					{/if}
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredSchemas as schema}
						<div class="rounded-lg border p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-2">
									<div>
										<div class="mb-1 flex items-center gap-2">
											<h3 class="font-semibold">{schema.schema.name}</h3>
											<Badge variant="outline">v{schema.schema.version}</Badge>
											<Badge variant="secondary" class="text-xs">
												{schema.schema.attrNames.length} attributes
											</Badge>
										</div>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											ID: {schema.schema_id.substring(0, 50)}...
										</p>
									</div>

									<div class="flex flex-wrap gap-1">
										{#each schema.schema.attrNames as attr}
											<Badge variant="outline" class="text-xs">{attr}</Badge>
										{/each}
									</div>
								</div>

								<div class="flex gap-2">
									<Button size="sm" variant="outline" onclick={() => viewSchemaDetails(schema)}>
										👁️ View
									</Button>
									<Button size="sm" variant="outline" onclick={() => copyToClipboard(schema.schema_id)}>
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
				💡 About Schemas
			</h3>
			<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
				<li>✓ <strong>Schema</strong> defines the structure of a credential</li>
				<li>✓ <strong>Attributes</strong> are the fields that will be in the credential</li>
				<li>✓ You need a <strong>public DID</strong> to create schemas</li>
				<li>✓ Schemas are <strong>immutable</strong> once created on the ledger</li>
				<li>✓ Use <strong>semantic versioning</strong> (1.0, 1.1, 2.0, etc.)</li>
			</ul>
		</CardContent>
	</Card>
</div>

<!-- Create Schema Dialog -->
<Dialog open={showCreateDialog} onOpenChange={(open) => showCreateDialog = open}>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>Create New Schema</DialogTitle>
			<DialogDescription>Define a new credential schema with attributes</DialogDescription>
		</DialogHeader>

		<form onsubmit={(e) => { e.preventDefault(); createSchema(); }} class="space-y-4">
			<div class="space-y-2">
				<Label for="schemaName">Schema Name *</Label>
				<Input
					id="schemaName"
					type="text"
					placeholder="e.g., Driver License, University Degree"
					bind:value={schemaName}
					disabled={creating}
					required
				/>
				<p class="text-xs text-gray-500">A descriptive name for your credential type</p>
			</div>

			<div class="space-y-2">
				<Label for="schemaVersion">Version *</Label>
				<Input
					id="schemaVersion"
					type="text"
					placeholder="1.0"
					bind:value={schemaVersion}
					disabled={creating}
					required
				/>
				<p class="text-xs text-gray-500">Use semantic versioning (e.g., 1.0, 1.1, 2.0)</p>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label>Attributes *</Label>
					<Button type="button" size="sm" variant="outline" onclick={addAttribute} disabled={creating}>
						➕ Add Attribute
					</Button>
				</div>
				
				<div class="space-y-2">
					{#each attributes as attribute, index}
						<div class="flex gap-2">
							<Input
								type="text"
								placeholder="e.g., name, date_of_birth, license_number"
								bind:value={attributes[index]}
								disabled={creating}
								class="flex-1"
							/>
							{#if attributes.length > 1}
								<Button
									type="button"
									size="sm"
									variant="outline"
									onclick={() => removeAttribute(index)}
									disabled={creating}
								>
									🗑️
								</Button>
							{/if}
						</div>
					{/each}
				</div>
				<p class="text-xs text-gray-500">
					Define the fields that will be included in credentials of this type
				</p>
			</div>

			{#if error}
				<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
					{error}
				</div>
			{/if}

			<div class="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
				<strong>⚠️ Important:</strong> Schemas are immutable once created. Make sure all information is correct before creating.
			</div>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={() => showCreateDialog = false} disabled={creating}>
					Cancel
				</Button>
				<Button type="submit" disabled={creating}>
					{creating ? 'Creating...' : 'Create Schema'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

<!-- Schema Details Dialog -->
{#if selectedSchema}
	<Dialog open={showDetailsDialog} onOpenChange={(open) => showDetailsDialog = open}>
		<DialogContent class="max-w-2xl">
			<DialogHeader>
				<DialogTitle>{selectedSchema.schema.name}</DialogTitle>
				<DialogDescription>Schema details and attributes</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div>
					<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Schema ID</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
							{selectedSchema.schema_id}
						</code>
						<Button size="sm" variant="outline" onclick={() => copyToClipboard(selectedSchema!.schema_id)}>
							📋 Copy
						</Button>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
						<p class="font-medium">{selectedSchema.schema.name}</p>
					</div>
					<div>
						<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Version</p>
						<Badge variant="outline">{selectedSchema.schema.version}</Badge>
					</div>
				</div>

				<div>
					<p class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
						Attributes ({selectedSchema.schema.attrNames.length})
					</p>
					<div class="flex flex-wrap gap-2">
						{#each selectedSchema.schema.attrNames as attr}
							<Badge variant="secondary">{attr}</Badge>
						{/each}
					</div>
				</div>

				<div class="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
					<p class="font-medium text-blue-900 dark:text-blue-100">💡 Next Steps:</p>
					<ul class="mt-2 list-inside list-disc space-y-1 text-blue-800 dark:text-blue-200">
						<li>Create a credential definition using this schema</li>
						<li>Issue credentials based on this schema structure</li>
					</ul>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
