<script lang="ts">
	import { resources } from '$lib/resources';
	import { ChessColor } from '$lib/types/chess';
	import { playerName } from '$lib/stores/playerStore';
	import { supabase } from '$lib/services/supabase';

	export let slotNumber: 1 | 2;
	export let player: string | undefined;
	export let color: ChessColor | undefined;
	export let isHost: boolean;
	export let onColorChange: (color: ChessColor) => void;

	let displayName: string | undefined;

	async function fetchDisplayName(userId: string) {
		const { data, error } = await supabase
			.from('player_profiles')
			.select('display_name')
			.eq('auth_user_id', userId)
			.single();

		if (error) {
			console.error('Error fetching display name:', error);
			displayName = userId;
			return;
		}

		displayName = data?.display_name || userId;
	}

	$: if (player) {
		fetchDisplayName(player);
	}
</script>

<div
	class="rounded-lg bg-black/20 p-4 {color === ChessColor.White
		? 'bg-white/10'
		: color === ChessColor.Black
			? 'bg-black/20'
			: ''}"
>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<span class="text-lg">{resources.ui.lobby.players[`slot${slotNumber}`]}:</span>
			<span class="text-{resources.config.colors.ui.text.secondary}">
				{displayName || resources.ui.lobby.players.waitingForPlayer}
			</span>
			{#if player === $playerName}
				<span class="text-{resources.config.colors.ui.success}">({resources.ui.labels.you})</span>
			{/if}
		</div>
		{#if isHost && player}
			<div class="flex gap-4">
				<input
					type="radio"
					id="slot{slotNumber}-white"
					name="slot{slotNumber}-color"
					value={ChessColor.White}
					checked={color === ChessColor.White}
					on:change={() => onColorChange(ChessColor.White)}
					class="form-radio h-4 w-4 text-{resources.config.colors.ui
						.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
				/>
				<label for="slot{slotNumber}-white" class="text-white"
					>{resources.ui.lobby.players.color.white}</label
				>

				<input
					type="radio"
					id="slot{slotNumber}-black"
					name="slot{slotNumber}-color"
					value={ChessColor.Black}
					checked={color === ChessColor.Black}
					on:change={() => onColorChange(ChessColor.Black)}
					class="form-radio h-4 w-4 text-{resources.config.colors.ui
						.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
				/>
				<label for="slot{slotNumber}-black" class="text-white"
					>{resources.ui.lobby.players.color.black}</label
				>

				<input
					type="radio"
					id="slot{slotNumber}-random"
					name="slot{slotNumber}-color"
					value={ChessColor.Random}
					checked={color === ChessColor.Random}
					on:change={() => onColorChange(ChessColor.Random)}
					class="form-radio h-4 w-4 text-{resources.config.colors.ui
						.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
				/>
				<label for="slot{slotNumber}-random" class="text-white"
					>{resources.ui.lobby.players.color.random}</label
				>
			</div>
		{/if}
	</div>
</div>
