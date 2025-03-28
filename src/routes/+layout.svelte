<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore';
	import { resources } from '$lib/resources';

	let { children } = $props();

	$effect(() => {
		if (!$authStore.loading && !$page.url.pathname.startsWith('/auth') && !$authStore.user) {
			goto('/auth');
		}
	});
</script>

{#if $authStore.loading}
	<div class="w-screen h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
		<div class="text-xl">Loading...</div>
	</div>
{:else}
	{@render children()}
{/if}
