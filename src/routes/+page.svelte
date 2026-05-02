<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { 
		Shield, 
		Wallet, 
		FileCheck, 
		Network, 
		Lock, 
		Zap,
		CheckCircle2,
		ArrowRight,
		Sparkles,
		Users,
		Building2,
		GraduationCap,
		Hospital,
		Landmark,
		Menu,
		X,
		Github,
		BookOpen
	} from 'lucide-svelte';

	let mobileMenuOpen = $state(false);
	let scrolled = $state(false);

	onMount(() => {
		// If already authenticated, redirect to dashboard
		if (authStore.isAuthenticated) {
			goto('/dashboard');
		}

		// Handle scroll for navbar
		const handleScroll = () => {
			scrolled = window.scrollY > 20;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	const features = [
		{
			icon: Network,
			title: 'Connection Management',
			description: 'Create and manage secure peer-to-peer connections with other agents',
			items: ['Generate invitations', 'QR code support', 'Connection status tracking'],
			gradient: 'from-blue-500 to-cyan-500'
		},
		{
			icon: FileCheck,
			title: 'Credential Issuance',
			description: 'Issue verifiable credentials to holders with full control',
			items: ['Create schemas', 'Define credential types', 'Issue & revoke credentials'],
			gradient: 'from-purple-500 to-pink-500'
		},
		{
			icon: Shield,
			title: 'Proof Verification',
			description: 'Request and verify credential proofs from holders',
			items: ['Custom proof requests', 'Attribute verification', 'Zero-Knowledge Predicates (ZKP)', 'Range proofs without revealing values'],
			gradient: 'from-green-500 to-emerald-500'
		},
		{
			icon: Wallet,
			title: 'Wallet Management',
			description: 'Manage DIDs and keys in your secure wallet',
			items: ['Create DIDs', 'Key management', 'Public DID registration'],
			gradient: 'from-orange-500 to-red-500'
		},
		{
			icon: Lock,
			title: 'Schema Registry',
			description: 'Define and manage credential schemas',
			items: ['Create schemas', 'Version control', 'Attribute definitions'],
			gradient: 'from-indigo-500 to-blue-500'
		},
		{
			icon: Zap,
			title: 'Multi-Tenant Security',
			description: 'Isolated wallets with enterprise-grade security',
			items: ['Tenant isolation', 'Encrypted storage', 'Access control'],
			gradient: 'from-yellow-500 to-orange-500'
		}
	];

	const useCases = [
		{
			title: 'Educational Institutions',
			description: 'Issue digital diplomas and certificates',
			icon: GraduationCap,
			color: 'text-blue-600 dark:text-blue-400',
			bgColor: 'bg-blue-50 dark:bg-blue-950/30'
		},
		{
			title: 'Government Services',
			description: 'Digital identity and licenses',
			icon: Landmark,
			color: 'text-purple-600 dark:text-purple-400',
			bgColor: 'bg-purple-50 dark:bg-purple-950/30'
		},
		{
			title: 'Healthcare',
			description: 'Medical records and prescriptions',
			icon: Hospital,
			color: 'text-green-600 dark:text-green-400',
			bgColor: 'bg-green-50 dark:bg-green-950/30'
		},
		{
			title: 'Financial Services',
			description: 'KYC and credit verification',
			icon: Building2,
			color: 'text-orange-600 dark:text-orange-400',
			bgColor: 'bg-orange-50 dark:bg-orange-950/30'
		}
	];

	const stats = [
		{ value: '100%', label: 'Secure', icon: Shield },
		{ value: 'Multi', label: 'Tenant', icon: Users },
		{ value: 'Open', label: 'Source', icon: Sparkles }
	];
</script>

<div class="relative min-h-screen overflow-hidden bg-white dark:bg-slate-950">
	<!-- Top Navigation Bar -->
	<nav class="fixed top-0 z-50 w-full transition-all duration-300 {scrolled ? 'bg-white/80 shadow-lg backdrop-blur-xl dark:bg-slate-950/80' : 'bg-transparent'}">
		<div class="container mx-auto px-4">
			<div class="flex h-20 items-center justify-between">
				<!-- Logo -->
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
						<Shield class="h-6 w-6 text-white" />
					</div>
					<div class="flex flex-col">
						<span class="text-xl font-bold text-slate-900 dark:text-white">ACA-Py</span>
						<span class="text-xs text-slate-600 dark:text-slate-400">Dashboard</span>
					</div>
				</div>

				<!-- Desktop Navigation -->
				<div class="hidden items-center gap-8 md:flex">
					<a href="#features" class="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">Features</a>
					<a href="#solutions" class="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">Solutions</a>
					<a href="#security" class="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">Security</a>
					<a href="https://github.com/kodratIT" target="_blank" class="text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
						<Github class="h-5 w-5" />
					</a>
				</div>

				<!-- CTA Buttons -->
				<div class="hidden items-center gap-3 md:flex">
					<Button variant="ghost" size="sm" onclick={() => goto('/login')}>
						Sign In
					</Button>
					<Button size="sm" class="bg-gradient-to-r from-blue-600 to-indigo-600" onclick={() => goto('/register')}>
						Get Started
					</Button>
				</div>

				<!-- Mobile Menu Button -->
				<button 
					class="md:hidden"
					onclick={() => mobileMenuOpen = !mobileMenuOpen}
				>
					{#if mobileMenuOpen}
						<X class="h-6 w-6 text-slate-900 dark:text-white" />
					{:else}
						<Menu class="h-6 w-6 text-slate-900 dark:text-white" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="border-t border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
				<div class="container mx-auto px-4 py-6">
					<div class="flex flex-col gap-4">
						<a href="#features" class="text-sm font-medium text-slate-700 dark:text-slate-300" onclick={() => mobileMenuOpen = false}>Features</a>
						<a href="#solutions" class="text-sm font-medium text-slate-700 dark:text-slate-300" onclick={() => mobileMenuOpen = false}>Solutions</a>
						<a href="#security" class="text-sm font-medium text-slate-700 dark:text-slate-300" onclick={() => mobileMenuOpen = false}>Security</a>
						<div class="mt-4 flex flex-col gap-2">
							<Button variant="outline" size="sm" onclick={() => goto('/login')}>Sign In</Button>
							<Button size="sm" class="bg-gradient-to-r from-blue-600 to-indigo-600" onclick={() => goto('/register')}>Get Started</Button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</nav>

	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl"></div>
		<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 blur-3xl"></div>
		<div class="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-3xl"></div>
	</div>

	<!-- Hero Section -->
	<section class="relative container mx-auto px-4 pt-32 pb-20 text-center lg:pt-40 lg:pb-32">
		<div class="mx-auto max-w-5xl space-y-8">
			<!-- Badge -->
			<div class="animate-fade-in inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-blue-700 shadow-lg backdrop-blur-sm dark:border-blue-800 dark:bg-slate-900/80 dark:text-blue-300">
				<Sparkles class="h-4 w-4" />
				Powered by Hyperledger Aries
			</div>

			<!-- Main Heading -->
			<h1 class="animate-slide-up text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl lg:text-7xl xl:text-8xl">
				<span class="block">ACA-Py Multi-Tenant</span>
				<span class="mt-2 block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
					Dashboard
				</span>
			</h1>

			<!-- Subtitle -->
			<p class="animate-fade-in mx-auto max-w-3xl text-xl leading-relaxed text-slate-600 dark:text-slate-300 md:text-2xl">
				Enterprise-grade management platform for Hyperledger Aries Cloud Agent. 
				<span class="font-semibold text-slate-900 dark:text-white">Issue, verify, and manage</span> verifiable credentials with ease.
			</p>

			<!-- CTA Buttons -->
			<div class="animate-fade-in flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
				<Button 
					size="lg" 
					class="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-lg font-semibold shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:w-auto"
					onclick={() => goto('/register')}
				>
					<Wallet class="mr-2 h-5 w-5" />
					Create Wallet
					<ArrowRight class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
				</Button>
				<Button 
					size="lg" 
					variant="outline" 
					class="w-full border-2 border-slate-300 bg-white/50 px-8 py-6 text-lg font-semibold backdrop-blur-sm transition-all hover:scale-105 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600 dark:hover:bg-slate-900 sm:w-auto"
					onclick={() => goto('/login')}
				>
					<Lock class="mr-2 h-5 w-5" />
					Login
				</Button>
			</div>

			<!-- Stats -->
			<div class="animate-fade-in grid grid-cols-3 gap-6 pt-12 md:gap-8">
				{#each stats as stat}
					<div class="group rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60">
						<svelte:component this={stat.icon} class="mx-auto mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
						<div class="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">{stat.value}</div>
						<div class="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="relative bg-slate-50 py-20 dark:bg-slate-900/50 lg:py-32">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300">
					<Zap class="h-4 w-4" />
					Powerful Features
				</div>
				<h2 class="mb-6 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
					Everything You Need
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl">
					Comprehensive tools to manage verifiable credentials and digital identities
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
				{#each features as feature, i}
					<Card class="group relative overflow-hidden border border-slate-200 bg-white transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
						<!-- Gradient overlay on hover -->
						<div class="absolute inset-0 bg-gradient-to-br {feature.gradient} opacity-0 transition-opacity group-hover:opacity-5"></div>
						
						<CardHeader class="relative">
							<div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br {feature.gradient} shadow-lg">
								<svelte:component this={feature.icon} class="h-7 w-7 text-white" />
							</div>
							<CardTitle class="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</CardTitle>
							<CardDescription class="text-slate-600 dark:text-slate-400">{feature.description}</CardDescription>
						</CardHeader>
						<CardContent class="relative">
							<ul class="space-y-3">
								{#each feature.items as item}
									<li class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
										<CheckCircle2 class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Use Cases Section -->
	<section id="solutions" class="relative bg-white py-20 dark:bg-slate-950 lg:py-32">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
					<Building2 class="h-4 w-4" />
					Industry Solutions
				</div>
				<h2 class="mb-6 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
					Trusted Across Industries
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl">
					Empowering organizations worldwide with secure digital credentials
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
				{#each useCases as useCase}
					<Card class="group relative overflow-hidden border border-slate-200 bg-white text-center transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
						<CardContent class="p-8">
							<div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl {useCase.bgColor} transition-transform group-hover:scale-110">
								<svelte:component this={useCase.icon} class="h-10 w-10 {useCase.color}" />
							</div>
							<h3 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">
								{useCase.title}
							</h3>
							<p class="text-slate-600 dark:text-slate-400">
								{useCase.description}
							</p>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="relative bg-slate-50 py-20 dark:bg-slate-900/50 lg:py-32">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm dark:border-green-800 dark:bg-slate-900 dark:text-green-300">
					<Zap class="h-4 w-4" />
					Simple Process
				</div>
				<h2 class="mb-6 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
					Get Started in Minutes
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl">
					Three simple steps to start managing verifiable credentials
				</p>
			</div>

			<div class="mx-auto max-w-5xl space-y-6">
				<div class="group relative flex gap-6 rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
					<div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-bold text-white shadow-lg">
						1
					</div>
					<div class="flex-1">
						<h3 class="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
							Create Your Wallet
						</h3>
						<p class="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
							Register and create your isolated multi-tenant wallet. Your wallet key is <span class="font-semibold text-slate-900 dark:text-white">never stored</span> on our servers, ensuring maximum security.
						</p>
					</div>
					<Wallet class="hidden h-12 w-12 text-slate-300 transition-all group-hover:text-blue-500 dark:text-slate-700 lg:block" />
				</div>

				<div class="group relative flex gap-6 rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
					<div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white shadow-lg">
						2
					</div>
					<div class="flex-1">
						<h3 class="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
							Setup Your Credentials
						</h3>
						<p class="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
							Create DIDs, define schemas, and setup credential definitions for your organization. <span class="font-semibold text-slate-900 dark:text-white">Customize everything</span> to match your needs.
						</p>
					</div>
					<FileCheck class="hidden h-12 w-12 text-slate-300 transition-all group-hover:text-purple-500 dark:text-slate-700 lg:block" />
				</div>

				<div class="group relative flex gap-6 rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
					<div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-2xl font-bold text-white shadow-lg">
						3
					</div>
					<div class="flex-1">
						<h3 class="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
							Issue & Verify
						</h3>
						<p class="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
							Start issuing verifiable credentials and verifying proofs from holders. <span class="font-semibold text-slate-900 dark:text-white">Full control</span> over your credential lifecycle.
						</p>
					</div>
					<Shield class="hidden h-12 w-12 text-slate-300 transition-all group-hover:text-green-500 dark:text-slate-700 lg:block" />
				</div>
			</div>
		</div>
	</section>

	<!-- Security Section -->
	<section id="security" class="relative bg-white py-20 dark:bg-slate-950 lg:py-32">
		<div class="container mx-auto px-4">
			<Card class="relative overflow-hidden border-none bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl">
				<!-- Decorative elements -->
				<div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
				<div class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
				
				<CardContent class="relative p-12 lg:p-16">
					<div class="mb-12 text-center">
						<div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
							<Shield class="h-10 w-10 text-white" />
						</div>
						<h2 class="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
							Enterprise-Grade Security
						</h2>
						<p class="mx-auto max-w-2xl text-xl text-blue-100">
							Built with security and privacy at its core, trusted by organizations worldwide
						</p>
					</div>

					<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
						<div class="group rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm transition-all hover:bg-white/20">
							<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
								<Users class="h-8 w-8 text-white" />
							</div>
							<h3 class="mb-2 text-lg font-bold text-white">Tenant Isolation</h3>
							<p class="text-sm leading-relaxed text-blue-100">
								Each tenant has completely isolated wallet with zero data sharing
							</p>
						</div>
						<div class="group rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm transition-all hover:bg-white/20">
							<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
								<Lock class="h-8 w-8 text-white" />
							</div>
							<h3 class="mb-2 text-lg font-bold text-white">Encrypted Storage</h3>
							<p class="text-sm leading-relaxed text-blue-100">
								All data encrypted at rest and in transit using industry standards
							</p>
						</div>
						<div class="group rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm transition-all hover:bg-white/20">
							<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
								<Wallet class="h-8 w-8 text-white" />
							</div>
							<h3 class="mb-2 text-lg font-bold text-white">Key Management</h3>
							<p class="text-sm leading-relaxed text-blue-100">
								Wallet keys never stored on server, you have full control
							</p>
						</div>
						<div class="group rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm transition-all hover:bg-white/20">
							<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
								<CheckCircle2 class="h-8 w-8 text-white" />
							</div>
							<h3 class="mb-2 text-lg font-bold text-white">Standards Compliant</h3>
							<p class="text-sm leading-relaxed text-blue-100">
								W3C and Hyperledger standards for maximum compatibility
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="relative bg-slate-50 py-20 dark:bg-slate-900/50 lg:py-32">
		<div class="container mx-auto px-4">
			<Card class="relative overflow-hidden border-none bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
			<!-- Animated background -->
			<div class="absolute inset-0">
				<div class="absolute right-0 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
				<div class="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
			</div>
			
			<CardContent class="relative p-12 text-center lg:p-20">
				<div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
					<Sparkles class="h-10 w-10 text-white" />
				</div>
				<h2 class="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
					Ready to Get Started?
				</h2>
				<p class="mx-auto mb-10 max-w-2xl text-xl text-indigo-100 md:text-2xl">
					Create your wallet now and start managing verifiable credentials in minutes
				</p>
				<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button 
						size="lg" 
						variant="secondary" 
						class="group w-full bg-white px-8 py-6 text-lg font-semibold text-indigo-600 shadow-xl transition-all hover:scale-105 hover:bg-indigo-50 sm:w-auto"
						onclick={() => goto('/register')}
					>
						<Wallet class="mr-2 h-5 w-5" />
						Create Wallet Now
						<ArrowRight class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
					</Button>
					<Button 
						size="lg" 
						variant="outline" 
						class="w-full border-2 border-white bg-white/10 px-8 py-6 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:w-auto"
						onclick={() => goto('/login')}
					>
						<Lock class="mr-2 h-5 w-5" />
						Sign In
					</Button>
				</div>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- Footer -->
	<footer class="relative border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
		<div class="container mx-auto px-4">
			<div class="grid gap-12 md:grid-cols-4">
				<!-- Brand -->
				<div class="md:col-span-2">
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
							<Shield class="h-6 w-6 text-white" />
						</div>
						<div class="flex flex-col">
							<span class="text-xl font-bold text-slate-900 dark:text-white">ACA-Py Dashboard</span>
							<span class="text-xs text-slate-600 dark:text-slate-400">Credential Management</span>
						</div>
					</div>
					<p class="mb-4 max-w-md text-sm text-slate-600 dark:text-slate-400">
						Enterprise-grade platform for managing verifiable credentials and digital identities powered by Hyperledger Aries.
					</p>
					<div class="flex gap-4">
						<a href="https://github.com" target="_blank" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
							<Github class="h-5 w-5" />
						</a>
						<a href="#" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
							<BookOpen class="h-5 w-5" />
						</a>
					</div>
				</div>

				<!-- Product -->
				<div>
					<h3 class="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Product</h3>
					<ul class="space-y-3 text-sm">
						<li><a href="#features" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Features</a></li>
						<li><a href="#solutions" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Solutions</a></li>
						<li><a href="#security" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Security</a></li>
						<li><a href="/register" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Get Started</a></li>
					</ul>
				</div>

				<!-- Resources -->
				<div>
					<h3 class="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Resources</h3>
					<ul class="space-y-3 text-sm">
						<li><a href="#" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Documentation</a></li>
						<li><a href="#" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">API Reference</a></li>
						<li><a href="#" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Community</a></li>
						<li><a href="#" class="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Support</a></li>
					</ul>
				</div>
			</div>

			<div class="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
				<div class="flex flex-col items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400 md:flex-row">
					<p>© 2024 ACA-Py Dashboard. Open Source Project.</p>
					<p>Built with ❤️ using SvelteKit and Hyperledger Aries</p>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.8s ease-out;
	}

	.animate-slide-up {
		animation: slide-up 1s ease-out;
	}
</style>
