<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { authStore } from '$lib/stores/auth.svelte';

	const useCaseId = $derived($page.params.id);

	// Use case configurations
	const useCaseConfigs: Record<string, any> = {
		'passport': {
			title: 'Digital Passport',
			icon: '🛂',
			issuer: 'Government Immigration',
			description: 'Get your digital passport credential for international travel',
			schema: 'Passport',
			credDefTag: 'official',
			attributes: [
				{ name: 'passport_number', label: 'Passport Number', placeholder: 'P1234567', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'John Doe', required: true },
				{ name: 'date_of_birth', label: 'Date of Birth', placeholder: '1990-01-15', type: 'date', required: true },
				{ name: 'nationality', label: 'Nationality', placeholder: 'Indonesian', required: true },
				{ name: 'issue_date', label: 'Issue Date', placeholder: '2024-01-01', type: 'date', required: true },
				{ name: 'expiry_date', label: 'Expiry Date', placeholder: '2034-01-01', type: 'date', required: true },
				{ name: 'photo_hash', label: 'Photo Hash', placeholder: 'abc123def456', required: false }
			],
			color: 'blue',
			instructions: [
				'Prepare your physical passport',
				'Connect your digital wallet',
				'Fill in your passport information',
				'Wait for issuer to verify and issue credential'
			]
		},
		'national-id': {
			title: 'National ID (KTP)',
			icon: '🪪',
			issuer: 'Government Civil Registry',
			description: 'Get your digital national identity card',
			schema: 'National ID',
			credDefTag: 'official',
			attributes: [
				{ name: 'nik', label: 'NIK', placeholder: '1234567890123456', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'John Doe', required: true },
				{ name: 'date_of_birth', label: 'Date of Birth', placeholder: '1990-01-15', type: 'date', required: true },
				{ name: 'address', label: 'Address', placeholder: 'Jl. Example No. 123', required: true },
				{ name: 'religion', label: 'Religion', placeholder: 'Islam', required: true }
			],
			color: 'green'
		},
		'drivers-license': {
			title: 'Driver License (SIM)',
			icon: '🚗',
			issuer: 'Police Traffic Department',
			description: 'Get your digital driver license',
			schema: 'Driver License',
			credDefTag: 'official',
			attributes: [
				{ name: 'license_number', label: 'License Number', placeholder: 'SIM123456', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'John Doe', required: true },
				{ name: 'license_type', label: 'License Type', placeholder: 'A', required: true },
				{ name: 'expiry_date', label: 'Expiry Date', placeholder: '2026-12-31', type: 'date', required: true }
			],
			color: 'yellow'
		},
		'diploma': {
			title: 'University Diploma',
			icon: '🎓',
			issuer: 'University',
			description: 'Get your digital diploma certificate',
			schema: 'Bachelor Degree',
			credDefTag: 'official',
			attributes: [
				{ name: 'student_id', label: 'Student ID', placeholder: '2020001', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'Jane Smith', required: true },
				{ name: 'degree', label: 'Degree', placeholder: 'Bachelor of Computer Science', required: true },
				{ name: 'major', label: 'Major', placeholder: 'Software Engineering', required: true },
				{ name: 'gpa', label: 'GPA', placeholder: '3.85', type: 'number', required: true },
				{ name: 'graduation_date', label: 'Graduation Date', placeholder: '2024-06-15', type: 'date', required: true }
			],
			color: 'purple'
		},
		'health-insurance': {
			title: 'Health Insurance Card',
			icon: '🏥',
			issuer: 'Health Insurance Company',
			description: 'Get your digital health insurance credential',
			schema: 'Health Insurance',
			credDefTag: 'official',
			attributes: [
				{ name: 'policy_number', label: 'Policy Number', placeholder: 'POL123456', required: true },
				{ name: 'holder_name', label: 'Holder Name', placeholder: 'John Doe', required: true },
				{ name: 'coverage_type', label: 'Coverage Type', placeholder: 'Comprehensive', required: true },
				{ name: 'valid_until', label: 'Valid Until', placeholder: '2025-12-31', type: 'date', required: true }
			],
			color: 'red'
		}
	};

	let useCase = $derived(useCaseConfigs[useCaseId]);
	let currentStep = $state(1);
	let invitationUrl = $state('');
	let invitationQrCode = $state('');
	let generatingInvitation = $state(false);
	let connectionEstablished = $state(false);
	let formData = $state<Record<string, string>>({});
	let submitting = $state(false);
	let showSuccessDialog = $state(false);
	let loadingSchema = $state(false);
	let realSchemaAttributes = $state<any[]>([]);
	let credDefId = $state('');

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

	onMount(async () => {
		await Promise.all([
			generateInvitation(),
			loadSchemaAttributes()
		]);
	});

	async function loadSchemaAttributes() {
		if (!authStore.token || !useCase) return;

		loadingSchema = true;
		try {
			console.log('🔍 Loading schema for use case:', useCase.schema);
			
			// Get credential definitions
			const credDefsResponse = await fetch('/api/acapy/anoncreds/credential-definitions', {
				headers: { 'Authorization': `Bearer ${authStore.token}` }
			});
			const credDefsData = await credDefsResponse.json();
			console.log('📋 Found credential definitions:', credDefsData.credential_definition_ids?.length || 0);

			// Get all schemas first
			const schemasResponse = await fetch('/api/acapy/anoncreds/schemas', {
				headers: { 'Authorization': `Bearer ${authStore.token}` }
			});
			const schemasData = await schemasResponse.json();
			console.log('📚 Found schemas:', schemasData.schema_ids?.length || 0);

			// Find matching credential definition by schema name
			if (credDefsData.credential_definition_ids) {
				for (const id of credDefsData.credential_definition_ids) {
					const credDefResponse = await fetch(`/api/acapy/anoncreds/credential-definition/${id}`, {
						headers: { 'Authorization': `Bearer ${authStore.token}` }
					});
					const credDefData = await credDefResponse.json();
					const schemaId = credDefData.credential_definition?.schemaId;
					
					console.log('🔎 Checking cred def:', id);
					console.log('   Schema ID:', schemaId);
					
					// Get schema details
					if (schemaId) {
						const schemaResponse = await fetch(`/api/acapy/anoncreds/schema/${schemaId}`, {
							headers: { 'Authorization': `Bearer ${authStore.token}` }
						});
						const schemaData = await schemaResponse.json();
						const schemaName = schemaData.schema?.name;
						
						console.log('   Schema name:', schemaName);
						console.log('   Looking for:', useCase.schema);
						
						// Match by schema name (case insensitive, ignore spaces)
						const normalizedSchemaName = schemaName?.toLowerCase().replace(/\s+/g, '');
						const normalizedUseCaseName = useCase.schema.toLowerCase().replace(/\s+/g, '');
						
						if (normalizedSchemaName === normalizedUseCaseName) {
							console.log('✅ MATCH FOUND!');
							credDefId = id;
							
							if (schemaData.schema?.attrNames) {
								console.log('📝 Attributes:', schemaData.schema.attrNames);
								
								// Map schema attributes to form fields
								realSchemaAttributes = schemaData.schema.attrNames.map((attrName: string) => ({
									name: attrName,
									label: attrName.split('_').map((w: string) => 
										w.charAt(0).toUpperCase() + w.slice(1)
									).join(' '),
									placeholder: `Enter ${attrName.replace(/_/g, ' ')}`,
									required: true,
									type: attrName.includes('date') ? 'date' : 
										   attrName.includes('gpa') || attrName.includes('number') ? 'number' : 'text'
								}));
								
								toast.success(`Schema loaded: ${schemaData.schema.attrNames.length} attributes`);
							}
							break;
						}
					}
				}
			}

			if (realSchemaAttributes.length === 0) {
				toast.warning('Schema not found, using default attributes');
				realSchemaAttributes = useCase.attributes;
			}
		} catch (err) {
			console.error('Failed to load schema:', err);
			toast.error('Failed to load schema, using default attributes');
			realSchemaAttributes = useCase.attributes;
		} finally {
			loadingSchema = false;
		}
	}

	async function generateInvitation() {
		if (!authStore.token) {
			toast.error('Please login first');
			return;
		}

		generatingInvitation = true;
		try {
			const response = await fetch('/api/acapy/out-of-band/create-invitation', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${authStore.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
					use_public_did: false
				})
			});

			const data = await response.json();
			
			if (data.invitation_url) {
				invitationUrl = data.invitation_url;
				// Generate QR code URL using qrcode API
				invitationQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.invitation_url)}`;
				toast.success('Invitation generated!');
			}
		} catch (err) {
			console.error('Failed to generate invitation:', err);
			toast.error('Failed to generate invitation');
		} finally {
			generatingInvitation = false;
		}
	}

	function copyInvitation() {
		navigator.clipboard.writeText(invitationUrl);
		toast.success('Invitation URL copied!');
	}

	function handleConnect() {
		// For issuer side, connection happens when holder scans QR
		toast.info('Waiting for holder to scan QR code...');
	}

	async function handleSubmit() {
		// Use real schema attributes if available, otherwise use default
		const attributesToValidate = realSchemaAttributes.length > 0 ? realSchemaAttributes : useCase.attributes;
		
		// Validate required fields
		const missingFields = attributesToValidate
			.filter((attr: any) => attr.required && !formData[attr.name]?.trim())
			.map((attr: any) => attr.label);

		if (missingFields.length > 0) {
			toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
			return;
		}

		if (!authStore.token) {
			toast.error('Please login first');
			return;
		}

		submitting = true;

		try {
			// First, get the credential definition for this use case
			const credDefsResponse = await fetch('/api/acapy/anoncreds/credential-definitions', {
				headers: {
					'Authorization': `Bearer ${authStore.token}`
				}
			});
			const credDefsData = await credDefsResponse.json();

			// Find matching credential definition by schema name
			let matchingCredDefId = null;
			if (credDefsData.credential_definition_ids) {
				for (const credDefId of credDefsData.credential_definition_ids) {
					const credDefResponse = await fetch(`/api/acapy/anoncreds/credential-definition/${credDefId}`, {
						headers: {
							'Authorization': `Bearer ${authStore.token}`
						}
					});
					const credDefData = await credDefResponse.json();
					
					// Check if schema name matches
					if (credDefData.credential_definition?.schemaId?.includes(useCase.schema.replace(' ', ''))) {
						matchingCredDefId = credDefId;
						break;
					}
				}
			}

			if (!matchingCredDefId) {
				toast.error(`Credential definition for ${useCase.schema} not found. Please create it first.`);
				submitting = false;
				return;
			}

			// Get active connections to find the holder's connection
			const connectionsResponse = await fetch('/api/acapy/connections', {
				headers: {
					'Authorization': `Bearer ${authStore.token}`
				}
			});
			const connectionsData = await connectionsResponse.json();
			
			// Use the most recent active connection
			const activeConnection = connectionsData.results?.find((c: any) => c.state === 'active');
			
			if (!activeConnection) {
				toast.error('No active connection found. Please ensure holder has scanned the QR code and accepted the connection.');
				submitting = false;
				return;
			}

			// Build credential attributes from real schema or default
			const attributesToUse = realSchemaAttributes.length > 0 ? realSchemaAttributes : useCase.attributes;
			const attributes = attributesToUse.map((attr: any) => ({
				name: attr.name,
				value: String(formData[attr.name] || '')
			}));

			// Issue credential
			const issueResponse = await fetch('/api/acapy/issue-credential/send', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${authStore.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					connection_id: activeConnection.connection_id,
					filter: {
						anoncreds: {
							cred_def_id: matchingCredDefId
						}
					},
					credential_preview: {
						"@type": "issue-credential/2.0/credential-preview",
						attributes
					}
				})
			});

			if (issueResponse.ok) {
				showSuccessDialog = true;
				toast.success('Credential issued successfully!');
			} else {
				const errorData = await issueResponse.json();
				toast.error(`Failed to issue credential: ${errorData.detail || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Failed to issue credential:', err);
			toast.error('Failed to issue credential');
		} finally {
			submitting = false;
		}
	}
</script>

{#if !useCase}
	<div class="min-h-screen flex items-center justify-center">
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-gray-500">Use case not found</p>
				<Button class="mt-4 w-full" onclick={() => window.location.href = '/dashboard/use-cases'}>
					Back to Use Cases
				</Button>
			</CardContent>
		</Card>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
		<div class="container mx-auto max-w-4xl">
			<!-- Header -->
			<div class="mb-8">
				<Button variant="outline" onclick={() => window.location.href = '/dashboard/use-cases'} class="mb-4">
					← Back to Use Cases
				</Button>
				
				<div class="flex items-center gap-4 mb-4">
					<div class="text-6xl">{useCase.icon}</div>
					<div>
						<h1 class="text-4xl font-bold">{useCase.title}</h1>
						<p class="text-gray-600 dark:text-gray-400">{useCase.description}</p>
						<Badge variant="outline" class="mt-2">Issued by: {useCase.issuer}</Badge>
					</div>
				</div>
			</div>

			<!-- Progress Steps -->
			<div class="mb-8">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="flex items-center">
							<div class="w-10 h-10 rounded-full flex items-center justify-center {currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}">
								1
							</div>
							<div class="flex-1 h-1 {currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}"></div>
						</div>
						<p class="text-xs mt-1 font-semibold">Connect Wallet</p>
					</div>
					<div class="flex-1">
						<div class="flex items-center">
							<div class="w-10 h-10 rounded-full flex items-center justify-center {currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}">
								2
							</div>
							<div class="flex-1 h-1 {currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}"></div>
						</div>
						<p class="text-xs mt-1 font-semibold">Fill Information</p>
					</div>
					<div class="flex-1">
						<div class="flex items-center justify-end">
							<div class="w-10 h-10 rounded-full flex items-center justify-center {currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}">
								3
							</div>
						</div>
						<p class="text-xs mt-1 font-semibold text-right">Receive Credential</p>
					</div>
				</div>
			</div>

			<!-- Step 1: Show QR Code Invitation -->
			{#if currentStep === 1}
				<Card class="border-2 {getColorClass(useCase.color)}">
					<CardHeader>
						<CardTitle>Step 1: Share Connection Invitation</CardTitle>
						<CardDescription>Holder can scan this QR code or copy the invitation URL</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						{#if generatingInvitation}
							<div class="text-center py-8">
								<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p class="text-sm text-muted-foreground">Generating invitation...</p>
							</div>
						{:else if invitationUrl}
							<!-- QR Code Display -->
							<div class="flex flex-col items-center space-y-4">
								<div class="bg-white p-4 rounded-lg border-2 border-gray-200">
									<img 
										src={invitationQrCode} 
										alt="Connection Invitation QR Code"
										class="w-64 h-64"
									/>
								</div>
								
								<div class="text-center">
									<p class="font-semibold text-lg mb-2">📱 For Holder:</p>
									<ol class="text-sm text-muted-foreground space-y-1 text-left max-w-md">
										<li>1. Open your digital wallet app</li>
										<li>2. Scan this QR code, or</li>
										<li>3. Copy the invitation URL below</li>
										<li>4. Accept the connection in your wallet</li>
									</ol>
								</div>
							</div>

							<!-- Invitation URL -->
							<div class="space-y-2">
								<Label>Invitation URL</Label>
								<div class="flex gap-2">
									<Input
										type="text"
										value={invitationUrl}
										readonly
										class="font-mono text-xs"
									/>
									<Button onclick={copyInvitation} variant="outline">
										📋 Copy
									</Button>
								</div>
								<p class="text-xs text-muted-foreground">
									Share this URL with the holder
								</p>
							</div>

							<!-- Action Buttons -->
							<div class="flex gap-2">
								<Button onclick={generateInvitation} variant="outline" class="flex-1">
									🔄 Regenerate
								</Button>
								<Button onclick={() => currentStep = 2} class="flex-1">
									Continue to Form →
								</Button>
							</div>

							<div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
								<p class="text-sm text-blue-900 dark:text-blue-100">
									<strong>ℹ️ Note:</strong> Once the holder scans this QR code and accepts the connection, 
									you can proceed to fill in their credential information.
								</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- Step 2: Fill Holder Information -->
			{#if currentStep === 2}
				<Card class="border-2 {getColorClass(useCase.color)}">
					<CardHeader>
						<CardTitle>Step 2: Fill Holder Information</CardTitle>
						<CardDescription>Enter the credential information for the holder</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						{#if loadingSchema}
							<div class="text-center py-8">
								<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p class="text-sm text-muted-foreground">Loading schema attributes...</p>
							</div>
						{:else}
							<!-- Credential Attributes Form -->
							<div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
								<p class="text-sm text-blue-900 dark:text-blue-100">
									<strong>📋 Credential Type:</strong> {useCase.title}
								</p>
								<p class="text-xs text-blue-800 dark:text-blue-200 mt-1">
									{#if realSchemaAttributes.length > 0}
										Schema loaded: {realSchemaAttributes.length} attributes from ACA-Py
									{:else}
										Using default attributes
									{/if}
								</p>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each (realSchemaAttributes.length > 0 ? realSchemaAttributes : useCase.attributes) as attr}
									<div class="space-y-2 {attr.name === 'address' || attr.name === 'degree' ? 'md:col-span-2' : ''}">
										<Label for={attr.name}>
											{attr.label}
											{#if attr.required}
												<span class="text-red-500">*</span>
										{/if}
									</Label>
									<Input
										id={attr.name}
										type={attr.type || 'text'}
										placeholder={attr.placeholder}
										bind:value={formData[attr.name]}
										required={attr.required}
									/>
								</div>
							{/each}
						</div>

							<div class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
								<p class="text-sm text-yellow-900 dark:text-yellow-100">
									<strong>⚠️ Important:</strong> Make sure all information is accurate before issuing. 
									The credential will be sent directly to the holder's wallet.
								</p>
							</div>

							<div class="flex gap-2">
								<Button variant="outline" onclick={() => currentStep = 1}>
									← Back
								</Button>
								<Button class="flex-1" onclick={handleSubmit} disabled={submitting || loadingSchema}>
									{submitting ? 'Issuing...' : 'Issue Credential →'}
								</Button>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>

	<!-- Success Dialog -->
	<Dialog open={showSuccessDialog} onOpenChange={(open) => showSuccessDialog = open}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>✅ Credential Issued Successfully!</DialogTitle>
				<DialogDescription>The credential has been sent to the holder's wallet</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div class="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
					<p class="text-sm text-green-900 dark:text-green-100">
						<strong>✓ Credential Sent</strong>
					</p>
					<ol class="list-decimal list-inside space-y-1 text-sm text-green-800 dark:text-green-200 mt-2">
						<li>Credential offer sent to holder's wallet</li>
						<li>Holder will receive notification</li>
						<li>Holder needs to accept the credential</li>
						<li>Credential will be stored in their wallet</li>
					</ol>
				</div>

				<div class="rounded-lg border p-4">
					<p class="text-sm font-semibold mb-2">Issued Credential:</p>
					<div class="space-y-1 text-sm">
						<p><strong>Type:</strong> {useCase.title}</p>
						<p><strong>Issuer:</strong> {useCase.issuer}</p>
						<p><strong>Attributes:</strong> {useCase.attributes.length} fields</p>
						<p><strong>Status:</strong> <Badge variant="default" class="bg-green-600">Issued</Badge></p>
					</div>
				</div>

				<div class="flex gap-2">
					<Button variant="outline" class="flex-1" onclick={() => { showSuccessDialog = false; currentStep = 1; formData = {}; }}>
						Issue Another
					</Button>
					<Button class="flex-1" onclick={() => window.location.href = '/dashboard/use-cases'}>
						Back to Use Cases
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
