<script lang="ts">
	import { T } from '@threlte/core'
	import { Color } from 'three'
	import { interactivity } from '@threlte/extras'
	import SceneCamera from './SceneCamera.svelte'
	import ChessBoard from '$lib/components/ChessBoard.svelte';
	interactivity();
</script>

<T.Scene background={new Color(0x000000)}>
	<ChessBoard />
	<SceneCamera />

	<T.DirectionalLight
		position={[5, 8, 5]} 
		intensity={2} 
		castShadow 
		shadow.mapSize.width={2048} 
		shadow.mapSize.height={2048}
		shadow.camera.near={0.1}
		shadow.camera.far={20}
	/>

	<T.AmbientLight intensity={0.1} />
</T.Scene>
  