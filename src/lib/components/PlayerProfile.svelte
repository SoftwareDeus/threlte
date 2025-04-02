<script lang="ts">
	import { playerStore } from '../stores/playerStore';
	import { authStore } from '../stores/authStore';
	import { onMount } from 'svelte';
	import DeleteAccountForm from './auth/DeleteAccountForm.svelte';

	let displayName = '';
	let avatarUrl = '';
	let isEditing = false;
	let error: string | null = null;
	let showDeleteForm = false;

	$: profile = $playerStore.profile;
	$: loading = $playerStore.loading;
	$: error = $playerStore.error;

	onMount(async () => {
		console.log('PlayerProfile component mounted');
		if (!$authStore.user) {
			console.error('No user in auth store');
			error = 'User not authenticated';
			return;
		}
		console.log('User authenticated, loading profile for ID:', $authStore.user.id);
		await playerStore.loadProfile($authStore.user.id);
	});

	async function handleSubmit() {
		try {
			if (profile) {
				// Update existing profile
				await playerStore.updateProfile(profile.auth_user_id, {
					display_name: displayName || profile.username,
					avatar_url: avatarUrl || undefined
				});
				isEditing = false;
			} else {
				error = 'No profile found. Please contact support.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update profile';
		}
	}

	function startEditing() {
		if (profile) {
			displayName = profile.display_name || profile.username;
			avatarUrl = profile.avatar_url || '';
			isEditing = true;
		}
	}

	function cancelEditing() {
		isEditing = false;
		error = null;
	}
</script>

<div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
	{#if loading}
		<div class="flex h-32 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
		</div>
	{:else if error}
		<div class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
			{error}
		</div>
	{/if}

	{#if profile}
		<div class="mb-6 flex items-center space-x-4">
			{#if profile.avatar_url}
				<img
					src={profile.avatar_url}
					alt={profile.username}
					class="h-16 w-16 rounded-full object-cover"
				/>
			{:else}
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600"
				>
					<span class="text-2xl text-gray-600 dark:text-gray-300">
						{profile.username[0].toUpperCase()}
					</span>
				</div>
			{/if}
			<div>
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">
					{profile.display_name || profile.username}
				</h2>
				<p class="text-sm text-gray-500 dark:text-gray-400">Rating: {profile.rating}</p>
			</div>
		</div>

		<div class="mb-6 grid grid-cols-2 gap-4">
			<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
				<p class="text-sm text-gray-500 dark:text-gray-400">Games Played</p>
				<p class="text-lg font-semibold text-gray-900 dark:text-white">{profile.games_played}</p>
			</div>
			<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
				<p class="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
				<p class="text-lg font-semibold text-gray-900 dark:text-white">
					{profile.win_rate.toFixed(1)}%
				</p>
			</div>
		</div>

		{#if !isEditing}
			<div class="space-y-4">
				<button
					on:click={startEditing}
					class="w-full rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
				>
					Edit Profile
				</button>

				<button
					on:click={() => (showDeleteForm = !showDeleteForm)}
					class="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
				>
					{showDeleteForm ? 'Cancel' : 'Delete Account'}
				</button>

				{#if showDeleteForm}
					<div class="mt-4">
						<DeleteAccountForm />
					</div>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="text-center">
			<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">No Profile Found</h2>
			<p class="text-gray-600 dark:text-gray-400">
				Please contact support if you believe this is an error.
			</p>
		</div>
	{/if}

	{#if isEditing && profile}
		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<div>
				<label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>Display Name</label
				>
				<input
					type="text"
					id="displayName"
					bind:value={displayName}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					required
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
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			<div class="flex space-x-4">
				<button
					type="submit"
					class="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
				>
					Save Changes
				</button>
				<button
					type="button"
					on:click={cancelEditing}
					class="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
				>
					Cancel
				</button>
			</div>
		</form>
	{/if}
</div>
