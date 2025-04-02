<script lang="ts">
	import { resources } from '$lib/resources';

	export let newLobbyName: string;
	export let onCreateLobby: () => void;
	export let disabled: boolean = false;
</script>

<div class="mb-8">
	<h2 class="mb-4 text-2xl font-bold">{resources.ui.lobby.createNew}</h2>
	<div class="flex gap-4">
		<input
			type="text"
			bind:value={newLobbyName}
			placeholder={resources.ui.lobby.nameInput.placeholder}
			class="flex-1 rounded border-2 border-white/20 bg-white/10 px-4 py-2 text-base text-white placeholder-white/50 transition-colors focus:border-[#4CAF50] focus:outline-none disabled:opacity-50"
			{disabled}
		/>
		<button
			on:click={onCreateLobby}
			class="rounded bg-[#4CAF50] px-6 py-2 text-white transition-colors hover:bg-[#45a049] disabled:cursor-not-allowed disabled:opacity-50"
			{disabled}
		>
			{resources.ui.buttons.create}
		</button>
	</div>
</div>
