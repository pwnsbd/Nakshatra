import * as THREE from "three";

const STARFIELD_VERTEX_SHADER = /* glsl */ `
	attribute float aSize;
	attribute float aPhase;
	attribute float aIntensity;
	varying vec3 vColor;
	varying float vPhase;
	varying float vIntensity;
	uniform float uTime;

	void main() {
		vColor = color;
		vPhase = aPhase;
		vIntensity = aIntensity;

		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_Position = projectionMatrix * mvPosition;
		gl_PointSize = aSize * (240.0 / max(-mvPosition.z, 1.0));
	}
`;

const STARFIELD_FRAGMENT_SHADER = /* glsl */ `
	varying vec3 vColor;
	varying float vPhase;
	varying float vIntensity;
	uniform float uTime;

	void main() {
		vec2 centered = gl_PointCoord - vec2(0.5);
		float dist = length(centered);
		float core = smoothstep(0.5, 0.0, dist);
		float halo = smoothstep(0.35, 0.0, dist) * 0.45;
		float twinkle = 0.92 + sin((uTime * 0.55) + vPhase) * 0.08;
		float alpha = (core + halo) * vIntensity * twinkle;

		if (alpha < 0.02) {
			discard;
		}

		gl_FragColor = vec4(vColor, alpha);
	}
`;

export interface StarfieldOptions {
	count?: number;
	innerRadius?: number;
	outerRadius?: number;
}

export class Starfield {
	readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
	readonly farPoints: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
	private readonly material: THREE.ShaderMaterial;
	private readonly farMaterial: THREE.ShaderMaterial;

	constructor({
		count = 1800,
		innerRadius = 90,
		outerRadius = 170,
	}: StarfieldOptions = {}) {
		const geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const phases = new Float32Array(count);
		const intensities = new Float32Array(count);
		const palette = [
			new THREE.Color(0xf8fbff),
			new THREE.Color(0xe0f2fe),
			new THREE.Color(0xbfdbfe),
			new THREE.Color(0xc4b5fd),
		];

		for (let index = 0; index < count; index += 1) {
			const offset = index * 3;
			const direction = new THREE.Vector3(
				THREE.MathUtils.randFloatSpread(2),
				THREE.MathUtils.randFloatSpread(1.45),
				THREE.MathUtils.randFloatSpread(2),
			)
				.normalize()
				.multiplyScalar(
					THREE.MathUtils.lerp(
						innerRadius,
						outerRadius,
						Math.pow(Math.random(), 0.58),
					),
				);
			const brightness = Math.random();
			const isBright = brightness > 0.972;
			const color = palette[Math.floor(Math.random() * palette.length)].clone();

			positions[offset] = direction.x;
			positions[offset + 1] = direction.y;
			positions[offset + 2] = direction.z;

			if (isBright) {
				color.lerp(new THREE.Color(0xffffff), 0.42);
			}

			colors[offset] = color.r;
			colors[offset + 1] = color.g;
			colors[offset + 2] = color.b;
			sizes[index] = isBright
				? THREE.MathUtils.randFloat(3.6, 6.1)
				: THREE.MathUtils.randFloat(1.2, 2.8);
			phases[index] = Math.random() * Math.PI * 2;
			intensities[index] = isBright
				? THREE.MathUtils.randFloat(1.05, 1.38)
				: THREE.MathUtils.randFloat(0.42, 0.92);
		}

		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
		geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
		geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
		geometry.setAttribute(
			"aIntensity",
			new THREE.BufferAttribute(intensities, 1),
		);

		this.material = new THREE.ShaderMaterial({
			vertexShader: STARFIELD_VERTEX_SHADER,
			fragmentShader: STARFIELD_FRAGMENT_SHADER,
			transparent: true,
			depthWrite: false,
			vertexColors: true,
			blending: THREE.AdditiveBlending,
			uniforms: {
				uTime: { value: 0 },
			},
		});

		const farGeometry = geometry.clone();
		const farSizes = farGeometry.getAttribute("aSize") as THREE.BufferAttribute;
		for (let index = 0; index < farSizes.count; index += 1) {
			farSizes.setX(index, farSizes.getX(index) * 0.72);
		}

		this.farMaterial = new THREE.ShaderMaterial({
			vertexShader: STARFIELD_VERTEX_SHADER,
			fragmentShader: STARFIELD_FRAGMENT_SHADER,
			transparent: true,
			depthWrite: false,
			vertexColors: true,
			blending: THREE.AdditiveBlending,
			uniforms: {
				uTime: { value: 0 },
			},
		});

		this.points = new THREE.Points(geometry, this.material);
		this.points.frustumCulled = false;
		this.points.renderOrder = -10;

		this.farPoints = new THREE.Points(farGeometry, this.farMaterial);
		this.farPoints.frustumCulled = false;
		this.farPoints.renderOrder = -11;
		this.farPoints.scale.setScalar(1.22);
	}

	update(time: number) {
		this.material.uniforms.uTime.value = time;
		this.farMaterial.uniforms.uTime.value = time * 0.82;
		this.farPoints.rotation.y = time * 0.012;
		this.farPoints.rotation.x = Math.sin(time * 0.05) * 0.025;
	}

	dispose() {
		this.points.geometry.dispose();
		this.farPoints.geometry.dispose();
		this.material.dispose();
		this.farMaterial.dispose();
	}
}
