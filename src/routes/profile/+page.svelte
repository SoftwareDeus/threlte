<script lang="ts">
    import { authStore } from '$lib/stores/authStore';
    import { playerStore } from '$lib/stores/playerStore';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let displayName = '';
    let avatarUrl = '';
    let loading = false;
    let error: string | null = null;

    onMount(() => {
        if (!$authStore.user) {
            goto('/auth');
        }
    });

    async function handleSubmit() {
        loading = true;
        error = null;

        try {
            if ($playerStore.profile) {
                await playerStore.updateProfile($playerStore.profile.id, {
                    username: displayName,
                    avatar_url: avatarUrl
                });
            } else {
                await playerStore.createProfile(displayName, avatarUrl);
            }
            goto('/');
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to update profile';
        }

        loading = false;
    }
</script>

<div class="min-h-screen bg-[#1a1a1a] flex flex-col justify-center items-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Set Up Your Profile</h2>

        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div>
                <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                <input
                    type="text"
                    id="displayName"
                    bind:value={displayName}
                    required
                    placeholder="Enter your display name"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">This is the name other players will see in the game</p>
            </div>

            <div>
                <label for="avatarUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar URL (optional)</label>
                <input
                    type="url"
                    id="avatarUrl"
                    bind:value={avatarUrl}
                    placeholder="Enter URL for your avatar image"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            {#if error}
                <div class="text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            {/if}

            <button
                type="submit"
                disabled={loading}
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if loading}
                    <span class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                    </span>
                {:else}
                    Save Profile
                {/if}
            </button>
        </form>
    </div>
</div> 