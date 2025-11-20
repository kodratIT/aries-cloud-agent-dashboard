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

	interface PresentationRecord {
		pres_ex_id: string;
		state: string;
		connection_id?: string;
		created_at?: string;
		updated_at?: string;
		verified?: string;
		[key: string]: any;
	}

	interface Connection {
		connection_id: string;
		their_label?: string;
		state: string;
	}

	interface CredDef {
		credential_definition_id: string;
		credential_definition: {
			issuerId: string;
			schemaId: string;
			tag: string;
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

	let presentations = $state<PresentationRecord[]>([]);
	let connections = $state<Connection[]>([]);
	let credDefs = $state<CredDef[]>([]);
	let schemas = $state<Schema[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');

	// Create proof request dialog
	let showCreateDialog = $state(false);
	let creating = $state(false);
	let selectedConnectionId = $state('');
	let selectedCredDefId = $state('');
	let selectedAttributes = $state<string[]>([]);
	let proofRequestName = $state('');
	let proofRequestComment = $state('');

	// Details dialog
	let selectedPresentation = $state<PresentationRecord | null>(null);
	let showDetailsDialog = $state(false);
	let presentationDetail = $state<any>(null);
	let loadingDetail = $state(false);

	// Verified data dialog
	let showVerifiedDataDialog = $state(false);
	let verifiedData = $state<any>(null);

	// Actions
	let verifyingPresId = $state<string | null>(null);
	let deletingPresId = $state<string | null>(null);

	// Filters
	let stateFilter = $state<string>('all');

	onMount(async () => {
		await Promise.all([
			loadPresentations(),
			loadConnections(),
			loadCredDefs(),
			loadSchemas()
		]);
	});

	async function loadPresentations() {
		if (!authStore.token) return;

		loading = true;
		error = '';
		try {
			const response = await acapyClient.getPresentations(authStore.token) as any;
			console.log('📊 ===== PRESENTATIONS RESPONSE =====');
			console.log('Raw response:', response);
			console.log('Response keys:', Object.keys(response));
			console.log('Results count:', response.results?.length || 0);
			
			// Extract pres_ex_record if nested
			const rawResults = response.results || [];
			console.log('📋 Raw results sample (first item):', rawResults[0]);
			
			presentations = rawResults.map((item: any) => {
				if (item.pres_ex_record) {
					return item.pres_ex_record;
				}
				return item;
			});

			console.log('✅ Loaded presentations:', presentations.length);
			console.log('📝 Presentations data structure:');
			
			// Use plain array to avoid $state proxy warning
			const presentationsSnapshot = [...presentations];
			presentationsSnapshot.forEach((pres, index) => {
				console.log(`\n--- Presentation ${index + 1} ---`);
				console.log('ID:', pres.pres_ex_id);
				console.log('State:', pres.state);
				console.log('Verified:', pres.verified);
				console.log('Connection ID:', pres.connection_id);
				console.log('Created at:', pres.created_at);
				console.log('Updated at:', pres.updated_at);
				console.log('All keys:', Object.keys(pres));
				console.log('Full data:', JSON.parse(JSON.stringify(pres)));
				
				// Check for presentation data
				if (pres.presentation) {
					console.log('  📄 Presentation data exists');
					console.log('  Presentation keys:', Object.keys(pres.presentation));
					console.log('  Presentation:', JSON.parse(JSON.stringify(pres.presentation)));
				}
				
				// Check for revealed attributes
				if (pres.by_format) {
					console.log('  🔍 by_format exists');
					console.log('  by_format:', JSON.parse(JSON.stringify(pres.by_format)));
				}
				
				// Check for verification result
				if (pres.verified) {
					console.log('  ✅ VERIFIED:', pres.verified);
				}
			});
		} catch (err: any) {
			console.error('Failed to load presentations:', err);
			error = 'Failed to load presentations';
			toast.error('Failed to load presentations', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loading = false;
		}
	}

	async function loadConnections() {
		if (!authStore.token) return;

		try {
			const response = await acapyClient.getConnections(authStore.token) as any;
			connections = (response.results || []).filter((c: Connection) => c.state === 'active');
		} catch (err) {
			console.error('Failed to load connections:', err);
		}
	}

	async function loadCredDefs() {
		if (!authStore.token) return;

		try {
			const response = await acapyClient.getCredentialDefinitions(authStore.token) as any;
			
			if (response.credential_definition_ids && response.credential_definition_ids.length > 0) {
				const credDefDetails = await Promise.all(
					response.credential_definition_ids.map(async (credDefId: string) => {
						try {
							return await acapyClient.getCredDefById(authStore.token, credDefId);
						} catch (err) {
							return null;
						}
					})
				);
				credDefs = credDefDetails.filter(c => c !== null) as CredDef[];
			}
		} catch (err) {
			console.error('Failed to load credential definitions:', err);
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

	function openCreateDialog() {
		selectedConnectionId = '';
		selectedCredDefId = '';
		selectedAttributes = [];
		proofRequestName = 'Proof Request';
		proofRequestComment = '';
		error = '';
		showCreateDialog = true;
	}

	function onCredDefChange() {
		// Reset selected attributes when cred def changes
		selectedAttributes = [];
	}

	function getSchemaForCredDef(credDefId: string): Schema | null {
		const credDef = credDefs.find(c => c.credential_definition_id === credDefId);
		if (!credDef) return null;

		const credDefData = credDef.credential_definition as any;
		let schemaId = credDefData?.schemaId || credDefData?.schema_id;

		// If schemaId is just a sequence number, find by issuer
		if (schemaId && !schemaId.includes(':')) {
			const credDefParts = credDefId.split(':');
			if (credDefParts.length >= 1) {
				const issuer = credDefParts[0];
				const matchingSchemas = schemas.filter(s => s.schema_id.startsWith(issuer));
				if (matchingSchemas.length > 0) {
					return matchingSchemas[0];
				}
			}
		}

		return schemas.find(s => s.schema_id === schemaId) || null;
	}

	async function sendProofRequest() {
		if (!authStore.token) return;

		// Validation
		if (!selectedConnectionId) {
			error = 'Please select a connection';
			return;
		}

		if (!selectedCredDefId) {
			error = 'Please select a credential definition';
			return;
		}

		if (selectedAttributes.length === 0) {
			error = 'Please select at least one attribute';
			return;
		}

		creating = true;
		error = '';
		try {
			// Build requested_attributes
			const requested_attributes: Record<string, any> = {};
			selectedAttributes.forEach((attr, index) => {
				requested_attributes[`attr${index}_referent`] = {
					name: attr,
					restrictions: [
						{
							cred_def_id: selectedCredDefId
						}
					]
				};
			});

			const requestBody = {
				connection_id: selectedConnectionId,
				comment: proofRequestComment || 'Please provide the requested credentials',
				presentation_request: {
					anoncreds: {
						name: proofRequestName || 'Proof Request',
						version: '1.0',
						requested_attributes,
						requested_predicates: {}
					}
				}
			};

			console.log('Sending proof request:', requestBody);
			const result = await acapyClient.sendProofRequest(authStore.token, requestBody);
			console.log('Proof request sent:', result);

			showCreateDialog = false;
			toast.success('Proof request sent successfully!');
			await loadPresentations();
		} catch (err: any) {
			console.error('Failed to send proof request:', err);
			error = err.message || 'Failed to send proof request';
			toast.error('Failed to send proof request', {
				description: err.message || 'Unknown error'
			});
		} finally {
			creating = false;
		}
	}

	async function viewPresentationDetails(presentation: PresentationRecord) {
		selectedPresentation = presentation;
		showDetailsDialog = true;
		loadingDetail = true;

		try {
			presentationDetail = await acapyClient.getPresentationDetails(
				presentation.pres_ex_id,
				authStore.token!
			);
			console.log('🔍 ===== PRESENTATION DETAIL =====');
			console.log('Presentation ID:', presentation.pres_ex_id);
			console.log('Detail response:', presentationDetail);
			console.log('Detail keys:', Object.keys(presentationDetail || {}));
			
			// Check multiple possible paths for presentation data
			const presData = presentationDetail?.presentation || presentationDetail?.pres;
			
			if (presData) {
				console.log('\n📄 PRESENTATION DATA FOUND');
				console.log('Path:', presentationDetail?.presentation ? 'presentationDetail.presentation' : 'presentationDetail.pres');
				console.log('Keys:', Object.keys(presData));
				console.log('Full data:', JSON.parse(JSON.stringify(presData)));
				
				if (presData.requested_proof) {
					console.log('\n🔓 REQUESTED_PROOF FOUND:');
					console.log('Keys:', Object.keys(presData.requested_proof));
					
					if (presData.requested_proof.revealed_attrs) {
						console.log('\n✨ REVEALED_ATTRS:');
						console.log('Count:', Object.keys(presData.requested_proof.revealed_attrs).length);
						Object.entries(presData.requested_proof.revealed_attrs).forEach(([key, value]: [string, any]) => {
							console.log(`\n  Attribute: ${key}`);
							console.log('  Value:', value);
							if (typeof value === 'object') {
								if (value.raw) console.log(`  → Raw: ${value.raw}`);
								if (value.encoded) console.log(`  → Encoded: ${value.encoded}`);
							}
						});
					}
					
					if (presData.requested_proof.revealed_attr_groups) {
						console.log('\n👥 REVEALED_ATTR_GROUPS:');
						console.log('Count:', Object.keys(presData.requested_proof.revealed_attr_groups).length);
						Object.entries(presData.requested_proof.revealed_attr_groups).forEach(([groupKey, group]: [string, any]) => {
							console.log(`\n  Group: ${groupKey}`);
							console.log('  Group data:', group);
							if (group.values) {
								console.log('  Values:');
								Object.entries(group.values).forEach(([attrName, attrValue]: [string, any]) => {
									console.log(`    ${attrName}: ${attrValue}`);
								});
							}
						});
					}
				}
			} else {
				console.log('❌ No presentation data found in response');
			}
			
			// Log by_format data
			if (presentationDetail?.by_format) {
				console.log('\n📋 BY_FORMAT:');
				console.log('Keys:', Object.keys(presentationDetail.by_format));
				console.log('Data:', JSON.parse(JSON.stringify(presentationDetail.by_format)));
			}
			
			// Log verification status
			console.log('\n✅ VERIFICATION STATUS:');
			console.log('Verified:', presentationDetail?.verified);
			console.log('State:', presentationDetail?.state);
		} catch (err: any) {
			console.error('Failed to load presentation details:', err);
			toast.error('Failed to load presentation details', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loadingDetail = false;
		}
	}

	async function verifyPresentation(presExId: string) {
		verifyingPresId = presExId;
		try {
			console.log('🔐 ===== VERIFYING PRESENTATION =====');
			console.log('Presentation ID:', presExId);
			
			const verifyResult = await acapyClient.verifyPresentation(presExId, authStore.token!);
			
			console.log('✅ Verify result:', verifyResult);
			console.log('Verify result keys:', Object.keys(verifyResult || {}));
			
			// Log detailed structure
			console.log('\n📦 DETAILED STRUCTURE:');
			console.log('State:', verifyResult.state);
			console.log('Verified:', verifyResult.verified);
			
			if (verifyResult.pres) {
				console.log('\n📄 PRES object:');
				console.log('pres keys:', Object.keys(verifyResult.pres));
				console.log('pres:', JSON.parse(JSON.stringify(verifyResult.pres)));
				
				// Check if data is in presentations~attach (base64 encoded)
				const presAttach = verifyResult.pres['presentations~attach'];
				if (presAttach && presAttach[0]?.data?.base64) {
					console.log('\n📦 DECODING presentations~attach:');
					try {
						const decoded = atob(presAttach[0].data.base64);
						const presData = JSON.parse(decoded);
						console.log('Decoded presentation data:', presData);
						
						if (presData.requested_proof) {
							console.log('\n🔓 REQUESTED_PROOF (from decoded):');
							console.log('requested_proof:', presData.requested_proof);
							
							if (presData.requested_proof.revealed_attrs) {
								console.log('\n✨ REVEALED_ATTRS:');
								Object.entries(presData.requested_proof.revealed_attrs).forEach(([key, value]: [string, any]) => {
									console.log(`  ${key}:`, value);
									if (value.raw) console.log(`    → raw: ${value.raw}`);
									if (value.encoded) console.log(`    → encoded: ${value.encoded}`);
								});
							}
						}
					} catch (err) {
						console.error('Failed to decode presentation:', err);
					}
				}
				
				// Also check direct path
				if (verifyResult.pres.requested_proof) {
					console.log('\n🔓 REQUESTED_PROOF (direct):');
					console.log('requested_proof:', JSON.parse(JSON.stringify(verifyResult.pres.requested_proof)));
					
					if (verifyResult.pres.requested_proof.revealed_attrs) {
						console.log('\n✨ REVEALED_ATTRS:');
						Object.entries(verifyResult.pres.requested_proof.revealed_attrs).forEach(([key, value]: [string, any]) => {
							console.log(`  ${key}:`, value);
							if (value.raw) console.log(`    → raw: ${value.raw}`);
							if (value.encoded) console.log(`    → encoded: ${value.encoded}`);
						});
					}
					
					if (verifyResult.pres.requested_proof.revealed_attr_groups) {
						console.log('\n👥 REVEALED_ATTR_GROUPS:');
						Object.entries(verifyResult.pres.requested_proof.revealed_attr_groups).forEach(([groupKey, group]: [string, any]) => {
							console.log(`  Group: ${groupKey}`);
							if (group.values) {
								console.log('  Values:', group.values);
								Object.entries(group.values).forEach(([attrName, attrValue]: [string, any]) => {
									console.log(`    ${attrName}: ${attrValue}`);
								});
							}
						});
					}
				}
			}
			
			if (verifyResult.by_format) {
				console.log('\n📋 BY_FORMAT:');
				console.log('by_format keys:', Object.keys(verifyResult.by_format));
				console.log('by_format:', JSON.parse(JSON.stringify(verifyResult.by_format)));
			}
			
			// Extract verified data for display
			let revealedAttrs = verifyResult.pres?.requested_proof?.revealed_attrs || 
								verifyResult.presentation?.requested_proof?.revealed_attrs;
			let revealedAttrGroups = verifyResult.pres?.requested_proof?.revealed_attr_groups || 
									 verifyResult.presentation?.requested_proof?.revealed_attr_groups;
			
			// If not found, try to decode from presentations~attach
			if (!revealedAttrs && verifyResult.pres?.['presentations~attach']?.[0]?.data?.base64) {
				try {
					const decoded = atob(verifyResult.pres['presentations~attach'][0].data.base64);
					const presData = JSON.parse(decoded);
					console.log('📦 Decoded presentation data for extraction:', presData);
					
					revealedAttrs = presData.requested_proof?.revealed_attrs;
					revealedAttrGroups = presData.requested_proof?.revealed_attr_groups;
				} catch (err) {
					console.error('Failed to decode presentation for extraction:', err);
				}
			}
			
			// Also check by_format.pres.anoncreds
			if (!revealedAttrs && verifyResult.by_format?.pres?.anoncreds) {
				console.log('📋 Trying by_format.pres.anoncreds');
				revealedAttrs = verifyResult.by_format.pres.anoncreds.requested_proof?.revealed_attrs;
				revealedAttrGroups = verifyResult.by_format.pres.anoncreds.requested_proof?.revealed_attr_groups;
			}
			
			console.log('\n💾 EXTRACTED DATA FOR DIALOG:');
			console.log('Revealed Attrs:', revealedAttrs);
			console.log('Revealed Attr Groups:', revealedAttrGroups);
			
			verifiedData = {
				presExId: presExId,
				verified: verifyResult.verified,
				state: verifyResult.state,
				connectionId: verifyResult.connection_id,
				pres: verifyResult.pres || verifyResult.presentation,
				revealedAttrs: revealedAttrs,
				revealedAttrGroups: revealedAttrGroups
			};
			
			console.log('Verified Data Object:', verifiedData);
			
			// Show verified data dialog
			showVerifiedDataDialog = true;
			console.log('✅ Dialog should open now');
			
			toast.success('Presentation verified successfully!');
			await loadPresentations();
			
			// Reload details if dialog is open
			if (selectedPresentation && selectedPresentation.pres_ex_id === presExId) {
				await viewPresentationDetails(selectedPresentation);
			}
			
			console.log('🔄 Presentations reloaded after verification');
		} catch (err: any) {
			console.error('Failed to verify presentation:', err);
			toast.error('Failed to verify presentation', {
				description: err.message || 'Unknown error'
			});
		} finally {
			verifyingPresId = null;
		}
	}

	async function deletePresentation(presExId: string) {
		deletingPresId = presExId;
		try {
			await acapyClient.deletePresentationRecord(presExId, authStore.token!);
			toast.success('Presentation record deleted');
			await loadPresentations();
		} catch (err: any) {
			console.error('Failed to delete presentation:', err);
			toast.error('Failed to delete presentation', {
				description: err.message || 'Unknown error'
			});
		} finally {
			deletingPresId = null;
		}
	}

	function getConnectionLabel(connectionId: string): string {
		const conn = connections.find(c => c.connection_id === connectionId);
		return conn?.their_label || 'Unknown';
	}

	function getStateColor(state: string): "default" | "secondary" | "destructive" | "outline" {
		const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			'verified': 'default',
			'done': 'default',
			'request-sent': 'secondary',
			'presentation-received': 'secondary',
			'abandoned': 'destructive',
			'error': 'destructive'
		};
		return colors[state] || 'outline';
	}

	let filteredPresentations = $derived.by(() => {
		let result = [...presentations]; // Create a copy to avoid mutation

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(p => 
				p.pres_ex_id.toLowerCase().includes(query) ||
				p.state.toLowerCase().includes(query) ||
				(p.connection_id && getConnectionLabel(p.connection_id).toLowerCase().includes(query))
			);
		}

		if (stateFilter !== 'all') {
			result = result.filter(p => p.state === stateFilter);
		}

		// Use toSorted() instead of sort() to avoid mutation
		return result.toSorted((a, b) => {
			const dateA = new Date(a.created_at || 0).getTime();
			const dateB = new Date(b.created_at || 0).getTime();
			return dateB - dateA;
		});
	});

	let selectedSchema = $derived.by(() => {
		if (!selectedCredDefId) return null;
		return getSchemaForCredDef(selectedCredDefId);
	});

</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Verifications</h1>
			<p class="text-gray-500 dark:text-gray-400">Request and verify credential proofs</p>
		</div>
		<Button 
			onclick={openCreateDialog} 
			disabled={connections.length === 0 || credDefs.length === 0}
		>
			➕ Request Proof
		</Button>
	</div>

	<!-- Statistics Dashboard -->
	{#if !loading && presentations.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold">{presentations.length}</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Total Requests</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
						{presentations.filter((p) => p.state === 'request-sent').length}
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Pending</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-500">
						{presentations.filter((p) => p.state === 'presentation-received').length}
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Received</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold text-green-600 dark:text-green-500">
						{presentations.filter((p) => p.state === 'verified' || p.state === 'done').length}
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Verified</p>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Prerequisites Check -->
	{#if connections.length === 0 && !loading}
		<Card class="border-2 border-yellow-200 dark:border-yellow-800">
			<CardContent class="py-6">
				<div class="flex items-start gap-4">
					<div class="text-4xl">🔗</div>
					<div class="flex-1">
						<h3 class="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
							Connection Required
						</h3>
						<p class="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
							You need an active connection to request proofs.
						</p>
						<Button onclick={() => window.location.href = '/dashboard/connections'}>
							Go to Connections
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	{:else if credDefs.length === 0 && !loading}
		<Card class="border-2 border-yellow-200 dark:border-yellow-800">
			<CardContent class="py-6">
				<div class="flex items-start gap-4">
					<div class="text-4xl">📝</div>
					<div class="flex-1">
						<h3 class="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
							Credential Definition Required
						</h3>
						<p class="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
							You need credential definitions to request proofs.
						</p>
						<Button onclick={() => window.location.href = '/dashboard/cred-defs'}>
							Go to Credential Definitions
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

	<!-- Filters -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex flex-wrap items-end gap-4">
				<div class="flex-1 min-w-[200px]">
					<Label>Search</Label>
					<Input type="text" placeholder="Search presentations..." bind:value={searchQuery} />
				</div>

				<div class="min-w-[180px]">
					<Label>State</Label>
					<select
						bind:value={stateFilter}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="all">All States</option>
						<option value="request-sent">Request Sent</option>
						<option value="presentation-received">Presentation Received</option>
						<option value="verified">Verified</option>
						<option value="done">Done</option>
					</select>
				</div>

				<Button variant="outline" onclick={() => { searchQuery = ''; stateFilter = 'all'; }}>
					Clear Filters
				</Button>
			</div>

			<div class="mt-3 text-sm text-gray-500 dark:text-gray-400">
				Showing {filteredPresentations.length} of {presentations.length} presentations
			</div>
		</CardContent>
	</Card>

	<!-- Presentations List -->
	<Card>
		<CardHeader>
			<CardTitle>Proof Requests ({filteredPresentations.length})</CardTitle>
			<CardDescription>List of all proof request records</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading presentations...</div>
			{:else if filteredPresentations.length === 0}
				<div class="py-8 text-center">
					{#if searchQuery.trim()}
						<p class="text-gray-500">No presentations found matching "{searchQuery}"</p>
						<Button variant="link" onclick={() => searchQuery = ''}>Clear search</Button>
					{:else}
						<p class="text-gray-500">No proof requests yet</p>
						<p class="mt-2 text-sm text-gray-400">Send your first proof request to get started</p>
						{#if connections.length > 0 && credDefs.length > 0}
							<Button class="mt-4" onclick={openCreateDialog}>
								Request Proof
							</Button>
						{/if}
					{/if}
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredPresentations as presentation}
						<div class="rounded-lg border p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-2">
									<div>
										<div class="mb-1 flex items-center gap-2">
											<h3 class="font-semibold">
												{presentation.connection_id ? getConnectionLabel(presentation.connection_id) : 'Unknown'}
											</h3>
											<Badge variant={getStateColor(presentation.state || 'unknown')}>
												{presentation.state || 'unknown'}
											</Badge>
											{#if presentation.verified === 'true'}
												<Badge variant="default">✓ Verified</Badge>
											{/if}
										</div>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											ID: {presentation.pres_ex_id}
										</p>
									</div>

									{#if presentation.created_at}
										<Badge variant="secondary" class="text-xs">
											{new Date(presentation.created_at).toLocaleString()}
										</Badge>
									{/if}
								</div>

								<div class="flex gap-2">
									<Button size="sm" variant="outline" onclick={() => viewPresentationDetails(presentation)}>
										👁️ View
									</Button>
									
									{#if presentation.state === 'presentation-received' && presentation.verified !== 'true'}
										<Button
											size="sm"
											onclick={() => verifyPresentation(presentation.pres_ex_id)}
											disabled={verifyingPresId === presentation.pres_ex_id}
										>
											{verifyingPresId === presentation.pres_ex_id ? 'Verifying...' : '✓ Verify'}
										</Button>
									{/if}
									
									<Button
										size="sm"
										variant="outline"
										onclick={() => deletePresentation(presentation.pres_ex_id)}
										disabled={deletingPresId === presentation.pres_ex_id}
									>
										{deletingPresId === presentation.pres_ex_id ? 'Deleting...' : '🗑️'}
									</Button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Create Proof Request Dialog -->
<Dialog open={showCreateDialog} onOpenChange={(open) => showCreateDialog = open}>
	<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Request Proof</DialogTitle>
			<DialogDescription>Request credential proof from a holder</DialogDescription>
		</DialogHeader>

		<form onsubmit={(e) => { e.preventDefault(); sendProofRequest(); }} class="space-y-4">
			<div class="space-y-2">
				<Label for="connection">Connection (Holder) *</Label>
				<select
					id="connection"
					bind:value={selectedConnectionId}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={creating}
					required
				>
					<option value="">Select a connection...</option>
					{#each connections as connection}
						<option value={connection.connection_id}>
							{connection.their_label || connection.connection_id}
						</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<Label for="credDef">Credential Definition *</Label>
				<select
					id="credDef"
					bind:value={selectedCredDefId}
					onchange={onCredDefChange}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={creating}
					required
				>
					<option value="">Select a credential definition...</option>
					{#each credDefs as credDef}
						{@const schema = getSchemaForCredDef(credDef.credential_definition_id)}
						<option value={credDef.credential_definition_id}>
							{schema?.schema.name || 'Unknown'} ({credDef.credential_definition.tag})
						</option>
					{/each}
				</select>
			</div>

			{#if selectedSchema}
				<div class="space-y-2 rounded-lg border p-4">
					<Label>Select Attributes to Request *</Label>
					<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
						Choose which attributes you want the holder to prove
					</p>
					<div class="space-y-2">
						{#each selectedSchema.schema.attrNames as attr}
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									value={attr}
									checked={selectedAttributes.includes(attr)}
									onchange={(e) => {
										if (e.currentTarget.checked) {
											selectedAttributes = [...selectedAttributes, attr];
										} else {
											selectedAttributes = selectedAttributes.filter(a => a !== attr);
										}
									}}
									class="h-4 w-4 rounded border-gray-300"
									disabled={creating}
								/>
								<span class="text-sm">{attr}</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="name">Request Name</Label>
				<Input
					id="name"
					type="text"
					placeholder="Proof Request"
					bind:value={proofRequestName}
					disabled={creating}
				/>
			</div>

			<div class="space-y-2">
				<Label for="comment">Comment (Optional)</Label>
				<Input
					id="comment"
					type="text"
					placeholder="Please provide the requested credentials"
					bind:value={proofRequestComment}
					disabled={creating}
				/>
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
				<Button type="submit" disabled={creating || !selectedConnectionId || !selectedCredDefId || selectedAttributes.length === 0}>
					{creating ? 'Sending...' : 'Send Proof Request'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

<!-- Presentation Details Dialog -->
{#if selectedPresentation}
	<Dialog open={showDetailsDialog} onOpenChange={(open) => showDetailsDialog = open}>
		<DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Presentation Details</DialogTitle>
				<DialogDescription>
					{selectedPresentation.connection_id ? getConnectionLabel(selectedPresentation.connection_id) : 'Unknown'}
				</DialogDescription>
			</DialogHeader>

			{#if loadingDetail}
				<div class="py-8 text-center text-gray-500 dark:text-gray-400">Loading details...</div>
			{:else if presentationDetail}
				<div class="space-y-4">
					<!-- Metadata -->
					<div class="rounded-lg border p-4">
						<h3 class="mb-3 font-semibold">Metadata</h3>
						<div class="space-y-2 text-sm">
							<div>
								<span class="font-medium">ID:</span>
								<code class="ml-2 text-xs">{presentationDetail.pres_ex_id}</code>
							</div>
							<div>
								<span class="font-medium">State:</span>
								<Badge class="ml-2" variant={getStateColor(presentationDetail.state)}>
									{presentationDetail.state}
								</Badge>
							</div>
							{#if presentationDetail.verified}
								<div>
									<span class="font-medium">Verified:</span>
									<Badge class="ml-2" variant={presentationDetail.verified === 'true' ? 'default' : 'destructive'}>
										{presentationDetail.verified === 'true' ? '✓ Yes' : '✗ No'}
									</Badge>
								</div>
							{/if}
							<div>
								<span class="font-medium">Created:</span>
								<span class="ml-2">{new Date(presentationDetail.created_at).toLocaleString()}</span>
							</div>
						</div>
					</div>

					<!-- Presentation Data -->
					{#if presentationDetail.presentation?.requested_proof || presentationDetail.pres?.requested_proof}
						{@const requestedProof = presentationDetail.presentation?.requested_proof || presentationDetail.pres?.requested_proof}
						<div class="rounded-lg border p-4">
							<h3 class="mb-3 font-semibold">Revealed Attributes</h3>
							
							{#if requestedProof.revealed_attrs && Object.keys(requestedProof.revealed_attrs).length > 0}
								<div class="space-y-2">
									{#each Object.entries(requestedProof.revealed_attrs) as [key, value]}
										<div class="flex justify-between border-b py-2 last:border-b-0">
											<span class="font-medium">{key}:</span>
											<span class="text-right">{typeof value === 'object' ? value.raw : value}</span>
										</div>
									{/each}
								</div>
							{:else if requestedProof.revealed_attr_groups && Object.keys(requestedProof.revealed_attr_groups).length > 0}
								<div class="space-y-2">
									{#each Object.entries(requestedProof.revealed_attr_groups) as [groupKey, group]}
										<div class="mb-4">
											<p class="text-xs text-muted-foreground mb-2">Group: {groupKey}</p>
											{#if group.values}
												{#each Object.entries(group.values) as [attrName, attrValue]}
													<div class="flex justify-between border-b py-2 last:border-b-0">
														<span class="font-medium">{attrName}:</span>
														<span class="text-right">{typeof attrValue === 'object' ? attrValue.raw : attrValue}</span>
													</div>
												{/each}
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">No revealed attributes found</p>
							{/if}
						</div>
					{:else}
						<div class="rounded-lg border p-4">
							<h3 class="mb-3 font-semibold">Presentation Data</h3>
							<p class="text-sm text-muted-foreground">No presentation data available yet</p>
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-gray-500">No details available</p>
			{/if}
		</DialogContent>
	</Dialog>
{/if}

<!-- Verified Data Dialog -->
<Dialog open={showVerifiedDataDialog} onOpenChange={(open) => showVerifiedDataDialog = open}>
	<DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>✅ Verification Successful!</DialogTitle>
			<DialogDescription>
				The presentation has been verified. Here are the revealed attributes:
			</DialogDescription>
		</DialogHeader>

		{#if verifiedData}
			<div class="space-y-4">
				<!-- Verification Status -->
				<div class="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-2xl">✅</span>
						<h3 class="font-semibold text-green-900 dark:text-green-100">Verification Status</h3>
					</div>
					<div class="space-y-1 text-sm">
						<p><strong>Verified:</strong> <Badge variant="default" class="bg-green-600">{verifiedData.verified === 'true' ? 'Yes' : 'No'}</Badge></p>
						<p><strong>State:</strong> <Badge>{verifiedData.state}</Badge></p>
						{#if verifiedData.connectionId}
							<p><strong>Connection:</strong> {getConnectionLabel(verifiedData.connectionId)}</p>
						{/if}
					</div>
				</div>

				<!-- Revealed Attributes -->
				{#if verifiedData.revealedAttrs && Object.keys(verifiedData.revealedAttrs).length > 0}
					<div class="rounded-lg border p-4">
						<h3 class="font-semibold mb-3 flex items-center gap-2">
							<span>🔓</span>
							Revealed Attributes
							<Badge variant="secondary">{Object.keys(verifiedData.revealedAttrs).length}</Badge>
						</h3>
						<div class="space-y-2">
							{#each Object.entries(verifiedData.revealedAttrs) as [key, value]}
								{@const attrData = typeof value === 'object' ? value : { raw: value }}
								{@const attrName = key.replace(/attr\d+_referent/gi, '').replace(/_/g, ' ').trim() || 'Attribute'}
								<div class="flex justify-between items-start gap-4 border-b py-3 last:border-b-0">
									<div class="flex-1">
										<p class="font-medium text-sm capitalize">{attrName}</p>
										{#if attrData.sub_proof_index !== undefined}
											<p class="text-xs text-muted-foreground">Proof Index: {attrData.sub_proof_index}</p>
										{/if}
									</div>
									<div class="text-right">
										<p class="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded">
											{attrData.raw}
										</p>
										{#if attrData.encoded}
											<p class="text-xs text-muted-foreground mt-1">
												Hash: {attrData.encoded.substring(0, 20)}...
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Revealed Attribute Groups -->
				{#if verifiedData.revealedAttrGroups && Object.keys(verifiedData.revealedAttrGroups).length > 0}
					<div class="rounded-lg border p-4">
						<h3 class="font-semibold mb-3 flex items-center gap-2">
							<span>👥</span>
							Revealed Attribute Groups
						</h3>
						{#each Object.entries(verifiedData.revealedAttrGroups) as [groupKey, group]}
							<div class="mb-4 last:mb-0">
								<p class="text-xs text-muted-foreground mb-2 font-semibold uppercase">{groupKey}</p>
								{#if group.values}
									<div class="space-y-2 pl-4">
										{#each Object.entries(group.values) as [attrName, attrValue]}
											<div class="flex justify-between items-center border-b py-2 last:border-b-0">
												<span class="font-medium text-sm">{attrName.replace(/_/g, ' ')}:</span>
												<span class="text-right font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
													{attrValue}
												</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<!-- No Data Message -->
				{#if (!verifiedData.revealedAttrs || Object.keys(verifiedData.revealedAttrs).length === 0) && 
					 (!verifiedData.revealedAttrGroups || Object.keys(verifiedData.revealedAttrGroups).length === 0)}
					<div class="rounded-lg border p-4 text-center">
						<p class="text-sm text-muted-foreground">No revealed attributes found in this presentation</p>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex gap-2 justify-end">
					<Button variant="outline" onclick={() => showVerifiedDataDialog = false}>
						Close
					</Button>
					<Button onclick={() => {
						showVerifiedDataDialog = false;
						if (verifiedData.presExId) {
							const pres = presentations.find(p => p.pres_ex_id === verifiedData.presExId);
							if (pres) viewPresentationDetails(pres);
						}
					}}>
						View Full Details
					</Button>
				</div>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">No verification data available</p>
		{/if}
	</DialogContent>
</Dialog>
