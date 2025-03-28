<script lang="ts">
    import { resources } from '$lib/resources';

    export let newLobbyName = '';
    export let onCreateLobby: () => void;
</script>

<div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">{resources.ui.lobby.createNew}</h2>
    <div class="flex gap-4">
        <input
            type="text"
            bind:value={newLobbyName}
            placeholder={resources.ui.lobby.nameInput.placeholder}
            class="flex-1 px-4 py-2 border-2 border-white/20 rounded bg-white/10 text-white text-base transition-colors focus:outline-none focus:border-[#4CAF50] placeholder-white/50"
        />
        <button
            on:click={onCreateLobby}
            class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
        >
            {resources.ui.buttons.create}
        </button>
    </div>
</div> 