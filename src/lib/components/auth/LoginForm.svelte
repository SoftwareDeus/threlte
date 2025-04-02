<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let loading = false;
	let error: string | null = null;

	async function handleSubmit() {
		loading = true;
		error = null;

		const result = await authStore.signIn(email, password);

		if (result.success) {
			goto('/'); // Go to home page after successful login
		} else {
			error = $authStore.error;
		}

		loading = false;
	}
</script>

<div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
	<h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Welcome Back!</h2>

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="space-y-6">
			<div>
				<label for="email" class="mb-2 block text-sm font-medium text-white"> Email </label>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-[#4CAF50] focus:outline-none"
					placeholder="Enter your email"
					required
				/>
			</div>

			<div>
				<label for="password" class="mb-2 block text-sm font-medium text-white"> Password </label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-[#4CAF50] focus:outline-none"
					placeholder="Enter your password"
					required
				/>
			</div>

			{#if error}
				<div class="text-sm text-red-500">
					{error}
				</div>
			{/if}

			<button
				type="submit"
				class="w-full rounded-lg bg-[#4CAF50] px-4 py-2 text-white transition-colors hover:bg-[#45a049] disabled:cursor-not-allowed disabled:opacity-50"
				disabled={loading}
			>
				{loading ? 'Logging in...' : 'Log In'}
			</button>
		</div>
	</form>
</div>
