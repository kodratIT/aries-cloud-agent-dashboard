<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { acapyClient } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';

	let walletName = $state('');
	let walletKey = $state('');
	let confirmWalletKey = $state('');
	let organizationName = $state('');
	let loading = $state(false);
	let error = $state('');
	let showSuccess = $state(false);
	let createdWalletId = $state('');

	async function handleRegister() {
		error = '';

		// Validation
		if (!walletName || !walletKey || !organizationName) {
			error = 'All fields are required';
			return;
		}

		if (walletKey !== confirmWalletKey) {
			error = 'Wallet keys do not match';
			return;
		}

		if (walletKey.length < 8) {
			error = 'Wallet key must be at least 8 characters';
			return;
		}

		loading = true;

		try {
			const response = await acapyClient.createWallet({
				wallet_name: walletName,
				wallet_key: walletKey,
				label: organizationName,
				wallet_type: 'askar-anoncreds'  // Use askar-anoncreds profile
			});

			createdWalletId = response.wallet_id;
			showSuccess = true;

			// Auto login
			authStore.login(response.wallet_id, response.token);

			// Redirect after 3 seconds
			setTimeout(() => {
				goto('/dashboard');
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to create wallet';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Register New Tenant</CardTitle>
			<CardDescription>Create your ACA-Py wallet to get started</CardDescription>
		</CardHeader>
		<CardContent>
			{#if showSuccess}
				<div class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
					<h3 class="mb-2 font-semibold text-green-800 dark:text-green-200">
						✅ Wallet Created Successfully!
					</h3>
					<div class="space-y-2 text-sm text-green-700 dark:text-green-300">
						<p><strong>⚠️ IMPORTANT: Save this information!</strong></p>
						<div class="rounded bg-white p-3 font-mono dark:bg-gray-800">
							<p class="mb-1"><strong>Wallet ID:</strong></p>
							<p class="break-all text-xs">{createdWalletId}</p>
							<p class="mb-1 mt-2"><strong>Wallet Key:</strong></p>
							<p class="break-all text-xs">{walletKey}</p>
						</div>
						<p class="text-xs">You need both to login. Keep them safe!</p>
						<p class="text-xs">Redirecting to dashboard...</p>
					</div>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-4">
					{#if error}
						<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
							{error}
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="organizationName">Organization Name</Label>
						<Input
							id="organizationName"
							type="text"
							placeholder="PT. Example Corp"
							bind:value={organizationName}
							disabled={loading}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="walletName">Wallet Name (Username)</Label>
						<Input
							id="walletName"
							type="text"
							placeholder="john_doe_wallet"
							bind:value={walletName}
							disabled={loading}
							required
						/>
						<p class="text-xs text-gray-500">This will be your wallet identifier</p>
					</div>

					<div class="space-y-2">
						<Label for="walletKey">Wallet Key (Password)</Label>
						<Input
							id="walletKey"
							type="password"
							placeholder="Enter secure wallet key"
							bind:value={walletKey}
							disabled={loading}
							required
						/>
						<p class="text-xs text-gray-500">Minimum 8 characters. Keep this safe!</p>
					</div>

					<div class="space-y-2">
						<Label for="confirmWalletKey">Confirm Wallet Key</Label>
						<Input
							id="confirmWalletKey"
							type="password"
							placeholder="Re-enter wallet key"
							bind:value={confirmWalletKey}
							disabled={loading}
							required
						/>
					</div>

					<div class="space-y-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
						<p><strong>⚠️ Important:</strong></p>
						<ul class="ml-4 list-disc space-y-1">
							<li>Your Wallet ID and Wallet Key are like your username and password</li>
							<li>You MUST save them - they cannot be recovered if lost!</li>
							<li>Wallet will be created with <strong>askar-anoncreds</strong> profile for AnonCreds support</li>
						</ul>
					</div>

					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Creating Wallet...' : 'Create Wallet'}
					</Button>

					<div class="text-center text-sm">
						Already have a wallet?
						<a href="/login" class="text-blue-600 hover:underline dark:text-blue-400">Login here</a>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</div>
