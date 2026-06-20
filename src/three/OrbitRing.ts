import * as THREE from "three";

export function createOrbitRing(
	points: ReadonlyArray<THREE.Vector3>,
): THREE.Group {
	const group = new THREE.Group();
	const geometry = new THREE.BufferGeometry().setFromPoints([...points]);
	const core = new THREE.LineLoop(
		geometry,
		new THREE.LineBasicMaterial({
			color: 0xf3dec0,
			transparent: true,
			opacity: 0.22,
			depthWrite: false,
		}),
	);

	const glow = new THREE.LineLoop(
		geometry.clone(),
		new THREE.LineBasicMaterial({
			color: 0x7dd3fc,
			transparent: true,
			opacity: 0.08,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	glow.scale.setScalar(1.008);

	const outerGlow = new THREE.LineLoop(
		geometry.clone(),
		new THREE.LineBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.03,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	outerGlow.scale.setScalar(1.016);

	group.add(outerGlow, glow, core);
	return group;
}
