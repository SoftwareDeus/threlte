<script lang="ts">
	import { goto } from '$app/navigation';
	import { resources } from '$lib/resources';
	import { ChessColor } from '$lib/types/chess';
	import type { Lobby } from '$lib/types/chess';
	import PlayerSlot from './PlayerSlot.svelte';
	import TimeControlSettings from './TimeControlSettings.svelte';

	export let lobby: Lobby;
	export let isHost: boolean;
	export let minutes: number;
	export let increment: number;
	export let onMinutesChange: (value: number) => void;
	export let onIncrementChange: (value: number) => void;
	export let onColorChange: (slot: 1 | 2, color: ChessColor) => void;
	export let onStartGame: () => void;
	export let onDelete: () => void;
	export let onRandomize: () => void;

	function isFull(): boolean {
		return !!lobby.player2_id;
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-4xl font-bold">{lobby.name || resources.ui.labels.loading}</h1>
		<button
			on:click={() => goto('/lobby')}
			class="rounded bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
		>
			{resources.ui.labels.backToLobbies}
		</button>
	</div>

	<div class="space-y-8">
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold">{resources.ui.lobby.players.title}</h2>

			<PlayerSlot
				slotNumber={1}
				player={lobby.host_id}
				color={ChessColor.White}
				onColorChange={(color) => onColorChange(1, color)}
				isHost={true}
			/>

			<PlayerSlot
				slotNumber={2}
				player={lobby.player2_id || undefined}
				color={ChessColor.Black}
				onColorChange={(color) => onColorChange(2, color)}
				isHost={false}
			/>
		</div>

		<div class="space-y-6">
			<TimeControlSettings
				{isHost}
				{minutes}
				{increment}
				{onMinutesChange}
				{onIncrementChange}
				currentTimeControl={lobby.time_control || undefined}
			/>

			<div class="flex gap-4">
				{#if isHost}
					<button
						on:click={onStartGame}
						class="flex-1 rounded-lg bg-[#4CAF50] px-6 py-3 text-white transition-colors hover:bg-[#45a049] disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!isFull()}
					>
						Start Game
					</button>
					<button
						on:click={onDelete}
						class="rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600"
					>
						Delete Lobby
					</button>
				{:else}
					<button
						on:click={onRandomize}
						class="flex-1 rounded-lg bg-[#2196F3] px-6 py-3 text-white transition-colors hover:bg-[#1976D2]"
					>
						Randomize Colors
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
