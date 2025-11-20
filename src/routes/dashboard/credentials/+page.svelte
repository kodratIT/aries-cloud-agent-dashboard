<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { acapyClient, type CredentialDetail } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';

	interface CredentialRecord {
		cred_ex_id?: string;
		credential_exchange_id?: string; // v1.0 format
		state?: string;
		connection_id?: string;
		created_at?: string;
		updated_at?: string;
		credential_definition_id?: string;
		schema_id?: string;
		[key: string]: any; // Allow other fields
	}

	interface Connection {
		connection_id: string;
		their_label?: string;
		state: string;
	}

	interface CredDef {
		credential_definition_id: string;
		credential_definition: {
			issuerId?: string;
			schemaId: string;
			tag: string;
			type?: string;
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

	let credentials = $state<CredentialRecord[]>([]);
	let connections = $state<Connection[]>([]);
	let credDefs = $state<CredDef[]>([]);
	let schemas = $state<Schema[]>([]);
	let loading = $state(true);
	let showIssueDialog = $state(false);
	let issuing = $state(false);
	let error = $state('');
	let searchQuery = $state('');

	// Issue credential form
	let selectedConnectionId = $state('');
	let selectedCredDefId = $state('');
	let attributeValues = $state<Record<string, string>>({});
	let multipleSchemaOptions = $state<Schema[]>([]);
	let selectedSchemaOverride = $state<string>('');

	// Credential details
	let selectedCredential = $state<CredentialRecord | null>(null);
	let showDetailsDialog = $state(false);

	// Filtering and sorting
	let stateFilter = $state<string>('all');
	let connectionFilter = $state<string>('all');
	let schemaFilter = $state<string>('all');
	let sortBy = $state<'newest' | 'oldest'>('newest');

	// Actions
	let revokingCredId = $state<string | null>(null);
	let deletingCredId = $state<string | null>(null);
	let acceptingCredId = $state<string | null>(null);
	let decliningCredId = $state<string | null>(null);

	// Dialogs
	let showRevokeDialog = $state(false);
	let showDeleteDialog = $state(false);
	let credentialToRevoke = $state<CredentialRecord | null>(null);
	let credentialToDelete = $state<CredentialRecord | null>(null);
	
	// Revoke options
	let notifyHolder = $state(true);
	let publishImmediately = $state(true);

	// Detail view
	let credentialDetail = $state<any>(null);
	let loadingDetail = $state(false);
	let checkingRevocation = $state(false);
	let revocationStatus = $state<{ revoked: boolean; checked: boolean } | null>(null);

	// Tab view
	let activeTab = $state<'all' | 'offers' | 'mycreds'>('all');

	// Proof requests (Holder view)
	let proofRequests = $state<any[]>([]);
	let loadingProofRequests = $state(false);
	let showProofRequestDialog = $state(false);
	let selectedProofRequest = $state<any>(null);
	let matchingCredentials = $state<any[]>([]);
	let loadingMatchingCreds = $state(false);
	let selectedCredentialForProof = $state<string>('');
	let sendingPresentation = $state(false);

	onMount(async () => {
		await Promise.all([
			loadCredentials(),
			loadConnections(),
			loadCredDefs(),
			loadSchemas(),
			loadProofRequests()
		]);
	});

	async function loadCredentials() {
		if (!authStore.token) return;

		loading = true;
		error = '';
		try {
			const response = await acapyClient.getCredentials(authStore.token) as any;
			console.log('=== CREDENTIALS RESPONSE ===');
			console.log('Full response:', response);
			console.log('Results count:', response.results?.length || 0);
			
			// Extract cred_ex_record from each result
			const rawResults = response.results || [];
			credentials = rawResults.map((item: any) => {
				// If data is nested in cred_ex_record, extract it
				if (item.cred_ex_record) {
					return item.cred_ex_record;
				}
				return item;
			});
			
			// Debug: log all credentials to see structure
			if (credentials.length > 0) {
				console.log('=== CREDENTIAL SAMPLES (after extraction) ===');
				credentials.forEach((cred, index) => {
					console.log(`Credential ${index + 1}:`, {
						cred_ex_id: cred.cred_ex_id,
						state: cred.state,
						connection_id: cred.connection_id,
						credential_definition_id: cred.credential_definition_id,
						schema_id: cred.schema_id,
						created_at: cred.created_at
					});
				});
			} else {
				console.log('No credentials found');
			}
		} catch (err: any) {
			console.error('Failed to load credentials:', err);
			error = 'Failed to load credentials';
			toast.error('Failed to load credentials', {
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
			// Only show active connections
			connections = (response.results || []).filter((c: Connection) => c.state === 'active');
		} catch (err) {
			console.error('Failed to load connections:', err);
		}
	}

	async function loadCredDefs() {
		if (!authStore.token) return;

		try {
			const response = await acapyClient.getCredentialDefinitions(authStore.token) as any;
			console.log('CredDefs response:', response);
			
			if (response.credential_definition_ids && response.credential_definition_ids.length > 0) {
				const credDefDetails = await Promise.all(
					response.credential_definition_ids.map(async (credDefId: string) => {
						try {
							const detail = await acapyClient.getCredDefById(authStore.token, credDefId);
							console.log('CredDef detail for', credDefId, ':', JSON.stringify(detail, null, 2));
							return detail;
						} catch (err) {
							console.error('Failed to load credDef', credDefId, ':', err);
							return null;
						}
					})
				);
				credDefs = credDefDetails.filter(c => c !== null) as CredDef[];
				console.log('Loaded credDefs:', $state.snapshot(credDefs));
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

	async function loadProofRequests() {
		if (!authStore.token) return;

		loadingProofRequests = true;
		try {
			const response = await acapyClient.getPresentations(authStore.token) as any;
			console.log('Proof requests response:', response);
			
			// Extract and filter for request-received state (incoming requests for holder)
			const rawResults = response.results || [];
			const allPresentations = rawResults.map((item: any) => {
				if (item.pres_ex_record) {
					return item.pres_ex_record;
				}
				return item;
			});
			
			// Filter for incoming proof requests (holder perspective)
			proofRequests = allPresentations.filter((p: any) => 
				p.state === 'request-received' || p.state === 'request_received'
			);
			
			console.log('Incoming proof requests:', proofRequests.length);
		} catch (err: any) {
			console.error('Failed to load proof requests:', err);
		} finally {
			loadingProofRequests = false;
		}
	}

	async function openProofRequestDialog(proofRequest: any) {
		selectedProofRequest = proofRequest;
		showProofRequestDialog = true;
		loadingMatchingCreds = true;
		matchingCredentials = [];
		selectedCredentialForProof = '';

		try {
			// Get credentials that match this proof request
			const response = await acapyClient.getCredentialsForProofRequest(
				proofRequest.pres_ex_id,
				authStore.token!
			);
			console.log('Matching credentials:', response);
			matchingCredentials = response || [];
		} catch (err: any) {
			console.error('Failed to load matching credentials:', err);
			toast.error('Failed to load matching credentials', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loadingMatchingCreds = false;
		}
	}

	async function sendPresentationToVerifier() {
		if (!selectedProofRequest || !selectedCredentialForProof) return;

		sendingPresentation = true;
		try {
			// Build presentation request body
			// This is simplified - in production, you'd need to map requested attributes properly
			const requestedAttributes: Record<string, any> = {};
			
			// Get requested attributes from proof request
			const presRequest = selectedProofRequest.pres_request || selectedProofRequest.pres;
			if (presRequest?.requested_attributes) {
				Object.keys(presRequest.requested_attributes).forEach(key => {
					requestedAttributes[key] = {
						cred_id: selectedCredentialForProof,
						revealed: true
					};
				});
			}

			const presentationBody = {
				anoncreds: {
					requested_attributes: requestedAttributes,
					requested_predicates: {},
					self_attested_attributes: {}
				}
			};

			console.log('Sending presentation:', presentationBody);
			await acapyClient.sendPresentation(
				selectedProofRequest.pres_ex_id,
				authStore.token!,
				presentationBody
			);

			toast.success('Presentation sent successfully!');
			showProofRequestDialog = false;
			await loadProofRequests();
		} catch (err: any) {
			console.error('Failed to send presentation:', err);
			toast.error('Failed to send presentation', {
				description: err.message || 'Unknown error'
			});
		} finally {
			sendingPresentation = false;
		}
	}

	function openIssueDialog() {
		// Reset form
		selectedConnectionId = '';
		selectedCredDefId = '';
		attributeValues = {};
		multipleSchemaOptions = [];
		selectedSchemaOverride = '';
		error = '';
		showIssueDialog = true;
	}

	function onCredDefChange() {
		// Reset attribute values when cred def changes
		attributeValues = {};
		multipleSchemaOptions = [];
		selectedSchemaOverride = '';
		error = '';
		
		// Initialize attribute values based on schema
		const credDef = credDefs.find(c => c.credential_definition_id === selectedCredDefId);
		
		if (credDef) {
			// Log full structure to understand the data
			console.log('=== CREDENTIAL DEFINITION DEBUG ===');
			console.log('CredDef ID:', credDef.credential_definition_id);
			console.log('Full CredDef:', JSON.stringify($state.snapshot(credDef), null, 2));
			console.log('CredDef keys:', Object.keys(credDef));
			if (credDef.credential_definition) {
				console.log('credential_definition keys:', Object.keys(credDef.credential_definition));
			}
			
			// Try to extract schema ID from various possible locations
			const credDefData = credDef.credential_definition as any;
			let schemaId = credDefData?.schemaId || 
			               credDefData?.schema_id ||
			               credDefData?.schemaID ||
			               (credDef as any).schema_id;
			
			console.log('Raw schemaId from credDef:', schemaId);
			
			// Check if schemaId is just a sequence number (e.g., "13")
			// If so, we need to get the actual schema from the credential definition
			if (schemaId && !schemaId.includes(':')) {
				console.log('⚠️ SchemaId is a sequence number, need to find actual schema');
				
				// The schemaId in credential_definition is actually a reference
				// We need to look at the credential_definition_id to find the actual schema
				// Format: issuer:3:CL:schema_seq_no:tag
				if (credDef.credential_definition_id) {
					const credDefParts = credDef.credential_definition_id.split(':');
					console.log('CredDef ID parts:', credDefParts);
					
					if (credDefParts.length >= 5) {
						const issuer = credDefParts[0];
						const schemaSeqNo = credDefParts[4];
						
						console.log('Looking for schema with issuer:', issuer, 'and seq no:', schemaSeqNo);
						
						// The schema sequence number in cred_def_id should match the schema
						// Try to find schema that matches this pattern
						// Schema ID format: issuer:2:name:version
						const matchingSchemas = schemas.filter(s => {
							const schemaParts = s.schema_id.split(':');
							// Check if issuer matches
							const issuerMatch = schemaParts[0] === issuer;
							console.log(`Checking schema ${s.schema?.name}: issuer match = ${issuerMatch}`);
							return issuerMatch;
						});
						
						console.log('Matching schemas by issuer:', matchingSchemas.map(s => ({
							id: s.schema_id,
							name: s.schema?.name,
							attrs: s.schema?.attrNames
						})));
						
						// If we have multiple schemas from same issuer, we need more info
						// For now, let's show a warning and let user know
						if (matchingSchemas.length === 0) {
							console.error('❌ No schemas found for issuer:', issuer);
							error = `No schemas found for issuer ${issuer}. Please create a schema first.`;
							return;
						} else if (matchingSchemas.length === 1) {
							schemaId = matchingSchemas[0].schema_id;
							console.log('✓ Found single matching schema:', schemaId);
						} else {
							// Multiple schemas - we can't determine which one without more info
							// Show all options to user
							console.warn('⚠️ Multiple schemas found for this issuer:');
							matchingSchemas.forEach(s => {
								console.log(`  - ${s.schema?.name}: ${s.schema?.attrNames?.join(', ')}`);
							});
							
							// Try to match by schema sequence number from cred_def_id
							// Format: issuer:3:CL:schema_seq_no:tag
							const schemaSeqNo = credDefParts[3]; // This is the schema sequence number
							
							// Try to find schema that ends with this sequence number
							const schemaBySeqNo = matchingSchemas.find(s => {
								// Schema ID format: issuer:2:name:version
								// The sequence number might be embedded in the schema_id or we need to match by position
								return s.schema_id.includes(schemaSeqNo);
							});
							
							if (schemaBySeqNo) {
								schemaId = schemaBySeqNo.schema_id;
								console.log('✓ Matched schema by sequence number:', schemaId);
							} else {
								// Store multiple options for user to choose
								multipleSchemaOptions = matchingSchemas;
								schemaId = matchingSchemas[0].schema_id;
								console.log('⚠️ Multiple schemas available, user can select:', matchingSchemas.map(s => s.schema?.name));
								error = `⚠️ Multiple schemas found. Please select the correct schema below.`;
							}
						}
					}
				}
			}
			
			console.log('Extracted schema ID:', schemaId);
			console.log('Available schemas:', $state.snapshot(schemas).map((s: any) => ({
				id: s.schema_id,
				name: s.schema?.name
			})));
			
			if (!schemaId) {
				console.error('❌ No schema ID found in credDef');
				error = 'Could not find schema ID in credential definition. Please check console for details.';
				return;
			}
			
			const schema = schemas.find(s => s.schema_id === schemaId);
			console.log('Found schema:', schema ? `✓ ${schema.schema?.name}` : '✗ Not found');
			
			if (schema && schema.schema?.attrNames) {
				schema.schema.attrNames.forEach(attr => {
					attributeValues[attr] = '';
				});
				console.log('✓ Initialized attributes:', Object.keys(attributeValues));
			} else {
				console.warn('❌ Schema not found or has no attributes');
				error = `Schema not found for ID: ${schemaId}`;
			}
		}
	}

	function onSchemaOverrideChange() {
		// User manually selected a schema
		if (!selectedSchemaOverride) return;
		
		console.log('User selected schema override:', selectedSchemaOverride);
		attributeValues = {};
		error = '';
		
		const schema = schemas.find(s => s.schema_id === selectedSchemaOverride);
		if (schema && schema.schema?.attrNames) {
			schema.schema.attrNames.forEach(attr => {
				attributeValues[attr] = '';
			});
			console.log('✓ Initialized attributes from override:', Object.keys(attributeValues));
		}
	}

	async function issueCredential() {
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

		// Check all attributes are filled
		const emptyAttrs = Object.entries(attributeValues).filter(([_, value]) => !value.trim());
		if (emptyAttrs.length > 0) {
			error = `Please fill all attributes: ${emptyAttrs.map(([key]) => key).join(', ')}`;
			return;
		}

		issuing = true;
		error = '';
		try {
			// Use anoncreds format instead of indy
			const requestBody = {
				connection_id: selectedConnectionId,
				filter: {
					anoncreds: {
						cred_def_id: selectedCredDefId
					}
				},
				credential_preview: {
					"@type": "issue-credential/2.0/credential-preview",
					attributes: Object.entries(attributeValues).map(([name, value]) => ({
						name,
						value: value.trim()
					}))
				}
			};

			console.log('Issuing credential with:', requestBody);
			const result = await acapyClient.issueCredential(authStore.token, requestBody);
			console.log('Credential issued:', result);

			showIssueDialog = false;
			
			toast.success('Credential offer sent successfully!', {
				description: 'Waiting for holder to accept'
			});

			await loadCredentials();
		} catch (err: any) {
			console.error('Failed to issue credential:', err);
			error = err.message || 'Failed to issue credential';
			toast.error('Failed to issue credential', {
				description: err.message || 'Unknown error'
			});
		} finally {
			issuing = false;
		}
	}

	async function viewCredentialDetails(credential: CredentialRecord) {
		console.log('View credential details for:', credential);
		
		const credId = getCredentialId(credential);
		
		// Validate credential has required ID
		if (!credId) {
			console.error('Credential missing ID:', credential);
			toast.error('Invalid credential', {
				description: 'Credential ID is missing'
			});
			return;
		}
		
		selectedCredential = credential;
		showDetailsDialog = true;
		loadingDetail = true;
		revocationStatus = null; // Reset revocation status

		try {
			credentialDetail = await acapyClient.getCredentialDetails(
				credId,
				authStore.token!
			);
		} catch (err: any) {
			console.error('Failed to load credential details:', err);
			toast.error('Failed to load credential details', {
				description: err.message || 'Unknown error'
			});
		} finally {
			loadingDetail = false;
		}
	}

	async function checkRevocationStatus() {
		if (!selectedCredential) return;
		
		const credId = getCredentialId(selectedCredential);
		if (!credId) {
			toast.error('Invalid credential ID');
			return;
		}

		checkingRevocation = true;
		try {
			const status = await acapyClient.checkRevocationStatus(credId, authStore.token!);
			revocationStatus = { ...status, checked: true };
			
			if (status.revoked) {
				toast.info('Credential is revoked', {
					description: 'This credential has been revoked and is no longer valid'
				});
			} else {
				toast.success('Credential is valid', {
					description: 'This credential has not been revoked'
				});
			}
		} catch (err: any) {
			console.error('Failed to check revocation status:', err);
			toast.error('Failed to check revocation status', {
				description: err.message || 'Unknown error'
			});
		} finally {
			checkingRevocation = false;
		}
	}

	// Holder operations
	async function acceptOffer(credExId: string) {
		acceptingCredId = credExId;
		try {
			await acapyClient.acceptCredentialOffer(credExId, authStore.token!);
			toast.success('Credential offer accepted!');
			await loadCredentials();
		} catch (err: any) {
			console.error('Failed to accept offer:', err);
			toast.error('Failed to accept offer', {
				description: err.message || 'Unknown error'
			});
		} finally {
			acceptingCredId = null;
		}
	}

	async function declineOffer(credExId: string) {
		decliningCredId = credExId;
		try {
			await acapyClient.declineCredentialOffer(credExId, authStore.token!);
			toast.success('Credential offer declined');
			await loadCredentials();
		} catch (err: any) {
			console.error('Failed to decline offer:', err);
			toast.error('Failed to decline offer', {
				description: err.message || 'Unknown error'
			});
		} finally {
			decliningCredId = null;
		}
	}

	// Issuer operations
	function openRevokeDialog(credential: CredentialRecord) {
		credentialToRevoke = credential;
		// Reset options to defaults
		notifyHolder = true;
		publishImmediately = true;
		showRevokeDialog = true;
	}

	async function revokeCredential() {
		if (!credentialToRevoke) return;

		const credId = getCredentialId(credentialToRevoke);
		if (!credId) {
			toast.error('Invalid credential ID');
			return;
		}

		revokingCredId = credId;
		try {
			await acapyClient.revokeCredential(credId, authStore.token!, {
				notify: notifyHolder,
				connectionId: credentialToRevoke.connection_id,
				publish: publishImmediately
			});
			
			toast.success('Credential revoked successfully', {
				description: publishImmediately ? 
					'Revocation published to ledger' : 
					'Revocation marked as pending'
			});
			
			showRevokeDialog = false;
			credentialToRevoke = null;
			await loadCredentials();
		} catch (err: any) {
			console.error('Failed to revoke credential:', err);
			toast.error('Failed to revoke credential', {
				description: err.message || 'Unknown error'
			});
		} finally {
			revokingCredId = null;
		}
	}

	function openDeleteDialog(credential: CredentialRecord) {
		credentialToDelete = credential;
		showDeleteDialog = true;
	}

	async function deleteCredential() {
		if (!credentialToDelete) return;

		const credId = getCredentialId(credentialToDelete);
		if (!credId) {
			toast.error('Invalid credential ID');
			return;
		}

		deletingCredId = credId;
		try {
			await acapyClient.deleteCredentialRecord(credId, authStore.token!);
			toast.success('Credential record deleted');
			showDeleteDialog = false;
			credentialToDelete = null;
			await loadCredentials();
		} catch (err: any) {
			console.error('Failed to delete credential:', err);
			toast.error('Failed to delete credential', {
				description: err.message || 'Unknown error'
			});
		} finally {
			deletingCredId = null;
		}
	}

	function getConnectionLabel(connectionId: string): string {
		const conn = connections.find(c => c.connection_id === connectionId);
		return conn?.their_label || 'Unknown';
	}

	function getCredentialId(credential: CredentialRecord): string {
		return credential.cred_ex_id || credential.credential_exchange_id || '';
	}

	function getCredDefIdFromCredential(credential: any): string {
		// Try to extract credential_definition_id from various locations
		if (credential.credential_definition_id) {
			return credential.credential_definition_id;
		}
		
		// Check in cred_offer filters~attach
		if (credential.cred_offer?.['filters~attach']) {
			try {
				const attach = credential.cred_offer['filters~attach'][0];
				if (attach?.data?.base64) {
					const decoded = JSON.parse(atob(attach.data.base64));
					if (decoded.cred_def_id) {
						return decoded.cred_def_id;
					}
				}
			} catch (e) {
				console.error('Failed to decode cred_def_id from offer:', e);
			}
		}
		
		// Check in cred_proposal
		if (credential.cred_proposal?.['filters~attach']) {
			try {
				const attach = credential.cred_proposal['filters~attach'][0];
				if (attach?.data?.base64) {
					const decoded = JSON.parse(atob(attach.data.base64));
					if (decoded.cred_def_id) {
						return decoded.cred_def_id;
					}
				}
			} catch (e) {
				console.error('Failed to decode cred_def_id from proposal:', e);
			}
		}
		
		return '';
	}

	function getSchemaForCredDef(credDefId: string): Schema | null {
		if (!credDefId) return null;
		
		const credDef = credDefs.find(c => c.credential_definition_id === credDefId);
		if (!credDef) {
			return null;
		}
		
		// Try different possible schema ID fields
		const credDefData = credDef.credential_definition as any;
		let schemaId = credDefData?.schemaId || 
		               credDefData?.schema_id ||
		               (credDef as any).schema_id;
		
		// If schemaId is just a sequence number, try to find the actual schema
		if (schemaId && !schemaId.includes(':')) {
			// Extract issuer from credential_definition_id
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
		
		if (!schemaId) {
			return null;
		}
		
		const schema = schemas.find(s => s.schema_id === schemaId);
		return schema || null;
	}

	function getStateColor(state: string): "default" | "secondary" | "destructive" | "outline" {
		const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			'done': 'default',
			'credential-issued': 'default',
			'offer-sent': 'secondary',
			'request-received': 'secondary',
			'credential-acked': 'default',
			'abandoned': 'destructive',
			'error': 'destructive'
		};
		return colors[state] || 'outline';
	}

	function matchesSearch(credential: CredentialRecord): boolean {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			credential.cred_ex_id.toLowerCase().includes(query) ||
			credential.state.toLowerCase().includes(query) ||
			getConnectionLabel(credential.connection_id).toLowerCase().includes(query)
		);
	}

	// Filtering and sorting logic
	let filteredAndSortedCredentials = $derived.by(() => {
		let result = credentials;

		// Apply search
		if (searchQuery.trim()) {
			result = result.filter(matchesSearch);
		}

		// Apply state filter
		if (stateFilter !== 'all') {
			result = result.filter((c) => c.state === stateFilter);
		}

		// Apply connection filter
		if (connectionFilter !== 'all') {
			result = result.filter((c) => c.connection_id === connectionFilter);
		}

		// Apply schema filter
		if (schemaFilter !== 'all') {
			result = result.filter((c) => c.schema_id === schemaFilter);
		}

		// Apply sorting
		result = [...result].sort((a, b) => {
			const dateA = new Date(a.created_at).getTime();
			const dateB = new Date(b.created_at).getTime();
			return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
		});

		return result;
	});

	// For backward compatibility
	let filteredCredentials = $derived(filteredAndSortedCredentials);

	let selectedSchema = $derived.by(() => {
		if (!selectedCredDefId) return null;
		return getSchemaForCredDef(selectedCredDefId);
	});

	function clearFilters() {
		stateFilter = 'all';
		connectionFilter = 'all';
		schemaFilter = 'all';
		searchQuery = '';
	}

	function exportCredentials() {
		const dataToExport = filteredAndSortedCredentials.map((cred) => ({
			id: cred.cred_ex_id,
			state: cred.state,
			connection: getConnectionLabel(cred.connection_id),
			schema: cred.schema_id || 'N/A',
			created: cred.created_at,
			updated: cred.updated_at
		}));

		// Convert to CSV
		const headers = ['ID', 'State', 'Connection', 'Schema', 'Created', 'Updated'];
		const csvRows = [
			headers.join(','),
			...dataToExport.map((row) =>
				[row.id, row.state, row.connection, row.schema, row.created, row.updated].join(',')
			)
		];
		const csv = csvRows.join('\n');

		// Download
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `credentials-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);

		toast.success('Credentials exported successfully');
	}

</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Credentials</h1>
			<p class="text-gray-500 dark:text-gray-400">Issue and manage verifiable credentials</p>
		</div>
		<Button 
			onclick={openIssueDialog} 
			disabled={connections.length === 0 || credDefs.length === 0}
		>
			➕ Issue Credential
		</Button>
	</div>

	<!-- Statistics Dashboard -->
	{#if !loading && credentials.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold">{credentials.length}</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Total Credentials</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
						{credentials.filter((c) => c.state === 'offer-sent' || c.state === 'offer-received').length}
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Pending Offers</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold text-green-600 dark:text-green-500">
						{credentials.filter((c) => c.state === 'done' || c.state === 'credential-issued').length}
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Completed</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-2xl font-bold text-red-600 dark:text-red-500">
						{credentials.filter((c) => c.state === 'abandoned' || c.state === 'error').length}
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">Failed/Abandoned</p>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Incoming Proof Requests (Holder) -->
	{#if proofRequests.length > 0}
		<Card class="border-2 border-purple-200 dark:border-purple-800">
			<CardHeader>
				<CardTitle>🔍 Incoming Proof Requests</CardTitle>
				<CardDescription>Verifiers are requesting proof of your credentials</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each proofRequests as request}
						<div class="flex items-center justify-between rounded-lg border p-4 bg-purple-50 dark:bg-purple-900/20">
							<div class="flex-1">
								<p class="font-medium">
									{request.connection_id ? getConnectionLabel(request.connection_id) : 'Unknown Verifier'}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
									Requesting proof of credentials
								</p>
								{#if request.created_at}
									<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
										{new Date(request.created_at).toLocaleString()}
									</p>
								{/if}
							</div>
							<div class="flex gap-2">
								<Button
									size="sm"
									onclick={() => openProofRequestDialog(request)}
								>
									👁️ View & Respond
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

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
							You need an active connection to issue credentials to a holder.
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
							You need a credential definition before you can issue credentials.
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

	<!-- Pending Offers Section (Holder) -->
	{#if credentials.filter((c) => c.state === 'offer-received').length > 0}
		<Card class="border-2 border-blue-200 dark:border-blue-800">
			<CardHeader>
				<CardTitle>Pending Credential Offers</CardTitle>
				<CardDescription>You have received credential offers that need your action</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each credentials.filter((c) => c.state === 'offer-received') as offer}
						{@const offerId = getCredentialId(offer)}
						{@const offerCredDefId = getCredDefIdFromCredential(offer)}
						{@const offerSchema = offerCredDefId ? getSchemaForCredDef(offerCredDefId) : null}
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="flex-1">
								<p class="font-medium">{getConnectionLabel(offer.connection_id)}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{#if offerSchema}
										{offerSchema.schema.name} v{offerSchema.schema.version}
									{:else if offer.schema_id}
										{offer.schema_id.split(':').slice(-2).join(' v')}
									{:else}
										Unknown Schema
									{/if}
								</p>
							</div>
							<div class="flex gap-2">
								<Button
									size="sm"
									onclick={() => acceptOffer(offerId)}
									disabled={acceptingCredId === offerId}
								>
									{acceptingCredId === offerId ? 'Accepting...' : '✓ Accept'}
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onclick={() => declineOffer(offerId)}
									disabled={decliningCredId === offerId}
								>
									{decliningCredId === offerId ? 'Declining...' : '✗ Decline'}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Filters and Actions Bar -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex flex-wrap items-end gap-4">
				<!-- Search -->
				<div class="flex-1 min-w-[200px]">
					<Label>Search</Label>
					<Input type="text" placeholder="Search credentials..." bind:value={searchQuery} />
				</div>

				<!-- State Filter -->
				<div class="min-w-[180px]">
					<Label>State</Label>
					<select
						bind:value={stateFilter}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="all">All States</option>
						<option value="offer-sent">Offer Sent</option>
						<option value="offer-received">Offer Received</option>
						<option value="request-received">Request Received</option>
						<option value="credential-issued">Credential Issued</option>
						<option value="done">Done</option>
						<option value="abandoned">Abandoned</option>
					</select>
				</div>

				<!-- Connection Filter -->
				<div class="min-w-[180px]">
					<Label>Connection</Label>
					<select
						bind:value={connectionFilter}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="all">All Connections</option>
						{#each connections as conn}
							<option value={conn.connection_id}>
								{conn.their_label || conn.connection_id.substring(0, 20)}
							</option>
						{/each}
					</select>
				</div>

				<!-- Sort -->
				<div class="min-w-[150px]">
					<Label>Sort By</Label>
					<select
						bind:value={sortBy}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="newest">Newest First</option>
						<option value="oldest">Oldest First</option>
					</select>
				</div>

				<!-- Actions -->
				<div class="flex gap-2">
					<Button variant="outline" onclick={clearFilters}>Clear Filters</Button>
					<Button variant="outline" onclick={exportCredentials}>📥 Export</Button>
				</div>
			</div>

			<!-- Results Count -->
			<div class="mt-3 text-sm text-gray-500 dark:text-gray-400">
				Showing {filteredAndSortedCredentials.length} of {credentials.length} credentials
			</div>
		</CardContent>
	</Card>

	<!-- Credentials List -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Credential Records ({filteredCredentials.length})</CardTitle>
					<CardDescription>List of all credential issuance records</CardDescription>
				</div>
				<Button 
					size="sm" 
					variant="outline" 
					onclick={() => {
						console.log('=== DEBUG: RAW CREDENTIALS DATA ===');
						console.log('Credentials array:', credentials);
						console.log('Filtered credentials:', filteredCredentials);
						if (credentials.length > 0) {
							console.log('First credential:', credentials[0]);
							console.log('Keys:', Object.keys(credentials[0]));
						}
					}}
				>
					🐛 Debug Data
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading credentials...</div>
			{:else if filteredCredentials.length === 0}
				<div class="py-8 text-center">
					{#if searchQuery.trim()}
						<p class="text-gray-500">No credentials found matching "{searchQuery}"</p>
						<Button variant="link" onclick={() => searchQuery = ''}>Clear search</Button>
					{:else}
						<p class="text-gray-500">No credentials issued yet</p>
						<p class="mt-2 text-sm text-gray-400">Issue your first credential to get started</p>
						{#if connections.length > 0 && credDefs.length > 0}
							<Button class="mt-4" onclick={openIssueDialog}>
								Issue Credential
							</Button>
						{/if}
					{/if}
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredCredentials as credential}
						{@const credId = getCredentialId(credential)}
						{@const credDefId = getCredDefIdFromCredential(credential)}
						{@const schema = credDefId ? getSchemaForCredDef(credDefId) : null}
						{@const connectionId = credential.connection_id || ''}
						{@const state = credential.state || 'unknown'}
						{@const createdAt = credential.created_at || credential.updated_at || ''}
						<div class="rounded-lg border p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-2">
									<div>
										<div class="mb-1 flex items-center gap-2">
											<h3 class="font-semibold">
												{connectionId ? getConnectionLabel(connectionId) : 'Unknown Connection'}
											</h3>
											<Badge variant={getStateColor(state)}>
												{state}
											</Badge>
										</div>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											ID: {credId || 'N/A'}
										</p>
										{#if !credId || !connectionId || !state || state === 'unknown'}
											<p class="text-xs text-red-500 dark:text-red-400">
												⚠️ Incomplete data - check console
											</p>
										{/if}
									</div>

									<div class="flex flex-wrap gap-2 text-xs">
										{#if schema}
											<Badge variant="outline">
												{schema.schema.name} v{schema.schema.version}
											</Badge>
										{:else if credential.schema_id}
											<Badge variant="outline">
												Schema: {credential.schema_id.split(':').slice(-2).join(' v')}
											</Badge>
										{:else if credential.credential_definition_id}
											<Badge variant="outline">
												CredDef: {credential.credential_definition_id.split(':').pop() || 'N/A'}
											</Badge>
										{/if}
										{#if createdAt}
											<Badge variant="secondary">
												{new Date(createdAt).toLocaleDateString()}
											</Badge>
										{:else}
											<Badge variant="secondary">No date</Badge>
										{/if}
									</div>
								</div>

								<div class="flex gap-2">
									<!-- For pending offers (holder) -->
									{#if credential.state === 'offer-received'}
										<Button
											size="sm"
											onclick={() => acceptOffer(credId)}
											disabled={acceptingCredId === credId}
										>
											{acceptingCredId === credId ? 'Accepting...' : '✓ Accept'}
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onclick={() => declineOffer(credId)}
											disabled={decliningCredId === credId}
										>
											{decliningCredId === credId ? 'Declining...' : '✗ Decline'}
										</Button>
									{:else}
										<Button size="sm" variant="outline" onclick={() => viewCredentialDetails(credential)}>
											👁️ View
										</Button>
										
										<!-- Revoke button for issued credentials -->
										{#if credential.state === 'done' || credential.state === 'credential-issued'}
											<Button
												size="sm"
												variant="destructive"
												onclick={() => openRevokeDialog(credential)}
												disabled={revokingCredId === credId}
											>
												{revokingCredId === credId ? 'Revoking...' : '🚫 Revoke'}
											</Button>
										{/if}
										
										<!-- Delete button -->
										<Button
											size="sm"
											variant="outline"
											onclick={() => openDeleteDialog(credential)}
											disabled={deletingCredId === credId}
										>
											{deletingCredId === credId ? 'Deleting...' : '🗑️ Delete'}
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
				💡 About Credential Issuance
			</h3>
			<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
				<li>✓ <strong>Issue credentials</strong> to holders via established connections</li>
				<li>✓ <strong>Offer sent</strong> → Holder receives offer</li>
				<li>✓ <strong>Request received</strong> → Holder accepted offer</li>
				<li>✓ <strong>Credential issued</strong> → Credential sent to holder</li>
				<li>✓ <strong>Done</strong> → Process complete</li>
			</ul>
		</CardContent>
	</Card>
</div>

<!-- Revoke Confirmation Dialog -->
{#if showRevokeDialog && credentialToRevoke}
	<Dialog open={showRevokeDialog} onOpenChange={(open) => (showRevokeDialog = open)}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Revoke Credential</DialogTitle>
				<DialogDescription>Configure revocation options for this credential</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div class="rounded-lg bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
					<p class="font-medium text-yellow-900 dark:text-yellow-100">⚠️ Warning</p>
					<p class="mt-1 text-yellow-800 dark:text-yellow-200">
						This will invalidate the credential. The holder will no longer be able to use it.
					</p>
				</div>

				<div>
					<p class="text-sm font-medium">Credential ID:</p>
					<code class="mt-1 block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
						{credentialToRevoke.cred_ex_id}
					</code>
				</div>

				<div>
					<p class="text-sm font-medium mb-2">Connection:</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{getConnectionLabel(credentialToRevoke.connection_id)}
					</p>
				</div>

				<!-- Revocation Options -->
				<div class="space-y-3 rounded-lg border p-4">
					<h4 class="font-semibold text-sm">Revocation Options</h4>
					
					<div class="flex items-start gap-3">
						<input
							type="checkbox"
							id="publishImmediately"
							bind:checked={publishImmediately}
							class="mt-1 h-4 w-4 rounded border-gray-300"
							disabled={revokingCredId !== null}
						/>
						<div class="flex-1">
							<Label for="publishImmediately" class="cursor-pointer font-medium">
								Publish to ledger immediately
							</Label>
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Recommended. Publishes the revocation to the blockchain right away.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<input
							type="checkbox"
							id="notifyHolder"
							bind:checked={notifyHolder}
							class="mt-1 h-4 w-4 rounded border-gray-300"
							disabled={revokingCredId !== null}
						/>
						<div class="flex-1">
							<Label for="notifyHolder" class="cursor-pointer font-medium">
								Notify holder about revocation
							</Label>
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Sends a notification message to the credential holder.
							</p>
						</div>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<Button
						variant="outline"
						onclick={() => (showRevokeDialog = false)}
						disabled={revokingCredId !== null}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onclick={revokeCredential}
						disabled={revokingCredId !== null}
					>
						{revokingCredId !== null ? 'Revoking...' : 'Confirm Revoke'}
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}

<!-- Delete Confirmation Dialog -->
{#if showDeleteDialog && credentialToDelete}
	<Dialog open={showDeleteDialog} onOpenChange={(open) => (showDeleteDialog = open)}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Delete Credential Record</DialogTitle>
				<DialogDescription>
					Are you sure you want to delete this credential record?
				</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div class="rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
					<p class="font-medium text-red-900 dark:text-red-100">⚠️ Warning</p>
					<p class="mt-1 text-red-800 dark:text-red-200">
						This action is permanent and cannot be undone. The record will be deleted from your
						agent.
					</p>
				</div>

				<div>
					<p class="text-sm font-medium">Credential ID:</p>
					<code class="mt-1 block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
						{credentialToDelete.cred_ex_id}
					</code>
				</div>

				<div class="flex justify-end gap-2">
					<Button
						variant="outline"
						onclick={() => (showDeleteDialog = false)}
						disabled={deletingCredId !== null}
					>
						Cancel
					</Button>
					<Button variant="destructive" onclick={deleteCredential} disabled={deletingCredId !== null}>
						{deletingCredId !== null ? 'Deleting...' : 'Confirm Delete'}
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}

<!-- Issue Credential Dialog -->
<Dialog open={showIssueDialog} onOpenChange={(open) => showIssueDialog = open}>
	<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Issue Credential</DialogTitle>
			<DialogDescription>Send a verifiable credential to a holder</DialogDescription>
		</DialogHeader>

		<form onsubmit={(e) => { e.preventDefault(); issueCredential(); }} class="space-y-4">
			<div class="space-y-2">
				<Label for="connection">Connection (Holder) *</Label>
				<select
					id="connection"
					bind:value={selectedConnectionId}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={issuing}
					required
				>
					<option value="">Select a connection...</option>
					{#each connections as connection}
						<option value={connection.connection_id}>
							{connection.their_label || connection.connection_id}
						</option>
					{/each}
				</select>
				<p class="text-xs text-gray-500">Select who will receive this credential</p>
			</div>

			<div class="space-y-2">
				<Label for="credDef">Credential Definition *</Label>
				<select
					id="credDef"
					bind:value={selectedCredDefId}
					onchange={onCredDefChange}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={issuing}
					required
				>
					<option value="">Select a credential definition...</option>
					{#each credDefs as credDef}
						{@const schema = getSchemaForCredDef(credDef.credential_definition_id)}
						<option value={credDef.credential_definition_id}>
							{schema?.schema.name || 'Unknown'} ({credDef.credential_definition.tag})
							{#if schema?.schema.attrNames}
								- [{schema.schema.attrNames.join(', ')}]
							{/if}
						</option>
					{/each}
				</select>
				<p class="text-xs text-gray-500">
					Select the type of credential to issue
					{#if selectedCredDefId}
						<br />
						<span class="text-xs text-blue-600 dark:text-blue-400">
							Selected: {credDefs.find(c => c.credential_definition_id === selectedCredDefId)?.credential_definition_id}
						</span>
					{/if}
				</p>
			</div>

			<!-- Schema Selection (if multiple schemas found) -->
			{#if multipleSchemaOptions.length > 1}
				<div class="space-y-2 rounded-lg border-2 border-yellow-300 dark:border-yellow-700 p-4 bg-yellow-50 dark:bg-yellow-900/20">
					<div class="flex items-start gap-2">
						<span class="text-xl">⚠️</span>
						<div class="flex-1">
							<Label for="schemaOverride" class="font-semibold text-yellow-900 dark:text-yellow-100">
								Multiple Schemas Found - Please Select
							</Label>
							<p class="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
								Multiple schemas from the same issuer were found. Please select the correct one:
							</p>
							<select
								id="schemaOverride"
								bind:value={selectedSchemaOverride}
								onchange={onSchemaOverrideChange}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								disabled={issuing}
							>
								<option value="">Select the correct schema...</option>
								{#each multipleSchemaOptions as schemaOption}
									<option value={schemaOption.schema_id}>
										{schemaOption.schema.name} v{schemaOption.schema.version} - [{schemaOption.schema.attrNames.join(', ')}]
									</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			{/if}

			{#if selectedCredDefId && Object.keys(attributeValues).length > 0}
				<div class="space-y-3 rounded-lg border p-4">
					<h4 class="font-semibold">Credential Attributes</h4>
					<p class="text-xs text-gray-500">
						Fill in the values for this credential
						<br />
						<span class="font-mono text-xs">Attributes: {Object.keys(attributeValues).join(', ')}</span>
					</p>
					
					{#each Object.keys(attributeValues) as attr}
						<div class="space-y-1">
							<Label for={attr}>{attr} *</Label>
							<Input
								id={attr}
								type="text"
								placeholder={`Enter ${attr}`}
								bind:value={attributeValues[attr]}
								disabled={issuing}
								required
							/>
						</div>
					{/each}
				</div>
			{:else if selectedCredDefId}
				<div class="rounded-lg border p-4 text-center text-sm text-gray-500 dark:text-gray-400">
					Loading attributes...
				</div>
			{/if}

			{#if error}
				<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
					{error}
				</div>
			{/if}

			<div class="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
				<strong>💡 Note:</strong> The holder will receive an offer and can choose to accept or decline it.
			</div>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={() => showIssueDialog = false} disabled={issuing}>
					Cancel
				</Button>
				<Button type="submit" disabled={issuing || !selectedCredDefId || !selectedConnectionId}>
					{issuing ? 'Issuing...' : 'Issue Credential'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

<!-- Enhanced Credential Details Dialog -->
{#if selectedCredential}
	<Dialog open={showDetailsDialog} onOpenChange={(open) => showDetailsDialog = open}>
		<DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Credential Details</DialogTitle>
				<DialogDescription>
					{getConnectionLabel(selectedCredential.connection_id)}
				</DialogDescription>
			</DialogHeader>

			{#if loadingDetail}
				<div class="py-8 text-center text-gray-500 dark:text-gray-400">Loading details...</div>
			{:else if credentialDetail}
				<div class="space-y-4">
					<!-- Metadata -->
					<div class="rounded-lg border p-4">
						<h3 class="mb-3 font-semibold">Metadata</h3>
						<div class="space-y-2 text-sm">
							<div>
								<span class="font-medium">ID:</span>
								<code class="ml-2 text-xs">{credentialDetail.cred_ex_id}</code>
							</div>
							<div>
								<span class="font-medium">State:</span>
								<Badge class="ml-2" variant={getStateColor(credentialDetail.state)}>
									{credentialDetail.state}
								</Badge>
							</div>
							<div>
								<span class="font-medium">Created:</span>
								<span class="ml-2">{new Date(credentialDetail.created_at).toLocaleString()}</span>
							</div>
							{#if credentialDetail.updated_at}
								<div>
									<span class="font-medium">Updated:</span>
									<span class="ml-2">{new Date(credentialDetail.updated_at).toLocaleString()}</span>
								</div>
							{/if}
							{#if credentialDetail.schema_id}
								<div>
									<span class="font-medium">Schema:</span>
									<code class="ml-2 text-xs">{credentialDetail.schema_id}</code>
								</div>
							{/if}
							{#if credentialDetail.credential_definition_id}
								<div>
									<span class="font-medium">Credential Definition:</span>
									<code class="ml-2 text-xs">{credentialDetail.credential_definition_id}</code>
								</div>
							{/if}
						</div>
					</div>

					<!-- Attributes -->
					{#if credentialDetail.credential?.attrs}
						<div class="rounded-lg border p-4">
							<h3 class="mb-3 font-semibold">Credential Attributes</h3>
							<div class="space-y-2">
								{#each Object.entries(credentialDetail.credential.attrs) as [key, value]}
									<div class="flex justify-between border-b py-2 last:border-b-0">
										<span class="font-medium">{key}:</span>
										<span class="text-right">{value}</span>
									</div>
								{/each}
							</div>
						</div>
					{:else if credentialDetail.cred_preview?.attributes}
						<div class="rounded-lg border p-4">
							<h3 class="mb-3 font-semibold">Credential Attributes</h3>
							<div class="space-y-2">
								{#each credentialDetail.cred_preview.attributes as attr}
									<div class="flex justify-between border-b py-2 last:border-b-0">
										<span class="font-medium">{attr.name}:</span>
										<span class="text-right">{attr.value}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Revocation Info -->
					{#if credentialDetail.revocation_id || credentialDetail.revoc_reg_id}
						<div class="rounded-lg border p-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="font-semibold">Revocation Information</h3>
								<Button
									size="sm"
									variant="outline"
									onclick={checkRevocationStatus}
									disabled={checkingRevocation}
								>
									{checkingRevocation ? 'Checking...' : '🔍 Check Status'}
								</Button>
							</div>
							<div class="space-y-2 text-sm">
								{#if credentialDetail.revocation_id}
									<div>
										<span class="font-medium">Revocation ID:</span>
										<code class="ml-2 text-xs">{credentialDetail.revocation_id}</code>
									</div>
								{/if}
								{#if credentialDetail.revoc_reg_id}
									<div>
										<span class="font-medium">Revocation Registry:</span>
										<code class="ml-2 text-xs">{credentialDetail.revoc_reg_id}</code>
									</div>
								{/if}
								
								{#if revocationStatus?.checked}
									<div class="mt-3 pt-3 border-t">
										<div class="flex items-center gap-2">
											<span class="font-medium">Status:</span>
											{#if revocationStatus.revoked}
												<Badge variant="destructive">
													🚫 Revoked
												</Badge>
											{:else}
												<Badge variant="default">
													✓ Valid
												</Badge>
											{/if}
										</div>
										{#if revocationStatus.revoked}
											<p class="text-xs text-red-600 dark:text-red-400 mt-1">
												This credential has been revoked and is no longer valid
											</p>
										{:else}
											<p class="text-xs text-green-600 dark:text-green-400 mt-1">
												This credential is valid and has not been revoked
											</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{:else if credentialDetail.state === 'done' || credentialDetail.state === 'credential-issued'}
						<!-- Show check button even if no revocation info yet -->
						<div class="rounded-lg border p-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="font-semibold">Revocation Status</h3>
								<Button
									size="sm"
									variant="outline"
									onclick={checkRevocationStatus}
									disabled={checkingRevocation}
								>
									{checkingRevocation ? 'Checking...' : '🔍 Check Status'}
								</Button>
							</div>
							
							{#if revocationStatus?.checked}
								<div class="space-y-2 text-sm">
									<div class="flex items-center gap-2">
										<span class="font-medium">Status:</span>
										{#if revocationStatus.revoked}
											<Badge variant="destructive">
												🚫 Revoked
											</Badge>
										{:else}
											<Badge variant="default">
												✓ Valid
											</Badge>
										{/if}
									</div>
									{#if revocationStatus.revoked}
										<p class="text-xs text-red-600 dark:text-red-400">
											This credential has been revoked and is no longer valid
										</p>
									{:else}
										<p class="text-xs text-green-600 dark:text-green-400">
											This credential is valid and has not been revoked
										</p>
									{/if}
								</div>
							{:else}
								<p class="text-sm text-gray-500 dark:text-gray-400">
									Click "Check Status" to verify if this credential has been revoked
								</p>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="space-y-4">
					<div>
						<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Credential Exchange ID</p>
						<code class="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
							{selectedCredential.cred_ex_id}
						</code>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">State</p>
							<Badge variant={getStateColor(selectedCredential.state)}>
								{selectedCredential.state}
							</Badge>
						</div>
						<div>
							<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Connection</p>
							<p class="text-sm">{getConnectionLabel(selectedCredential.connection_id)}</p>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
							<p class="text-sm">{new Date(selectedCredential.created_at).toLocaleString()}</p>
						</div>
						<div>
							<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Updated</p>
							<p class="text-sm">{new Date(selectedCredential.updated_at).toLocaleString()}</p>
						</div>
					</div>

					{#if selectedCredential.schema_id}
						<div>
							<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Schema ID</p>
							<code class="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
								{selectedCredential.schema_id}
							</code>
						</div>
					{/if}

					{#if selectedCredential.credential_definition_id}
						<div>
							<p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Credential Definition ID</p>
							<code class="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
								{selectedCredential.credential_definition_id}
							</code>
						</div>
					{/if}
				</div>
			{/if}
		</DialogContent>
	</Dialog>
{/if}

<!-- Proof Request Response Dialog (Holder) -->
{#if selectedProofRequest}
	<Dialog open={showProofRequestDialog} onOpenChange={(open) => showProofRequestDialog = open}>
		<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Proof Request</DialogTitle>
				<DialogDescription>
					{selectedProofRequest.connection_id ? getConnectionLabel(selectedProofRequest.connection_id) : 'Unknown'} is requesting proof
				</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<!-- What's being requested -->
				<div class="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20">
					<h3 class="mb-2 font-semibold text-blue-900 dark:text-blue-100">📋 Requested Information</h3>
					{#if selectedProofRequest.pres_request?.requested_attributes || selectedProofRequest.pres?.requested_attributes}
						{@const reqAttrs = selectedProofRequest.pres_request?.requested_attributes || selectedProofRequest.pres?.requested_attributes}
						<div class="space-y-1 text-sm">
							{#each Object.entries(reqAttrs) as [key, value]}
								<div class="flex items-center gap-2">
									<span class="text-blue-700 dark:text-blue-300">•</span>
									<span class="text-blue-800 dark:text-blue-200">{value.name || key}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-blue-800 dark:text-blue-200">Loading requested attributes...</p>
					{/if}
				</div>

				<!-- Select credential -->
				<div class="space-y-2">
					<Label>Select Credential to Use</Label>
					{#if loadingMatchingCreds}
						<div class="py-4 text-center text-sm text-gray-500">
							Loading matching credentials...
						</div>
					{:else if matchingCredentials.length === 0}
						<div class="rounded-lg border p-4 text-center">
							<p class="text-sm text-gray-500">No matching credentials found</p>
							<p class="text-xs text-gray-400 mt-1">You don't have credentials that match this request</p>
						</div>
					{:else}
						<select
							bind:value={selectedCredentialForProof}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							disabled={sendingPresentation}
						>
							<option value="">Select a credential...</option>
							{#each matchingCredentials as cred}
								<option value={cred.cred_info?.referent || cred.referent}>
									Credential - {cred.cred_info?.schema_id || 'Unknown'}
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- Warning -->
				<div class="rounded-lg bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
					<p class="font-medium text-yellow-900 dark:text-yellow-100">⚠️ Privacy Notice</p>
					<p class="mt-1 text-yellow-800 dark:text-yellow-200">
						The requested attributes will be revealed to the verifier.
					</p>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-2">
					<Button
						variant="outline"
						onclick={() => showProofRequestDialog = false}
						disabled={sendingPresentation}
					>
						Cancel
					</Button>
					<Button
						onclick={sendPresentationToVerifier}
						disabled={sendingPresentation || !selectedCredentialForProof || matchingCredentials.length === 0}
					>
						{sendingPresentation ? 'Sending...' : '✓ Send Proof'}
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
