<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { PerspectiveCamera } from 'three';
	import CameraControls from 'camera-controls';
	import * as THREE from 'three';

	// Kamera-Eigenschaften
	export let position = [10, 10, 10];
	export let lookAt = [0, 1, 0];
	export let fov = 50;
	export let near = 0.1;
	export let far = 1000;

	// Camera Controls Setup
	const { dom, invalidate } = useThrelte();

	// Installiere CameraControls
	CameraControls.install({ THREE });

	// Erstelle Kamera und Controls
	const camera = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
	camera.position.set(position[0], position[1], position[2]);
	camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);

	// Erstelle Controls mit korrektem Typ
	let controls: CameraControls | undefined;

	useTask(() => {
		if (dom && !controls) {
			controls = new CameraControls(camera, dom);
			controls.setLookAt(
				position[0],
				position[1],
				position[2],
				lookAt[0],
				lookAt[1],
				lookAt[2],
				true
			);
		}
	});

	// Kontrolliere die Aktivierung der Kamera-Steuerung
	export function setControlsEnabled(enabled: boolean) {
		if (controls) {
			controls.enabled = enabled; // Kamera nur aktivieren, wenn nötig
		}
	}

	// Update Controls in jedem Frame
	useTask(
		(delta: number) => {
			if (controls && controls.update(delta)) {
				invalidate();
			}
		},
		{ autoInvalidate: false }
	);
</script>

<T is={camera} makeDefault />
