<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { acapyClient } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';

	let walletId = $state('');
	let walletKey = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		error = '';

		if (!walletId || !walletKey) {
			error = 'Wallet ID and Wallet Key are required';
			return;
		}

		loading = true;

		try {
			const response = await acapyClient.getWalletToken(walletId, walletKey);
			
			// Save to store
			authStore.login(walletId, response.token);

			// Redirect to dashboard
			goto('/dashboard');
		} catch (err: any) {
			error = 'Invalid Wallet ID or Wallet Key';
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Login to Your Wallet</CardTitle>
			<CardDescription>Enter your Wallet ID and Wallet Key to access your dashboard</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
				{#if error}
					<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
						{error}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="walletId">Wallet ID</Label>
					<Input
						id="walletId"
						type="text"
						placeholder="abc-123-def-456"
						bind:value={walletId}
						disabled={loading}
						required
					/>
					<p class="text-xs text-gray-500">The wallet ID you received during registration</p>
				</div>

				<div class="space-y-2">
					<Label for="walletKey">Wallet Key</Label>
					<Input
						id="walletKey"
						type="password"
						placeholder="Enter your wallet key"
						bind:value={walletKey}
						disabled={loading}
						required
					/>
					<p class="text-xs text-gray-500">Your secure wallet password</p>
				</div>

				<div class="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
					<strong>💡 Tip:</strong> Your Wallet ID and Wallet Key were provided when you registered.
					If you lost them, you cannot recover your wallet.
				</div>

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Logging in...' : 'Login'}
				</Button>

				<div class="text-center text-sm">
					Don't have a wallet?
					<a href="/register" class="text-blue-600 hover:underline dark:text-blue-400">Register here</a>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
