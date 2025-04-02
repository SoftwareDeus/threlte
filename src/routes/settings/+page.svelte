<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { playerStore } from '$lib/stores/playerStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DeleteAccountForm from '$lib/components/auth/DeleteAccountForm.svelte';

	let displayName = '';
	let avatarUrl = '';
	let loading = false;
	let error: string | null = null;
	let showDeleteForm = false;

	onMount(() => {
		if (!$authStore.user) {
			goto('/auth');
		}
		// Load existing profile data
		if ($playerStore.profile) {
			displayName = $playerStore.profile.display_name || '';
			avatarUrl = $playerStore.profile.avatar_url || '';
		}
	});

	async function handleSubmit() {
		loading = true;
		error = null;

		try {
			if ($playerStore.profile) {
				await playerStore.updateProfile($playerStore.profile.auth_user_id, {
					display_name: displayName,
					avatar_url: avatarUrl
				});
			}
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update profile';
		}

		loading = false;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] p-4">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
		<h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h2>

		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<div>
				<label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>Display Name</label
				>
				<input
					type="text"
					id="displayName"
					bind:value={displayName}
					required
					placeholder="Enter your display name"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					This is the name other players will see in the game
				</p>
			</div>

			<div>
				<label for="avatarUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>Avatar URL (optional)</label
				>
				<input
					type="url"
					id="avatarUrl"
					bind:value={avatarUrl}
					placeholder="Enter URL for your avatar image"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			{#if error}
				<div class="text-sm text-red-600 dark:text-red-400">
					{error}
				</div>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if loading}
					<span class="flex items-center justify-center">
						<svg
							class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Saving...
					</span>
				{:else}
					Save Changes
				{/if}
			</button>
		</form>

		<div class="mt-4">
			<button
				on:click={() => (showDeleteForm = !showDeleteForm)}
				class="w-full rounded-lg px-4 py-2 font-semibold text-red-600 transition-colors hover:text-red-700"
			>
				{showDeleteForm ? 'Cancel' : 'Delete Account'}
			</button>

			{#if showDeleteForm}
				<div class="mt-4">
					<DeleteAccountForm />
				</div>
			{/if}
		</div>
	</div>
</div>
