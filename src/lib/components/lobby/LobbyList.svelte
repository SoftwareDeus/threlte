<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { resources } from '$lib/resources';
	import { ChessColor } from '$lib/types/chess';
	import type { Lobby } from '$lib/types/chess';

	export let lobbies: Lobby[] = [];
	export let onDeleteConfirm: (id: string) => void;
	export let onDeleteCancel: () => void;
	export let onDelete: () => void;
	export let onJoin: (id: string) => void;
	export let onStart: (id: string) => void;
	export let deleteConfirmId: string | null = null;

	$: console.log('LobbyList received lobbies:', lobbies);

	function isHost(lobby: Lobby): boolean {
		return lobby.host_id === $authStore.user?.id;
	}

	function isJoined(lobby: Lobby): boolean {
		return lobby.player2_id === $authStore.user?.id;
	}

	function getSlot1(lobby: Lobby) {
		return {
			player: lobby.host_id,
			color: ChessColor.White
		};
	}

	function getSlot2(lobby: Lobby) {
		if (!lobby.player2_id) return undefined;
		return {
			player: lobby.player2_id,
			color: ChessColor.Black
		};
	}
</script>

<div
	class="max-h-[60vh] space-y-4 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb:hover]:bg-white/30 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-white/10"
>
	{#each lobbies as lobby, index (lobby.id)}
		{#if deleteConfirmId === lobby.id}
			<div class="flex h-[100px] items-center rounded-lg bg-white/10 p-4">
				<div class="flex w-full items-center justify-between">
					<div class="w-16 text-center text-white/50">
						{index + 1}
					</div>
					<div class="flex-1 text-center">
						<h3 class="mb-2 text-xl font-bold">{resources.ui.labels.confirmDelete}</h3>
						<p class="text-white/70">{resources.ui.labels.confirmDeleteMessage}</p>
					</div>
					<div class="flex w-48 justify-end gap-2">
						<button
							on:click={onDeleteCancel}
							class="rounded bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
						>
							{resources.ui.buttons.cancel}
						</button>
						<button
							on:click={onDelete}
							class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
						>
							{resources.ui.buttons.delete}
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div
				class="flex h-[100px] items-center rounded-lg bg-white/10 p-4 transition-colors hover:bg-white/20"
			>
				<div class="flex w-full items-center justify-between">
					<div class="w-16 text-center text-white/50">
						{index + 1}
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-bold">{lobby.name}</h3>
						<p class="text-white/70">
							{resources.ui.labels.host}: {lobby.host_id}
							{#if isHost(lobby)}
								<span class="ml-2 text-[#4CAF50]">({resources.ui.labels.you})</span>
							{/if}
						</p>
						<div class="mt-1 text-sm text-white/50">
							{#if getSlot1(lobby)}
								{@const slot1 = getSlot1(lobby) as { player: string; color: ChessColor }}
								<span class="mr-2">Slot 1: {slot1.player} ({slot1.color})</span>
							{/if}
							{#if getSlot2(lobby)}
								{@const slot2 = getSlot2(lobby) as { player: string; color: ChessColor }}
								<span>Slot 2: {slot2.player} ({slot2.color})</span>
							{/if}
						</div>
					</div>
					<div class="flex w-48 justify-end gap-2">
						{#if isHost(lobby)}
							{#if getSlot1(lobby) && getSlot2(lobby)}
								<button
									on:click={() => onStart(lobby.id)}
									class="rounded bg-[#4CAF50] px-4 py-2 text-white transition-colors hover:bg-[#45a049]"
								>
									{resources.ui.buttons.start}
								</button>
							{/if}
							<button
								on:click={() => onDeleteConfirm(lobby.id)}
								class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
							>
								{resources.ui.buttons.delete}
							</button>
						{:else if isJoined(lobby)}
							<button
								on:click={() => onDeleteConfirm(lobby.id)}
								class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
							>
								{resources.ui.buttons.leave}
							</button>
						{:else if getSlot1(lobby) && getSlot2(lobby)}
							<span class="rounded bg-gray-500 px-4 py-2 text-white">
								{resources.ui.labels.full}
							</span>
							<button
								on:click={() => onDeleteConfirm(lobby.id)}
								class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
							>
								{resources.ui.buttons.delete}
							</button>
						{:else}
							<button
								on:click={() => onJoin(lobby.id)}
								class="rounded bg-[#4CAF50] px-4 py-2 text-white transition-colors hover:bg-[#45a049]"
							>
								{resources.ui.buttons.join}
							</button>
							<button
								on:click={() => onDeleteConfirm(lobby.id)}
								class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
							>
								{resources.ui.buttons.delete}
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>
