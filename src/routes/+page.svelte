<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/Scene.svelte';
</script>

<main class="w-full h-screen">
	<Canvas>
		<Scene />
	</Canvas>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
}
</style>