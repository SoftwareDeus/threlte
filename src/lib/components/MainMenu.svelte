<script lang="ts">
    import { goto } from '$app/navigation';
    import { gameState } from '$lib/stores/gameStore';
    import { initialState } from '$lib/stores/gameStore';
    import { playerName } from '$lib/stores/playerStore';

    function startNewGame() {
        if (!$playerName) {
            error = 'Please enter your name';
            return;
        }
        // Reset game state to initial state
        gameState.set(initialState);
        // Navigate to the game
        goto('/game');
    }

    function goToLobby() {
        if (!$playerName) {
            error = 'Please enter your name';
            return;
        }
        goto('/lobby');
    }

    let error = '';
</script>

<div class="w-screen h-screen flex flex-col justify-center items-center bg-[#1a1a1a] text-white font-sans">
    <h1 class="text-5xl mb-8 text-white">Chess Game</h1>
    
    <div class="mb-8 w-full max-w-[300px]">
        <input
            type="text"
            bind:value={$playerName}
            placeholder="Enter your name"
            class="w-full px-4 py-3 border-2 border-white/20 rounded bg-white/10 text-white text-base transition-colors focus:outline-none focus:border-[#4CAF50] placeholder-white/50"
            on:input={(e: Event) => {
                const target = e.target as HTMLInputElement;
                console.log('Player name changed:', target.value);
            }}
        />
    </div>

    <div class="flex flex-col gap-4">
        <button 
            on:click={startNewGame}
            class="px-8 py-4 text-xl bg-[#4CAF50] text-white rounded cursor-pointer transition-all hover:bg-[#45a049] min-w-[200px]"
        >
            Local Game
        </button>
        <button 
            on:click={goToLobby}
            class="px-8 py-4 text-xl bg-[#4CAF50] text-white rounded cursor-pointer transition-all hover:bg-[#45a049] min-w-[200px]"
        >
            Multiplayer
        </button>
    </div>

    {#if error}
        <div class="mt-4 px-4 py-2 text-[#ff4444] bg-[#ff4444]/10 rounded">
            {error}
        </div>
    {/if}
</div> 