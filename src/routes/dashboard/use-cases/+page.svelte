<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { acapyClient } from '$lib/acapy/client';
	import { authStore } from '$lib/stores/auth.svelte';

	let availableUseCases = $state<any[]>([]);
	let loading = $state(true);

	// Map schema names to use case templates
	const schemaMapping: Record<string, any> = {
		'Passport': { id: 'passport', icon: '🛂', color: 'blue', issuer: 'Government Immigration' },
		'National ID': { id: 'national-id', icon: '🪪', color: 'green', issuer: 'Government Civil Registry' },
		'Driver License': { id: 'drivers-license', icon: '🚗', color: 'yellow', issuer: 'Police Traffic Department' },
		'Bachelor Degree': { id: 'diploma', icon: '🎓', color: 'purple', issuer: 'University' },
		'Health Insurance': { id: 'health-insurance', icon: '🏥', color: 'red', issuer: 'Health Insurance Company' }
	};

	onMount(async () => {
		await loadAvailableCredentials();
	});

	async function loadAvailableCredentials() {
		if (!authStore.token) return;

		loading = true;
		try {
			// Fetch credential definitions using logged-in issuer's token
			const response = await acapyClient.getCredentialDefinitions(authStore.token) as any;
			console.log('CredDefs response:', response);
			
			if (response.credential_definition_ids && response.credential_definition_ids.length > 0) {
				// Fetch details for each cred def
				const credDefDetails = await Promise.all(
					response.credential_definition_ids.map(async (credDefId: string) => {
						try {
							const detail = await acapyClient.getCredDefById(authStore.token!, credDefId);
							return detail;
						} catch (err) {
							console.error('Failed to load credDef', credDefId, ':', err);
							return null;
						}
					})
				);

				// Fetch schemas to get attribute names
				const schemasResponse = await acapyClient.getSchemas(authStore.token) as any;
				
				const schemas: Record<string, any> = {};
				if (schemasResponse.schema_ids && schemasResponse.schema_ids.length > 0) {
					await Promise.all(
						schemasResponse.schema_ids.map(async (schemaId: string) => {
							try {
								const schemaData = await acapyClient.getSchemaById(authStore.token!, schemaId);
								schemas[schemaId] = schemaData;
							} catch (err) {
								console.error('Failed to load schema:', err);
							}
						})
					);
				}

				// Map credential definitions to use cases
				availableUseCases = credDefDetails
					.filter(cd => cd !== null)
					.map((credDef: any) => {
						const credDefData = credDef.credential_definition as any;
						let schemaId = credDefData?.schemaId || credDefData?.schema_id;
						
						// If schemaId is just a sequence number, try to find the actual schema
						if (schemaId && !schemaId.includes(':')) {
							const credDefParts = credDef.credential_definition_id.split(':');
							if (credDefParts.length >= 1) {
								const issuer = credDefParts[0];
								const matchingSchemas = Object.values(schemas).filter((s: any) => 
									s.schema_id.startsWith(issuer)
								);
								if (matchingSchemas.length > 0) {
									schemaId = matchingSchemas[0].schema_id;
								}
							}
						}
						
						const schema = schemas[schemaId];
						const schemaName = schema?.schema?.name || 'Unknown';
						const template = schemaMapping[schemaName];

						if (!template) {
							console.log('No template for schema:', schemaName);
							return null;
						}

						return {
							id: template.id,
							title: schemaName,
							description: `Get your digital ${schemaName.toLowerCase()} credential`,
							icon: template.icon,
							issuer: template.issuer,
							attributes: schema?.schema?.attrNames || [],
							color: template.color,
							credDefId: credDef.credential_definition_id,
							schemaId: schemaId
						};
					})
					.filter(uc => uc !== null);
					
				console.log('Available use cases:', availableUseCases);
			}
		} catch (err) {
			console.error('Failed to load credentials:', err);
		} finally {
			loading = false;
		}
	}

	function getColorClass(color: string) {
		const colors: Record<string, string> = {
			blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
			green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
			yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
			purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
			red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
		};
		return colors[color] || colors.blue;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
	<div class="container mx-auto max-w-6xl">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
				Digital Credential Portal
			</h1>
			<p class="text-xl text-gray-600 dark:text-gray-300 mb-2">
				Get Your Verifiable Digital Credentials
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Secure • Private • Instant • Verifiable
			</p>
		</div>

		<!-- How It Works -->
		<Card class="mb-12 border-2">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<span class="text-2xl">📋</span>
					How It Works
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div class="text-center">
						<div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
							<span class="text-2xl">1️⃣</span>
						</div>
						<h3 class="font-semibold mb-2">Choose Credential</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Select the credential you want to receive
						</p>
					</div>
					<div class="text-center">
						<div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
							<span class="text-2xl">2️⃣</span>
						</div>
						<h3 class="font-semibold mb-2">Connect Wallet</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Connect with the issuer using invitation
						</p>
					</div>
					<div class="text-center">
						<div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
							<span class="text-2xl">3️⃣</span>
						</div>
						<h3 class="font-semibold mb-2">Receive Credential</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Issuer will send the credential to your wallet
						</p>
					</div>
					<div class="text-center">
						<div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
							<span class="text-2xl">4️⃣</span>
						</div>
						<h3 class="font-semibold mb-2">Use Anywhere</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Present your credential when needed
						</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Use Cases Grid -->
		<div class="mb-8">
			<h2 class="text-2xl font-bold mb-6">Available Credentials</h2>
			
			{#if loading}
				<div class="text-center py-12">
					<p class="text-gray-500">Loading available credentials...</p>
				</div>
			{:else if availableUseCases.length === 0}
				<Card class="border-2 border-yellow-200 dark:border-yellow-800">
					<CardContent class="py-12 text-center">
						<div class="text-6xl mb-4">📭</div>
						<h3 class="text-xl font-semibold mb-2">No Credentials Available Yet</h3>
						<p class="text-gray-600 dark:text-gray-400 mb-4">
							Issuers haven't set up any credential definitions yet.
						</p>
						<p class="text-sm text-gray-500">
							Are you an issuer? <a href="/login" class="text-blue-600 hover:underline">Login here</a> to set up credentials.
						</p>
					</CardContent>
				</Card>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each availableUseCases as useCase}
					<Card class="border-2 {getColorClass(useCase.color)} hover:shadow-lg transition-shadow">
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="text-4xl mb-2">{useCase.icon}</div>
									<CardTitle class="text-xl mb-2">{useCase.title}</CardTitle>
									<CardDescription>{useCase.description}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div class="space-y-4">
								<!-- Issuer -->
								<div>
									<p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
										Issued by:
									</p>
									<Badge variant="outline">{useCase.issuer}</Badge>
								</div>

								<!-- Attributes -->
								<div>
									<p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
										Credential includes:
									</p>
									<div class="flex flex-wrap gap-1">
										{#each useCase.attributes as attr}
											<Badge variant="secondary" class="text-xs">
												{attr.replace(/_/g, ' ')}
											</Badge>
										{/each}
									</div>
								</div>

								<!-- Action Button -->
								<Button 
									class="w-full" 
									onclick={() => window.location.href = `/dashboard/use-cases/${useCase.id}`}
								>
									Get This Credential →
								</Button>
							</div>
						</CardContent>
					</Card>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Benefits -->
		<Card class="border-2 border-indigo-200 dark:border-indigo-800">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<span class="text-2xl">✨</span>
					Why Digital Credentials?
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="flex gap-3">
						<div class="text-2xl">🔒</div>
						<div>
							<h3 class="font-semibold mb-1">Secure & Tamper-Proof</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Cryptographically signed by issuer, cannot be forged
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="text-2xl">🔐</div>
						<div>
							<h3 class="font-semibold mb-1">Privacy Protected</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								You control what information to share
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="text-2xl">⚡</div>
						<div>
							<h3 class="font-semibold mb-1">Instant Verification</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Verify in seconds, no manual checks needed
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="text-2xl">📱</div>
						<div>
							<h3 class="font-semibold mb-1">Always Available</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Store in your digital wallet, access anytime
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Footer -->
		<div class="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
			<p>Powered by Self-Sovereign Identity (SSI) Technology</p>
			<p class="mt-2">
				<a href="/login" class="text-blue-600 hover:underline">Issuer Login</a>
				{' • '}
				<a href="/register" class="text-blue-600 hover:underline">Create Wallet</a>
			</p>
		</div>
	</div>
</div>
