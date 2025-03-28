<script lang="ts">
    import { playerStore } from '../stores/playerStore';
    import type { PlayerProfile } from '../services/supabase';
    import { authStore } from '../stores/authStore';
    import { supabase } from '../services/supabase';
    import { onMount } from 'svelte';

    let username = '';
    let displayName = '';
    let avatarUrl = '';
    let isEditing = false;
    let error: string | null = null;

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
        if (!username.trim()) {
            error = 'Username is required';
            return;
        }

        try {
            if (profile) {
                // Update existing profile
                await playerStore.updateProfile(profile.auth_user_id, {
                    username,
                    display_name: displayName || username,
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
            username = profile.username;
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

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
    {#if loading}
        <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    {:else if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
        </div>
    {/if}

    {#if profile}
        <div class="flex items-center space-x-4 mb-6">
            {#if profile.avatar_url}
                <img 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    class="w-16 h-16 rounded-full object-cover"
                />
            {:else}
                <div class="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <span class="text-2xl text-gray-600 dark:text-gray-300">
                        {profile.username[0].toUpperCase()}
                    </span>
                </div>
            {/if}
            <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">{profile.display_name || profile.username}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Username: {profile.username}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Rating: {profile.rating}</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Games Played</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">{profile.games_played}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">{profile.win_rate.toFixed(1)}%</p>
            </div>
        </div>

        {#if !isEditing}
            <button
                on:click={startEditing}
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                Edit Profile
            </button>
        {/if}
    {:else}
        <div class="text-center">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">No Profile Found</h2>
            <p class="text-gray-600 dark:text-gray-400">Please contact support if you believe this is an error.</p>
        </div>
    {/if}

    {#if isEditing && profile}
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input
                    type="text"
                    id="username"
                    bind:value={username}
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                />
            </div>

            <div>
                <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name (optional)</label>
                <input
                    type="text"
                    id="displayName"
                    bind:value={displayName}
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
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            <div class="flex space-x-4">
                <button
                    type="submit"
                    class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    Save Changes
                </button>
                <button
                    type="button"
                    on:click={cancelEditing}
                    class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    {/if}
</div> 