<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}

	const menuItems = [
		{ href: '/dashboard', label: 'Overview', icon: '📊' },
		{ href: '/dashboard/use-cases', label: 'Use Cases Demo', icon: '🎯' },
		{ href: '/dashboard/requests', label: 'Requests', icon: '📬' },
		{ href: '/dashboard/connections', label: 'Connections', icon: '🔗' },
		{ href: '/dashboard/credentials', label: 'Credentials', icon: '🎫' },
		{ href: '/dashboard/verifications', label: 'Verifications', icon: '🔍' },
		{ href: '/dashboard/schemas', label: 'Schemas', icon: '📋' },
		{ href: '/dashboard/cred-defs', label: 'Cred Definitions', icon: '📝' },
		{ href: '/dashboard/wallet', label: 'Wallet & DIDs', icon: '💼' }
	];
</script>

{#if authStore.isAuthenticated}
	<div class="flex h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Sidebar -->
		<aside class="w-64 border-r bg-white dark:bg-gray-800">
			<div class="flex h-full flex-col">
				<!-- Logo/Header -->
				<div class="p-6">
					<h1 class="text-xl font-bold">ACA-Py Dashboard</h1>
					<p class="text-xs text-gray-500 dark:text-gray-400">Multi-Tenant Management</p>
				</div>

				<Separator />

				<!-- Wallet Info -->
				<div class="p-4">
					<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
						<p class="text-xs text-gray-500 dark:text-gray-400">Wallet ID</p>
						<div class="flex items-center gap-2">
							<p class="flex-1 truncate text-sm font-mono">{authStore.walletId}</p>
							<button
								onclick={() => {
									navigator.clipboard.writeText(authStore.walletId || '');
									toast.success('Wallet ID copied!');
								}}
								class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
								title="Copy Wallet ID"
							>
								📋
							</button>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Navigation -->
				<nav class="flex-1 space-y-1 p-4">
					{#each menuItems as item}
						<a
							href={item.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
								{$page.url.pathname === item.href
								? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
								: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}"
						>
							<span class="text-lg">{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/each}
				</nav>

				<Separator />

				<!-- Logout -->
				<div class="p-4">
					<Button variant="outline" class="w-full" onclick={handleLogout}>
						🚪 Logout
					</Button>
				</div>
			</div>
		</aside>

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto">
			<div class="container mx-auto p-6">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
