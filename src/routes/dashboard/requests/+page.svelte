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

	// Use case metadata
	const useCaseMetadata: Record<string, any> = {
		'passport': { name: 'Digital Passport', icon: '🛂' },
		'national-id': { name: 'National ID (KTP)', icon: '🪪' },
		'drivers-license': { name: 'Driver License (SIM)', icon: '🚗' },
		'diploma': { name: 'University Diploma', icon: '🎓' },
		'health-insurance': { name: 'Health Insurance Card', icon: '🏥' }
	};

	let pendingRequests = $state<any[]>([]);
	let loading = $state(true);

	let connections = $state<any[]>([]);
	let credDefs = $state<any[]>([]);
	let selectedRequest = $state<any>(null);
	let showIssueDialog = $state(false);
	let issuing = $state(false);

	onMount(async () => {
		await Promise.all([
			loadPendingRequests(),
			loadConnections(),
			loadCredDefs()
		]);
		loading = false;
	});

	async function loadPendingRequests() {
		try {
			const response = await fetch('/api/credential-requests?status=pending');
			const data = await response.json();
			
			// Map requests to include metadata
			pendingRequests = data.requests.map((req: any) => {
				const metadata = useCaseMetadata[req.use_case_id] || { name: req.use_case_id, icon: '📄' };
				return {
					id: req.id,
					type: req.use_case_id,
					typeName: metadata.name,
					icon: metadata.icon,
					holderName: req.holder_name,
					connectionId: req.connection_id,
					data: req.request_data,
					status: req.status,
					createdAt: req.created_at
				};
			});
		} catch (err) {
			console.error('Failed to load requests:', err);
			toast.error('Failed to load requests');
		}
	}

	async function loadConnections() {
		if (!authStore.token) return;

		try {
			const response = await acapyClient.getConnections(authStore.token) as any;
			connections = (response.results || []).filter((c: any) => c.state === 'active');
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
				credDefs = credDefDetails.filter(c => c !== null);
			}
		} catch (err) {
			console.error('Failed to load credential definitions:', err);
		}
	}

	function openIssueDialog(request: any) {
		selectedRequest = request;
		showIssueDialog = true;
	}

	async function issueCredential() {
		if (!selectedRequest || !authStore.token) return;

		issuing = true;
		try {
			// Find matching credential definition
			const credDef = credDefs.find(cd => 
				cd.credential_definition.tag === 'official' || 
				cd.credential_definition.tag === selectedRequest.type
			);

			if (!credDef) {
				toast.error('Credential definition not found');
				return;
			}

			// Build credential attributes
			const attributes = Object.entries(selectedRequest.data).map(([name, value]) => ({
				name,
				value: String(value)
			}));

			const requestBody = {
				connection_id: selectedRequest.connectionId,
				filter: {
					anoncreds: {
						cred_def_id: credDef.credential_definition_id
					}
				},
				credential_preview: {
					"@type": "issue-credential/2.0/credential-preview",
					attributes
				}
			};

			console.log('Issuing credential:', requestBody);
			await acapyClient.issueCredential(authStore.token, requestBody);

			// Update request status in backend
			await fetch('/api/credential-requests', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: selectedRequest.id, status: 'issued' })
			});

			// Update local state
			pendingRequests = pendingRequests.filter(r => r.id !== selectedRequest.id);

			toast.success('Credential issued successfully!');
			showIssueDialog = false;
		} catch (err: any) {
			console.error('Failed to issue credential:', err);
			toast.error('Failed to issue credential', {
				description: err.message || 'Unknown error'
			});
		} finally {
			issuing = false;
		}
	}

	function rejectRequest(requestId: string) {
		pendingRequests = pendingRequests.map(r => 
			r.id === requestId ? { ...r, status: 'rejected' } : r
		);
		toast.success('Request rejected');
	}

	function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
		const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			'pending': 'secondary',
			'issued': 'default',
			'rejected': 'destructive'
		};
		return colors[status] || 'outline';
	}

	let filteredRequests = $derived(pendingRequests.filter(r => r.status === 'pending'));
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Credential Requests</h1>
			<p class="text-gray-500 dark:text-gray-400">Review and issue credentials to holders</p>
		</div>
		<Badge variant="secondary" class="text-lg px-4 py-2">
			{filteredRequests.length} Pending
		</Badge>
	</div>

	<!-- Statistics -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<Card>
			<CardContent class="pt-6">
				<div class="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
					{pendingRequests.filter(r => r.status === 'pending').length}
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">Pending Requests</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="pt-6">
				<div class="text-2xl font-bold text-green-600 dark:text-green-500">
					{pendingRequests.filter(r => r.status === 'issued').length}
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">Issued</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="pt-6">
				<div class="text-2xl font-bold text-red-600 dark:text-red-500">
					{pendingRequests.filter(r => r.status === 'rejected').length}
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">Rejected</p>
			</CardContent>
		</Card>
	</div>

	<!-- Pending Requests -->
	<Card>
		<CardHeader>
			<CardTitle>Pending Requests</CardTitle>
			<CardDescription>Review and approve credential requests from holders</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading requests...</div>
			{:else if filteredRequests.length === 0}
				<div class="py-8 text-center">
					<p class="text-gray-500">No pending requests</p>
					<p class="text-sm text-gray-400 mt-2">Requests will appear here when holders submit them</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each filteredRequests as request}
						<div class="rounded-lg border p-4">
							<div class="flex items-start justify-between">
								<div class="flex gap-4 flex-1">
									<div class="text-4xl">{request.icon}</div>
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<h3 class="font-semibold text-lg">{request.typeName}</h3>
											<Badge variant={getStatusColor(request.status)}>
												{request.status}
											</Badge>
										</div>
										<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
											Requested by: <strong>{request.holderName}</strong>
										</p>
										
										<!-- Data Preview -->
										<div class="grid grid-cols-2 gap-2 text-sm">
											{#each Object.entries(request.data).slice(0, 4) as [key, value]}
												<div>
													<span class="text-gray-500">{key.replace(/_/g, ' ')}:</span>
													<span class="ml-2 font-medium">{value}</span>
												</div>
											{/each}
										</div>

										<p class="text-xs text-gray-400 mt-3">
											Submitted: {new Date(request.createdAt).toLocaleString()}
										</p>
									</div>
								</div>

								<div class="flex gap-2">
									<Button
										size="sm"
										onclick={() => openIssueDialog(request)}
									>
										✓ Issue
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onclick={() => rejectRequest(request.id)}
									>
										✗ Reject
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
				💡 How It Works
			</h3>
			<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
				<li>✓ Holders submit credential requests via public portal</li>
				<li>✓ Review the information provided by holders</li>
				<li>✓ Issue credential if information is valid</li>
				<li>✓ Credential will be sent to holder's wallet automatically</li>
			</ul>
		</CardContent>
	</Card>
</div>

<!-- Issue Credential Dialog -->
{#if selectedRequest}
	<Dialog open={showIssueDialog} onOpenChange={(open) => showIssueDialog = open}>
		<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Issue {selectedRequest.typeName}</DialogTitle>
				<DialogDescription>Review and confirm credential issuance</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<!-- Holder Info -->
				<div class="rounded-lg border p-4">
					<h3 class="font-semibold mb-3">Holder Information</h3>
					<p><strong>Name:</strong> {selectedRequest.holderName}</p>
					<p class="text-sm text-gray-500">Connection ID: {selectedRequest.connectionId}</p>
				</div>

				<!-- Credential Data -->
				<div class="rounded-lg border p-4">
					<h3 class="font-semibold mb-3">Credential Data</h3>
					<div class="space-y-2">
						{#each Object.entries(selectedRequest.data) as [key, value]}
							<div class="flex justify-between border-b py-2 last:border-b-0">
								<span class="font-medium">{key.replace(/_/g, ' ')}:</span>
								<span>{value}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Warning -->
				<div class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
					<p class="text-sm text-yellow-900 dark:text-yellow-100">
						<strong>⚠️ Important:</strong> Please verify all information is correct before issuing.
						Issued credentials cannot be modified, only revoked.
					</p>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-2">
					<Button
						variant="outline"
						onclick={() => showIssueDialog = false}
						disabled={issuing}
					>
						Cancel
					</Button>
					<Button
						onclick={issueCredential}
						disabled={issuing}
					>
						{issuing ? 'Issuing...' : 'Confirm & Issue'}
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
