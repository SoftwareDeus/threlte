<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { gameState } from '$lib/stores/gameStore';
    import { initialState } from '$lib/stores/gameStore';
    import { playerStore } from '$lib/stores/playerStore';
    import { authStore } from '$lib/stores/authStore';
    import { resources } from '$lib/resources';
    import * as Sentry from '@sentry/sveltekit';
    import PlayerProfile from './PlayerProfile.svelte';
    import { PlayerService } from '$lib/services/playerService';
    import { supabase } from '$lib/services/supabase';

    let showProfile = false;
    let error: string | null = null;
    let connectionStatus = 'Connecting...';
    let testStatus = '';

    $: isAuthenticated = !!$authStore.user;
    $: isLoading = $authStore.loading;

    onMount(async () => {
        // Wait for initial auth check to complete
        if (isLoading) {
            return;
        }

        // Only redirect if we're not already on the auth page
        if (!isAuthenticated && window.location.pathname !== '/auth') {
            await goto('/auth');
            return;
        }

        // Check Supabase connection
        try {
            const { data, error } = await supabase.from('player_profiles').select('count').limit(1);
            if (error) throw error;
            connectionStatus = 'Connected';
        } catch (e) {
            connectionStatus = 'Connection Error';
            error = 'Failed to connect to server';
        }
    });

    async function testConnection() {
        connectionStatus = 'Testing connection...';
        const isConnected = await PlayerService.testConnection();
        connectionStatus = isConnected ? 'Connected to Supabase!' : 'Connection failed';
    }

    async function testProfileCreation() {
        testStatus = 'Creating test profile...';
        const success = await PlayerService.createTestProfile();
        testStatus = success ? 'Test profile created successfully!' : 'Failed to create test profile';
    }

    async function handleStartGame() {
        if (!$authStore.user) {
            error = 'Please log in to start a game';
            return;
        }
        await goto('/game');
    }

    async function handleGoToLobby() {
        if (!$authStore.user) {
            error = 'Please log in to join the lobby';
            return;
        }
        await goto('/lobby');
    }

    function toggleProfile() {
        showProfile = !showProfile;
    }

    async function handleSignOut() {
        const result = await authStore.signOut();
        if (result.error) {
            error = result.error;
        } else {
            await goto('/auth');
        }
    }
</script>

<div class="min-h-screen bg-[#1a1a1a] flex flex-col">
    {#if isLoading}
        <div class="flex-1 flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    {:else if !isAuthenticated}
        <div class="flex-1 flex items-center justify-center">
            <div class="text-white">Redirecting to login...</div>
        </div>
    {:else}
        <div class="w-screen h-screen flex flex-col justify-center items-center bg-[#1a1a1a] text-white font-sans">
            <h1 class="text-5xl mb-8 text-white">{resources.ui.mainMenu.title}</h1>
            
            <div class="flex flex-col gap-4">
                <button 
                    on:click={handleStartGame}
                    class="px-8 py-4 text-xl bg-[#4CAF50] text-white rounded cursor-pointer transition-all hover:bg-[#45a049] min-w-[200px]"
                >
                    {resources.ui.buttons.localGame}
                </button>
                <button 
                    on:click={handleGoToLobby}
                    class="px-8 py-4 text-xl bg-[#4CAF50] text-white rounded cursor-pointer transition-all hover:bg-[#45a049] min-w-[200px]"
                >
                    {resources.ui.buttons.multiplayer}
                </button>
                <button 
                    on:click={toggleProfile}
                    class="px-8 py-4 text-xl bg-[#2196F3] text-white rounded cursor-pointer transition-all hover:bg-[#1976D2] min-w-[200px]"
                >
                    {showProfile ? 'Hide Profile' : 'Show Profile'}
                </button>
                <button 
                    on:click={handleSignOut}
                    class="px-8 py-4 text-xl bg-[#f44336] text-white rounded cursor-pointer transition-all hover:bg-[#d32f2f] min-w-[200px]"
                >
                    Sign Out
                </button>
            </div>

            {#if error}
                <div class="mt-4 px-4 py-2 text-[#ff4444] bg-[#ff4444]/10 rounded">
                    {error}
                </div>
            {/if}

            {#if connectionStatus}
                <div class="mt-4 px-4 py-2 {connectionStatus.includes('Connected') ? 'text-[#4CAF50] bg-[#4CAF50]/10' : 'text-[#ff4444] bg-[#ff4444]/10'} rounded">
                    {connectionStatus}
                </div>
            {/if}

            {#if testStatus}
                <div class="mt-4 px-4 py-2 {testStatus.includes('successfully') ? 'text-[#4CAF50] bg-[#4CAF50]/10' : 'text-[#ff4444] bg-[#ff4444]/10'} rounded">
                    {testStatus}
                </div>
            {/if}

            {#if showProfile}
                <div class="mt-8 w-full max-w-md">
                    <PlayerProfile />
                </div>
            {/if}
        </div>
    {/if}
</div> 