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

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
    <h2 class="text-2xl font-bold text-red-600 dark:text-red-400 mb-6">Delete Account</h2>

    <div class="space-y-4">
        <p class="text-white">
            Are you sure you want to delete your account? This action cannot be undone.
        </p>

        <div class="flex items-center space-x-2">
            <input
                type="checkbox"
                id="confirmDelete"
                bind:checked={confirmDelete}
                class="w-4 h-4 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500"
            />
            <label for="confirmDelete" class="text-white">
                I understand that this action cannot be undone
            </label>
        </div>

        {#if error}
            <div class="text-red-500 text-sm">
                {error}
            </div>
        {/if}

        <button
            on:click={handleDelete}
            class="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !confirmDelete}
        >
            {loading ? 'Deleting Account...' : 'Delete Account'}
        </button>
    </div>
</div> 