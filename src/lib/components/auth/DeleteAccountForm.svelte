<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';

	let loading = false;
	let error: string | null = null;
	let confirmDelete = false;

	async function handleDelete() {
		if (!confirmDelete) {
			error = 'Please confirm account deletion';
			return;
		}

		loading = true;
		error = null;

		const result = await authStore.deleteAccount();

		if (result.success) {
			goto('/auth'); // Redirect to auth page after successful deletion
		} else {
			error = result.error || 'Failed to delete account';
		}

		loading = false;
	}
</script>

<div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
	<h2 class="mb-6 text-2xl font-bold text-red-600 dark:text-red-400">Delete Account</h2>

	<div class="space-y-4">
		<p class="text-white">
			Are you sure you want to delete your account? This action cannot be undone.
		</p>

		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				id="confirmDelete"
				bind:checked={confirmDelete}
				class="h-4 w-4 rounded border-white/20 bg-white/10 text-red-600 focus:ring-red-500"
			/>
			<label for="confirmDelete" class="text-white">
				I understand that this action cannot be undone
			</label>
		</div>

		{#if error}
			<div class="text-sm text-red-500">
				{error}
			</div>
		{/if}

		<button
			on:click={handleDelete}
			class="w-full rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={loading || !confirmDelete}
		>
			{loading ? 'Deleting Account...' : 'Delete Account'}
		</button>
	</div>
</div>
