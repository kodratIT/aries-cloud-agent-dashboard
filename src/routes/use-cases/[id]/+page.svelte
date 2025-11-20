<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';

	const useCaseId = $derived($page.params.id);

	const useCaseConfigs: Record<string, any> = {
		'passport': {
			title: 'Digital Passport', icon: '🛂', issuer: 'Government Immigration',
			description: 'Get your digital passport credential for international travel',
			schema: 'Passport', credDefTag: 'official',
			attributes: [
				{ name: 'passport_number', label: 'Passport Number', placeholder: 'P1234567', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'John Doe', required: true },
				{ name: 'date_of_birth', label: 'Date of Birth', placeholder: '1990-01-15', type: 'date', required: true },
				{ name: 'nationality', label: 'Nationality', placeholder: 'Indonesian', required: true },
				{ name: 'issue_date', label: 'Issue Date', placeholder: '2024-01-01', type: 'date', required: true },
				{ name: 'expiry_date', label: 'Expiry Date', placeholder: '2034-01-01', type: 'date', required: true }
			],
			gradient: 'from-blue-500 to-purple-600'
		},
		'national-id': {
			title: 'National ID (KTP)', icon: '🪪', issuer: 'Government Civil Registry',
			description: 'Get your digital national identity card',
			schema: 'National ID', credDefTag: 'official',
			attributes: [
				{ name: 'nik', label: 'NIK', placeholder: '1234567890123456', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'John Doe', required: true },
				{ name: 'date_of_birth', label: 'Date of Birth', placeholder: '1990-01-15', type: 'date', required: true },
				{ name: 'address', label: 'Address', placeholder: 'Jl. Example No. 123', required: true },
				{ name: 'religion', label: 'Religion', placeholder: 'Islam', required: true }
			],
			gradient: 'from-green-500 to-teal-600'
		},
		'drivers-license': {
			title: 'Driver License (SIM)', icon: '🚗', issuer: 'Police Traffic Department',
			description: 'Get your digital driver license',
			schema: 'Driver License', credDefTag: 'official',
			attributes: [
				{ name: 'license_number', label: 'License Number', placeholder: 'SIM123456', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'John Doe', required: true },
				{ name: 'license_type', label: 'License Type', placeholder: 'A', required: true },
				{ name: 'expiry_date', label: 'Expiry Date', placeholder: '2026-12-31', type: 'date', required: true }
			],
			gradient: 'from-orange-500 to-red-600'
		},
		'diploma': {
			title: 'University Diploma', icon: '🎓', issuer: 'University',
			description: 'Get your digital diploma certificate',
			schema: 'Bachelor Degree', credDefTag: 'official',
			attributes: [
				{ name: 'student_id', label: 'Student ID', placeholder: '2020001', required: true },
				{ name: 'full_name', label: 'Full Name', placeholder: 'Jane Smith', required: true },
				{ name: 'degree', label: 'Degree', placeholder: 'Bachelor of Computer Science', required: true },
				{ name: 'major', label: 'Major', placeholder: 'Software Engineering', required: true },
				{ name: 'gpa', label: 'GPA', placeholder: '3.85', type: 'number', required: true },
				{ name: 'graduation_date', label: 'Graduation Date', placeholder: '2024-06-15', type: 'date', required: true }
			],
			gradient: 'from-indigo-500 to-blue-600'
		},
		'health-insurance': {
			title: 'Health Insurance Card', icon: '🏥', issuer: 'Health Insurance Company',
			description: 'Get your digital health insurance credential',
			schema: 'Health Insurance', credDefTag: 'official',
			attributes: [
				{ name: 'policy_number', label: 'Policy Number', placeholder: 'POL123456', required: true },
				{ name: 'holder_name', label: 'Holder Name', placeholder: 'John Doe', required: true },
				{ name: 'coverage_type', label: 'Coverage Type', placeholder: 'Comprehensive', required: true },
				{ name: 'valid_until', label: 'Valid Until', placeholder: '2025-12-31', type: 'date', required: true }
			],
			gradient: 'from-pink-500 to-rose-600'
		}
	};

	let useCase = $derived(useCaseConfigs[useCaseId]);
	let currentStep = $state(1);
	let invitationUrl = $state('');
	let connectionId = $state('');
	let formData = $state<Record<string, string>>({});
	let submitting = $state(false);
	let showSuccessDialog = $state(false);

	function handleConnect() {
		if (!invitationUrl.trim()) {
			toast.error('Please paste the invitation URL');
			return;
		}
		connectionId = 'conn-' + Math.random().toString(36).substring(7);
		currentStep = 2;
		toast.success('Connection established!');
	}

	async function handleSubmit() {
		const missingFields = useCase.attributes
			.filter((attr: any) => attr.required && !formData[attr.name]?.trim())
			.map((attr: any) => attr.label);

		if (missingFields.length > 0) {
			toast.error(`Please fill: ${missingFields.join(', ')}`);
			return;
		}

		submitting = true;
		try {
			const response = await fetch('/api/credential-requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					use_case_id: useCaseId,
					cred_def_id: `${useCase.schema}:${useCase.credDefTag}`,
					connection_id: connectionId,
					holder_name: formData.full_name || formData.holder_name || 'Unknown',
					request_data: formData
				})
			});

			const result = await response.json();
			if (result.success) {
				showSuccessDialog = true;
				toast.success('Request submitted!');
			} else {
				toast.error('Failed to submit');
			}
		} catch (err) {
			toast.error('Failed to submit');
		} finally {
			submitting = false;
		}
	}
</script>

{#if !useCase}
	<div class="min-h-screen flex items-center justify-center p-4">
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground mb-4">Use case not found</p>
				<Button class="w-full" onclick={() => window.location.href = '/use-cases'}>
					Back to Use Cases
				</Button>
			</CardContent>
		</Card>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
		<div class="container mx-auto max-w-4xl">
			<Button variant="outline" onclick={() => window.location.href = '/use-cases'} class="mb-6">
				← Back
			</Button>

			<!-- Header -->
			<div class="bg-gradient-to-r {useCase.gradient} text-white rounded-lg p-8 mb-8">
				<div class="flex items-center gap-4">
					<div class="text-6xl">{useCase.icon}</div>
					<div>
						<h1 class="text-4xl font-bold mb-2">{useCase.title}</h1>
						<p class="text-white/90 mb-2">{useCase.description}</p>
						<Badge variant="secondary" class="bg-white/20 text-white border-white/30">
							Issued by: {useCase.issuer}
						</Badge>
					</div>
				</div>
			</div>

			<!-- Progress -->
			<div class="mb-8">
				<div class="flex items-center justify-between max-w-md mx-auto">
					<div class="text-center">
						<div class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 {currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}">1</div>
						<p class="text-xs font-semibold">Connect</p>
					</div>
					<div class="flex-1 h-1 mx-2 {currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}"></div>
					<div class="text-center">
						<div class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 {currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}">2</div>
						<p class="text-xs font-semibold">Fill Info</p>
					</div>
					<div class="flex-1 h-1 mx-2 {currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}"></div>
					<div class="text-center">
						<div class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 {currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}">3</div>
						<p class="text-xs font-semibold">Receive</p>
					</div>
				</div>
			</div>

			<!-- Step 1: Connect -->
			{#if currentStep === 1}
				<Card>
					<CardHeader>
						<CardTitle>Step 1: Connect Your Wallet</CardTitle>
						<CardDescription>Connect with the issuer to receive your credential</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
							<p class="font-semibold mb-2">📱 Instructions:</p>
							<ol class="list-decimal list-inside space-y-1 text-sm">
								<li>Open your digital wallet app</li>
								<li>Go to Connections → Create Invitation</li>
								<li>Copy the invitation URL</li>
								<li>Paste it below</li>
							</ol>
						</div>
						<div class="space-y-2">
							<Label for="invitation">Invitation URL</Label>
							<Input id="invitation" placeholder="Paste invitation URL..." bind:value={invitationUrl} />
						</div>
						<Button class="w-full" onclick={handleConnect} disabled={!invitationUrl.trim()}>
							Connect Wallet →
						</Button>
					</CardContent>
				</Card>
			{/if}

			<!-- Step 2: Fill Form -->
			{#if currentStep === 2}
				<Card>
					<CardHeader>
						<CardTitle>Step 2: Fill Your Information</CardTitle>
						<CardDescription>Provide required information for your credential</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each useCase.attributes as attr}
								<div class="space-y-2 {attr.name === 'address' ? 'md:col-span-2' : ''}">
									<Label for={attr.name}>
										{attr.label}
										{#if attr.required}<span class="text-red-500">*</span>{/if}
									</Label>
									<Input
										id={attr.name}
										type={attr.type || 'text'}
										placeholder={attr.placeholder}
										bind:value={formData[attr.name]}
									/>
								</div>
							{/each}
						</div>
						<div class="flex gap-2">
							<Button variant="outline" onclick={() => currentStep = 1}>← Back</Button>
							<Button class="flex-1" onclick={handleSubmit} disabled={submitting}>
								{submitting ? 'Submitting...' : 'Submit Request →'}
							</Button>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>

	<!-- Success Dialog -->
	<Dialog open={showSuccessDialog} onOpenChange={(open) => showSuccessDialog = open}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>✅ Request Submitted!</DialogTitle>
				<DialogDescription>Your credential request has been sent to the issuer</DialogDescription>
			</DialogHeader>
			<div class="space-y-4">
				<div class="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
					<p class="font-semibold mb-2">What's next?</p>
					<ol class="list-decimal list-inside space-y-1 text-sm">
						<li>Issuer will review your information</li>
						<li>Credential will be sent to your wallet</li>
						<li>Accept it in your wallet app</li>
					</ol>
				</div>
				<Button class="w-full" onclick={() => window.location.href = '/use-cases'}>
					Back to Use Cases
				</Button>
			</div>
		</DialogContent>
	</Dialog>
{/if}
