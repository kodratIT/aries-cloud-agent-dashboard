<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { acapyClient, type Connection, type BasicMessage } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';
	import QRCode from 'qrcode';

	let connections = $state<Connection[]>([]);
	let loading = $state(true);
	let invitation = $state<any>(null);
	let showInvitation = $state(false);
	let showCreateDialog = $state(false);
	let creatingInvitation = $state(false);
	let qrCodeDataUrl = $state<string>('');
	let connectionLabel = $state('');
	let connectionNote = $state('');
	let processingConnectionId = $state<string | null>(null);
	let showRejectDialog = $state(false);
	let connectionToReject = $state<Connection | null>(null);
	let selectedConnection = $state<Connection | null>(null);
	let showConnectionDetail = $state(false);
	let messages = $state<BasicMessage[]>([]);
	let loadingMessages = $state(false);
	let messageInput = $state('');
	let sendingMessage = $state(false);

	onMount(async () => {
		await loadConnections();
	});

	async function loadConnections() {
		if (!authStore.token) return;

		loading = true;
		try {
			const response = await acapyClient.getConnections(authStore.token);
			connections = response.results || [];
		} catch (error) {
			console.error('Failed to load connections:', error);
		} finally {
			loading = false;
		}
	}

	function openCreateDialog() {
		connectionLabel = '';
		connectionNote = '';
		showCreateDialog = true;
	}

	async function createInvitation() {
		if (!authStore.token) return;

		// Validation
		if (!connectionLabel.trim()) {
			alert('Please enter a connection label');
			return;
		}

		creatingInvitation = true;
		try {
			// Create invitation with custom label
			const invitationData = {
				alias: connectionLabel.trim(),
				my_label: connectionLabel.trim()
			};
			
			invitation = await acapyClient.createInvitation(authStore.token, invitationData);
			
			// Generate QR code
			if (invitation?.invitation_url) {
				qrCodeDataUrl = await QRCode.toDataURL(invitation.invitation_url, {
					width: 300,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#FFFFFF'
					}
				});
			}
			
			showCreateDialog = false;
			showInvitation = true;
		} catch (error) {
			console.error('Failed to create invitation:', error);
			alert('Failed to create invitation');
		} finally {
			creatingInvitation = false;
		}
	}

	function getStateColor(state: string) {
		const colors: Record<string, string> = {
			active: 'default',
			completed: 'default',
			invitation: 'secondary',
			request: 'secondary',
			response: 'secondary',
			error: 'destructive',
			abandoned: 'destructive'
		};
		return colors[state] || 'secondary';
	}

	function copyInvitationUrl() {
		if (invitation?.invitation_url) {
			navigator.clipboard.writeText(invitation.invitation_url);
			alert('Invitation URL copied to clipboard!');
		}
	}

	async function acceptConnection(connectionId: string) {
		if (!authStore.token) return;

		processingConnectionId = connectionId;
		try {
			await acapyClient.acceptConnectionRequest(connectionId, authStore.token);
			await loadConnections();
			alert('Connection accepted successfully!');
		} catch (error) {
			console.error('Failed to accept connection:', error);
			alert(`Failed to accept connection: ${error}`);
		} finally {
			processingConnectionId = null;
		}
	}

	function rejectConnection(connection: Connection) {
		connectionToReject = connection;
		showRejectDialog = true;
	}

	async function confirmReject() {
		if (!authStore.token || !connectionToReject) return;

		processingConnectionId = connectionToReject.connection_id;
		try {
			await acapyClient.rejectConnectionRequest(connectionToReject.connection_id, authStore.token);
			await loadConnections();
			showRejectDialog = false;
			connectionToReject = null;
			alert('Connection rejected successfully!');
		} catch (error) {
			console.error('Failed to reject connection:', error);
			alert(`Failed to reject connection: ${error}`);
		} finally {
			processingConnectionId = null;
		}
	}

	async function viewConnection(connection: Connection) {
		selectedConnection = connection;
		showConnectionDetail = true;
		await loadConnectionMessages();
	}

	function closeConnectionDetail() {
		showConnectionDetail = false;
		selectedConnection = null;
		messages = [];
		messageInput = '';
	}

	async function loadConnectionMessages() {
		if (!authStore.token || !selectedConnection) return;

		loadingMessages = true;
		try {
			const response = await acapyClient.getConnectionMessages(
				selectedConnection.connection_id,
				authStore.token
			);
			messages = response.results || [];
		} catch (error) {
			console.error('Failed to load messages:', error);
			messages = [];
		} finally {
			loadingMessages = false;
		}
	}

	async function sendMessage() {
		if (!authStore.token || !selectedConnection || !messageInput.trim()) return;

		sendingMessage = true;
		try {
			await acapyClient.sendBasicMessage(
				selectedConnection.connection_id,
				messageInput.trim(),
				authStore.token
			);
			
			messageInput = '';
			alert('Message sent successfully to the connected agent!');
		} catch (error) {
			console.error('Failed to send message:', error);
			alert(`Failed to send message: ${error}`);
		} finally {
			sendingMessage = false;
		}
	}

</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Connections</h1>
			<p class="text-gray-500 dark:text-gray-400">Manage your agent-to-agent connections</p>
		</div>
		<Button onclick={openCreateDialog}>
			➕ Create Invitation
		</Button>
	</div>

	<!-- Create Connection Dialog -->
	<Dialog open={showCreateDialog} onOpenChange={(open) => showCreateDialog = open}>
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle>Create New Connection</DialogTitle>
				<DialogDescription>Enter details for this connection invitation</DialogDescription>
			</DialogHeader>
			<form onsubmit={(e) => { e.preventDefault(); createInvitation(); }} class="space-y-4">
				<div class="space-y-2">
					<label for="label" class="text-sm font-medium">
						Connection Label *
					</label>
					<input
						id="label"
						type="text"
						bind:value={connectionLabel}
						placeholder="e.g., John Doe, Company ABC, Mobile Wallet"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						disabled={creatingInvitation}
						required
					/>
					<p class="text-xs text-gray-500">
						Give this connection a meaningful name so you can identify it later
					</p>
				</div>

				<div class="space-y-2">
					<label for="note" class="text-sm font-medium">
						Note (Optional)
					</label>
					<textarea
						id="note"
						bind:value={connectionNote}
						placeholder="e.g., Connection for credential issuance, Verification partner"
						class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						disabled={creatingInvitation}
					></textarea>
					<p class="text-xs text-gray-500">
						Add any additional notes about this connection (for your reference only)
					</p>
				</div>

				<div class="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
					<p class="font-medium text-blue-900 dark:text-blue-100">💡 Tip:</p>
					<p class="mt-1 text-blue-800 dark:text-blue-200">
						Use descriptive labels like "Alice - Mobile Wallet" or "Company XYZ - HR Department" to easily identify connections later.
					</p>
				</div>

				<div class="flex justify-end gap-2">
					<Button 
						type="button"
						variant="outline" 
						onclick={() => showCreateDialog = false}
						disabled={creatingInvitation}
					>
						Cancel
					</Button>
					<Button 
						type="submit"
						disabled={creatingInvitation || !connectionLabel.trim()}
					>
						{creatingInvitation ? 'Creating...' : '✓ Create Invitation'}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>

	<!-- Reject Confirmation Dialog -->
	{#if showRejectDialog && connectionToReject}
		<Dialog open={showRejectDialog} onOpenChange={(open) => showRejectDialog = open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reject Connection Request</DialogTitle>
					<DialogDescription>Are you sure you want to reject this connection request?</DialogDescription>
				</DialogHeader>
				<div class="space-y-4">
					<div class="rounded-lg bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
						<p class="font-medium text-yellow-900 dark:text-yellow-100">⚠️ Warning</p>
						<p class="mt-1 text-yellow-800 dark:text-yellow-200">
							This action will permanently delete the connection request. This cannot be undone.
						</p>
					</div>
					
					<div>
						<p class="text-sm font-medium">Connection Details:</p>
						<div class="mt-2 rounded bg-gray-100 p-3 dark:bg-gray-800">
							<p class="text-sm">
								<span class="font-medium">Label:</span> {connectionToReject.their_label || 'Unknown'}
							</p>
							<p class="mt-1 text-xs text-gray-500">
								<span class="font-medium">ID:</span> {connectionToReject.connection_id}
							</p>
						</div>
					</div>

					<div class="flex justify-end gap-2">
						<Button 
							variant="outline" 
							onclick={() => showRejectDialog = false}
							disabled={processingConnectionId !== null}
						>
							Cancel
						</Button>
						<Button 
							variant="destructive"
							onclick={confirmReject}
							disabled={processingConnectionId !== null}
						>
							{processingConnectionId !== null ? 'Rejecting...' : 'Confirm Reject'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	{/if}

	<!-- Connection Detail Dialog -->
	{#if showConnectionDetail && selectedConnection}
		<Dialog open={showConnectionDetail} onOpenChange={(open) => !open && closeConnectionDetail()}>
			<DialogContent class="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle>Connection Details</DialogTitle>
					<DialogDescription>
						{selectedConnection.their_label || 'Unknown Connection'}
					</DialogDescription>
				</DialogHeader>
				
				<div class="space-y-4 overflow-y-auto flex-1">
					<!-- Connection Info Section -->
					<div class="rounded-lg border p-4">
						<h3 class="font-medium mb-3">Connection Information</h3>
						<div class="space-y-2 text-sm">
							<div class="flex items-start">
								<span class="font-medium w-24">ID:</span>
								<code class="flex-1 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded break-all">
									{selectedConnection.connection_id}
								</code>
							</div>
							<div class="flex items-center">
								<span class="font-medium w-24">State:</span>
								<Badge variant={getStateColor(selectedConnection.state)}>
									{selectedConnection.state}
								</Badge>
							</div>
							<div class="flex items-center">
								<span class="font-medium w-24">Their Label:</span>
								<span>{selectedConnection.their_label || 'N/A'}</span>
							</div>
							<div class="flex items-center">
								<span class="font-medium w-24">Created:</span>
								<span>{new Date(selectedConnection.created_at).toLocaleString()}</span>
							</div>
							{#if selectedConnection.updated_at}
								<div class="flex items-center">
									<span class="font-medium w-24">Updated:</span>
									<span>{new Date(selectedConnection.updated_at).toLocaleString()}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Messages Section -->
					<div class="rounded-lg border p-4">
						<div class="flex items-center justify-between mb-3">
							<h3 class="font-medium">Send Message</h3>
						</div>
						
						<div class="mb-3 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
							<p class="text-blue-900 dark:text-blue-100">
								ℹ️ <span class="font-medium">Note:</span> Basic messages are sent directly to the connected agent. 
								Message history is not stored by default in ACA-Py.
							</p>
						</div>
						
						<div class="h-48 overflow-y-auto border rounded p-3 bg-gray-50 dark:bg-gray-900">
							{#if loadingMessages}
								<div class="flex items-center justify-center h-full text-gray-500">
									Loading messages...
								</div>
							{:else if messages.length === 0}
								<div class="flex items-center justify-center h-full text-center text-gray-500">
									<div>
										<p class="text-sm">Messages sent through this interface will be delivered to the connected agent.</p>
										<p class="text-xs mt-2 text-gray-400">To view message history, webhook integration is required.</p>
									</div>
								</div>
							{:else}
								<div class="space-y-3">
									{#each messages as message}
										<div class="flex {message.state === 'sent' ? 'justify-end' : 'justify-start'}">
											<div class="max-w-[70%] rounded-lg p-3 {message.state === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}">
												<p class="text-sm break-words">{message.content}</p>
												<p class="text-xs mt-1 opacity-70">
													{new Date(message.sent_time).toLocaleTimeString()}
												</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Message Input (only for active connections) -->
					{#if selectedConnection.state === 'active' || selectedConnection.state === 'completed'}
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={messageInput}
								placeholder="Type a message..."
								class="flex-1 rounded border px-3 py-2 text-sm dark:bg-gray-800"
								onkeydown={(e) => e.key === 'Enter' && !sendingMessage && messageInput.trim() && sendMessage()}
								disabled={sendingMessage}
							/>
							<Button 
								onclick={sendMessage}
								disabled={sendingMessage || !messageInput.trim()}
							>
								{sendingMessage ? 'Sending...' : '📤 Send'}
							</Button>
						</div>
					{:else}
						<div class="text-center text-sm text-gray-500 py-2 bg-gray-50 dark:bg-gray-900 rounded">
							Connection must be active to send messages
						</div>
					{/if}
				</div>
			</DialogContent>
		</Dialog>
	{/if}

	<!-- Invitation Dialog -->
	{#if showInvitation && invitation}
		<Dialog open={showInvitation} onOpenChange={(open) => showInvitation = open}>
			<DialogContent class="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Connection Invitation Created</DialogTitle>
					<DialogDescription>Share this invitation to establish a connection</DialogDescription>
				</DialogHeader>
				<div class="space-y-4">
					<!-- Connection Info -->
					<div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
						<div class="flex items-start gap-3">
							<div class="text-2xl">🔗</div>
							<div class="flex-1">
								<p class="font-semibold text-blue-900 dark:text-blue-100">Connection Label:</p>
								<p class="text-lg font-medium text-blue-800 dark:text-blue-200">{connectionLabel}</p>
								{#if connectionNote}
									<p class="mt-2 text-sm text-blue-700 dark:text-blue-300">
										<span class="font-medium">Note:</span> {connectionNote}
									</p>
								{/if}
							</div>
						</div>
					</div>
					<!-- QR Code Display -->
					{#if qrCodeDataUrl}
						<div class="flex justify-center">
							<div class="rounded-lg border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
								<img src={qrCodeDataUrl} alt="Invitation QR Code" class="h-auto w-full max-w-[300px]" />
								<p class="mt-2 text-center text-xs text-gray-500">Scan dengan wallet Anda</p>
							</div>
						</div>
					{/if}

					<div>
						<p class="mb-2 text-sm font-medium">Invitation URL:</p>
						<div class="flex gap-2">
							<input
								type="text"
								readonly
								value={invitation.invitation_url}
								class="flex-1 rounded border bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
							/>
							<Button size="sm" onclick={copyInvitationUrl}>Copy</Button>
						</div>
					</div>

					<div>
						<p class="mb-2 text-sm font-medium">Invitation ID:</p>
						<code class="block rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
							{invitation.invi_msg_id}
						</code>
					</div>

					<div class="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
						<p class="font-medium text-blue-900 dark:text-blue-100">💡 Cara menggunakan:</p>
						<ul class="mt-2 list-inside list-disc space-y-1 text-blue-800 dark:text-blue-200">
							<li>Scan QR code dengan wallet mobile Anda</li>
							<li>Atau bagikan invitation URL ke pihak lain</li>
							<li>Setelah diterima, koneksi akan muncul di daftar Anda</li>
						</ul>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	{/if}

	<!-- Connections List -->
	<Card>
		<CardHeader>
			<CardTitle>All Connections ({connections.length})</CardTitle>
			<CardDescription>List of all your agent connections</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading connections...</div>
			{:else if connections.length === 0}
				<div class="py-8 text-center">
					<p class="text-gray-500">No connections yet</p>
					<p class="mt-2 text-sm text-gray-400">Create an invitation to get started</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each connections as connection}
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
										<span class="text-lg">👤</span>
									</div>
									<div>
										<p class="font-medium">
											{connection.their_label || 'Unknown'}
										</p>
										<p class="text-xs text-gray-500">
											ID: {connection.connection_id.substring(0, 20)}...
										</p>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Badge variant={getStateColor(connection.state)}>
									{connection.state}
								</Badge>
								{#if connection.state === 'request'}
									<Button 
										variant="default" 
										size="sm"
										onclick={() => acceptConnection(connection.connection_id)}
										disabled={processingConnectionId === connection.connection_id}
									>
										{processingConnectionId === connection.connection_id ? 'Accepting...' : '✓ Accept'}
									</Button>
									<Button 
										variant="destructive" 
										size="sm"
										onclick={() => rejectConnection(connection)}
										disabled={processingConnectionId === connection.connection_id}
									>
										{processingConnectionId === connection.connection_id ? 'Rejecting...' : '✗ Reject'}
									</Button>
								{:else}
									<Button 
										variant="outline" 
										size="sm"
										onclick={() => viewConnection(connection)}
									>
										View
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
