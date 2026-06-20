import * as THREE from "three";

export type EarthMarkerCoordinates = {
	latitude: number;
	longitude: number;
};

const DEG_TO_RAD = Math.PI / 180;
const SOUTH_FORWARD_TILT_RADIANS = -18 * DEG_TO_RAD;
const NASA_EARTH_TEXTURE_PATH = "/textures/earth-blue-marble.jpg";
const earthTextureLoader = new THREE.TextureLoader();
let sharedEarthSurfaceTexture: THREE.Texture | null = null;
let hasTriedLoadingNasaTexture = false;
const textureCache = new Map<string, THREE.Texture>();

export class EarthWithMarker {
	readonly group = new THREE.Group();
	private readonly bodyGroup = new THREE.Group();
	private readonly planetRadius: number;
	private readonly earthSurface: THREE.Mesh;
	private readonly earthSurfaceMaterial: THREE.MeshPhysicalMaterial;
	private readonly atmosphere: THREE.Mesh;
	private readonly cloudLayer: THREE.Mesh;
	private readonly markerRoot = new THREE.Group();
	private readonly markerStem: THREE.Mesh;
	private readonly markerHead: THREE.Mesh;
	private readonly markerGlow: THREE.Mesh;
	private markerCoordinates: EarthMarkerCoordinates | null = null;
	private markerNormal = new THREE.Vector3(0, 1, 0);

	constructor(radius: number) {
		this.planetRadius = radius;

		const surfaceTexture = getProceduralEarthTexture();
		this.earthSurfaceMaterial = new THREE.MeshPhysicalMaterial({
			color: 0x6fb8ff,
			map: surfaceTexture,
			normalMap: getNormalMapFromTexture(
				"planet-earth-normal",
				surfaceTexture,
				1.25,
			),
			roughnessMap: getEarthRoughnessMap(
				"planet-earth-roughness",
				surfaceTexture,
			),
			emissive: 0x0d3181,
			emissiveIntensity: 0.08,
			roughness: 0.58,
			metalness: 0.02,
			clearcoat: 0.28,
			clearcoatRoughness: 0.46,
		});
		this.earthSurface = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 48, 48),
			this.earthSurfaceMaterial,
		);

		this.atmosphere = new THREE.Mesh(
			new THREE.SphereGeometry(radius * 1.12, 40, 40),
			createAtmosphereMaterial(),
		);

		this.cloudLayer = new THREE.Mesh(
			new THREE.SphereGeometry(radius * 1.026, 40, 40),
			new THREE.MeshPhysicalMaterial({
				map: getCloudTexture(),
				transparent: true,
				opacity: 0.44,
				depthWrite: false,
				roughness: 0.28,
				metalness: 0,
				clearcoat: 0.22,
				clearcoatRoughness: 0.3,
			}),
		);

		const stemHeight = radius * 0.48;
		const stemRadius = radius * 0.042;
		this.markerStem = new THREE.Mesh(
			new THREE.CylinderGeometry(stemRadius * 0.72, stemRadius, stemHeight, 12),
			new THREE.MeshStandardMaterial({
				color: 0x93c5fd,
				emissive: 0x2563eb,
				emissiveIntensity: 2.1,
				roughness: 0.22,
				metalness: 0.22,
			}),
		);
		this.markerStem.position.y = stemHeight / 2;

		const headRadius = radius * 0.14;
		this.markerHead = new THREE.Mesh(
			new THREE.SphereGeometry(headRadius, 16, 16),
			new THREE.MeshStandardMaterial({
				color: 0xbfdbfe,
				emissive: 0x38bdf8,
				emissiveIntensity: 2.6,
				roughness: 0.18,
				metalness: 0.08,
			}),
		);
		this.markerHead.position.y = stemHeight + headRadius * 0.25;

		this.markerGlow = new THREE.Mesh(
			new THREE.SphereGeometry(headRadius * 2.5, 18, 18),
			new THREE.MeshBasicMaterial({
				color: 0x38bdf8,
				transparent: true,
				opacity: 0.38,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			}),
		);
		this.markerGlow.position.copy(this.markerHead.position);

		const markerHalo = new THREE.Mesh(
			new THREE.RingGeometry(headRadius * 1.45, headRadius * 2.2, 32),
			new THREE.MeshBasicMaterial({
				color: 0xe0f2fe,
				transparent: true,
				opacity: 0.26,
				side: THREE.DoubleSide,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			}),
		);
		markerHalo.position.copy(this.markerHead.position);
		markerHalo.rotation.x = Math.PI / 2;

		this.markerRoot.visible = false;
		this.markerRoot.add(
			this.markerStem,
			this.markerHead,
			this.markerGlow,
			markerHalo,
		);
		this.bodyGroup.add(
			this.earthSurface,
			this.cloudLayer,
			this.atmosphere,
			this.markerRoot,
		);
		this.group.add(this.bodyGroup);
		this.applyDefaultOrientation();
		this.tryApplyNasaTexture();
	}

	setMarkerCoordinates(coordinates: EarthMarkerCoordinates | null) {
		this.markerCoordinates = coordinates;

		if (!coordinates) {
			this.markerRoot.visible = false;
			return;
		}

		const latRad = coordinates.latitude * DEG_TO_RAD;
		const lonRad = coordinates.longitude * DEG_TO_RAD;
		const x = this.planetRadius * Math.cos(latRad) * Math.cos(lonRad);
		const y = this.planetRadius * Math.sin(latRad);
		const z = this.planetRadius * Math.cos(latRad) * Math.sin(lonRad);
		const surfacePosition = new THREE.Vector3(x, y, z);
		this.markerNormal = surfacePosition.clone().normalize();

		this.markerRoot.visible = true;
		this.markerRoot.position.copy(surfacePosition);
		this.markerRoot.quaternion.setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			this.markerNormal,
		);
	}

	resetOrientation() {
		this.applyDefaultOrientation();
	}

	orientMarkerToward(worldTarget: THREE.Vector3) {
		if (!this.markerCoordinates || !this.group.parent) {
			return;
		}

		const localTargetDirection = this.group.parent
			.worldToLocal(worldTarget.clone())
			.sub(this.group.position)
			.normalize();
		if (localTargetDirection.lengthSq() === 0) {
			return;
		}

		this.bodyGroup.quaternion.setFromUnitVectors(
			this.markerNormal,
			localTargetDirection,
		);
	}

	private applyDefaultOrientation() {
		this.bodyGroup.rotation.set(SOUTH_FORWARD_TILT_RADIANS, 0, 0);
	}

	private tryApplyNasaTexture() {
		if (sharedEarthSurfaceTexture) {
			this.applySurfaceTexture(sharedEarthSurfaceTexture);
			return;
		}

		if (hasTriedLoadingNasaTexture) {
			return;
		}

		hasTriedLoadingNasaTexture = true;
		earthTextureLoader.load(
			NASA_EARTH_TEXTURE_PATH,
			(texture) => {
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.ClampToEdgeWrapping;
				sharedEarthSurfaceTexture = texture;
				this.applySurfaceTexture(texture);
			},
			undefined,
			() => {
				// Keep procedural fallback when no local NASA texture asset exists.
			},
		);
	}

	private applySurfaceTexture(texture: THREE.Texture) {
		this.earthSurfaceMaterial.map = texture;
		this.earthSurfaceMaterial.normalMap = getNormalMapFromTexture(
			`earth-surface-normal-${getTextureIdentity(texture)}`,
			texture,
			1.25,
		);
		this.earthSurfaceMaterial.roughnessMap = getEarthRoughnessMap(
			`earth-surface-roughness-${getTextureIdentity(texture)}`,
			texture,
		);
		this.earthSurfaceMaterial.needsUpdate = true;
	}
}

function createAtmosphereMaterial() {
	return new THREE.ShaderMaterial({
		uniforms: {
			glowColor: { value: new THREE.Color(0x7dd3fc) },
			intensity: { value: 0.88 },
			power: { value: 2.8 },
		},
		vertexShader: `
			varying vec3 vWorldPosition;
			varying vec3 vWorldNormal;

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);
				vWorldPosition = worldPosition.xyz;
				vWorldNormal = normalize(mat3(modelMatrix) * normal);
				gl_Position = projectionMatrix * viewMatrix * worldPosition;
			}
		`,
		fragmentShader: `
			uniform vec3 glowColor;
			uniform float intensity;
			uniform float power;

			varying vec3 vWorldPosition;
			varying vec3 vWorldNormal;

			void main() {
				vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
				float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDirection), 0.0), power);
				float alpha = fresnel * intensity;
				gl_FragColor = vec4(glowColor, alpha);
			}
		`,
		transparent: true,
		blending: THREE.AdditiveBlending,
		side: THREE.BackSide,
		depthWrite: false,
	});
}

function getProceduralEarthTexture() {
	return getCanvasTexture(
		"planet-earth",
		1024,
		512,
		(context, width, height) => {
			fillGradient(context, width, height, "#42a5f5", "#0f3f9a");

			const continents = [
				[
					[0.12, 0.28],
					[0.18, 0.16],
					[0.25, 0.12],
					[0.31, 0.2],
					[0.28, 0.34],
					[0.2, 0.42],
					[0.13, 0.38],
				],
				[
					[0.42, 0.18],
					[0.52, 0.11],
					[0.62, 0.15],
					[0.69, 0.28],
					[0.62, 0.38],
					[0.49, 0.34],
					[0.43, 0.25],
				],
				[
					[0.57, 0.58],
					[0.63, 0.52],
					[0.68, 0.56],
					[0.66, 0.69],
					[0.6, 0.76],
					[0.54, 0.68],
				],
				[
					[0.28, 0.58],
					[0.33, 0.52],
					[0.4, 0.56],
					[0.43, 0.64],
					[0.38, 0.76],
					[0.29, 0.72],
					[0.25, 0.64],
				],
			];

			context.fillStyle = "rgba(72, 140, 86, 0.96)";
			for (const continent of continents) {
				drawPolygon(context, continent, width, height);
				context.fill();
			}

			context.fillStyle = "rgba(120, 184, 132, 0.65)";
			for (let index = 0; index < 42; index += 1) {
				const x = randomRange(index * 17 + 1, 0, width);
				const y = randomRange(index * 17 + 3, 0, height);
				const rx = randomRange(index * 17 + 5, 18, 52);
				const ry = randomRange(index * 17 + 7, 10, 28);
				context.beginPath();
				context.ellipse(
					x,
					y,
					rx,
					ry,
					randomRange(index * 17 + 11, 0, Math.PI),
					0,
					Math.PI * 2,
				);
				context.fill();
			}

			context.fillStyle = "rgba(198, 232, 255, 0.85)";
			context.fillRect(0, 0, width, height * 0.06);
			context.fillRect(0, height * 0.94, width, height * 0.06);
			addVignette(context, width, height, 0.1);
		},
	);
}

function getCloudTexture() {
	return getCanvasTexture(
		"planet-earth-clouds",
		1024,
		512,
		(context, width, height) => {
			context.clearRect(0, 0, width, height);
			for (let band = 0; band < 24; band += 1) {
				const y = (band / 24) * height;
				const thickness = randomRange(band * 29 + 1, 8, 22);
				context.fillStyle = `rgba(255, 255, 255, ${randomRange(band * 29 + 3, 0.08, 0.22)})`;
				context.beginPath();
				context.moveTo(0, y);
				for (let x = 0; x <= width; x += 18) {
					const waveY =
						y +
						Math.sin(x * 0.012 + band * 0.8) * 10 +
						Math.cos(x * 0.026 + band * 0.4) * 6;
					context.lineTo(x, waveY);
				}
				context.lineTo(width, y + thickness);
				context.lineTo(0, y + thickness);
				context.closePath();
				context.fill();
			}
		},
	);
}

function getCanvasTexture(
	key: string,
	width: number,
	height: number,
	draw: (
		context: CanvasRenderingContext2D,
		width: number,
		height: number,
	) => void,
) {
	const cached = textureCache.get(key);
	if (cached) {
		return cached as THREE.CanvasTexture;
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(`Unable to create 2D context for ${key}`);
	}

	draw(context, width, height);

	const texture = new THREE.CanvasTexture(canvas);
	configureTexture(texture, THREE.SRGBColorSpace);
	textureCache.set(key, texture);
	return texture;
}

function getNormalMapFromTexture(
	key: string,
	sourceTexture: THREE.Texture,
	strength: number,
) {
	const cached = textureCache.get(key);
	if (cached) {
		return cached;
	}

	const canvas = createCanvasFromTexture(sourceTexture);
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(`Unable to create 2D context for ${key}`);
	}

	const { width, height } = canvas;
	const source = context.getImageData(0, 0, width, height);
	const output = context.createImageData(width, height);
	const sourceData = source.data;
	const targetData = output.data;

	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const left = getLuminanceAt(sourceData, width, height, x - 1, y);
			const right = getLuminanceAt(sourceData, width, height, x + 1, y);
			const up = getLuminanceAt(sourceData, width, height, x, y - 1);
			const down = getLuminanceAt(sourceData, width, height, x, y + 1);
			const nx = ((left - right) / 255) * strength;
			const ny = ((up - down) / 255) * strength;
			const nz = 1;
			const length = Math.hypot(nx, ny, nz) || 1;
			const offset = (y * width + x) * 4;
			targetData[offset] = ((nx / length) * 0.5 + 0.5) * 255;
			targetData[offset + 1] = ((ny / length) * 0.5 + 0.5) * 255;
			targetData[offset + 2] = ((nz / length) * 0.5 + 0.5) * 255;
			targetData[offset + 3] = 255;
		}
	}

	context.putImageData(output, 0, 0);
	const texture = new THREE.CanvasTexture(canvas);
	configureTexture(texture, THREE.NoColorSpace);
	textureCache.set(key, texture);
	return texture;
}

function getEarthRoughnessMap(key: string, sourceTexture: THREE.Texture) {
	const cached = textureCache.get(key);
	if (cached) {
		return cached;
	}

	const canvas = createCanvasFromTexture(sourceTexture);
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(`Unable to create 2D context for ${key}`);
	}

	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	for (let index = 0; index < data.length; index += 4) {
		const red = data[index];
		const green = data[index + 1];
		const blue = data[index + 2];
		const brightness = getLuminance(red, green, blue);
		const oceanBias = blue - Math.max(red, green);
		const vegetationBias = green - Math.max(red, blue);
		const cloudBias = brightness - Math.max(red, green, blue) * 0.92;
		const roughness =
			oceanBias > 18
				? 72 + (255 - brightness) * 0.08
				: cloudBias > 8 || brightness > 214
					? 104
					: vegetationBias > 10
						? 184
						: 164 + (140 - Math.min(brightness, 140)) * 0.18;

		const channel = THREE.MathUtils.clamp(roughness, 0, 255);
		data[index] = channel;
		data[index + 1] = channel;
		data[index + 2] = channel;
		data[index + 3] = 255;
	}
	context.putImageData(imageData, 0, 0);

	const texture = new THREE.CanvasTexture(canvas);
	configureTexture(texture, THREE.NoColorSpace);
	textureCache.set(key, texture);
	return texture;
}

function createCanvasFromTexture(sourceTexture: THREE.Texture) {
	const sourceImage = sourceTexture.image as
		| HTMLCanvasElement
		| HTMLImageElement
		| ImageBitmap;
	if (!sourceImage || !("width" in sourceImage) || !("height" in sourceImage)) {
		throw new Error("Texture image is not ready for derived earth maps");
	}

	const canvas = document.createElement("canvas");
	canvas.width = sourceImage.width;
	canvas.height = sourceImage.height;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Unable to create derived texture canvas");
	}
	context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
	return canvas;
}

function configureTexture(
	texture: THREE.Texture,
	colorSpace: THREE.ColorSpace,
) {
	texture.colorSpace = colorSpace;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.needsUpdate = true;
}

function getTextureIdentity(texture: THREE.Texture) {
	return texture.uuid.slice(0, 8);
}

function getLuminanceAt(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	x: number,
	y: number,
) {
	const clampedX = THREE.MathUtils.clamp(x, 0, width - 1);
	const clampedY = THREE.MathUtils.clamp(y, 0, height - 1);
	const offset = (clampedY * width + clampedX) * 4;
	return getLuminance(data[offset], data[offset + 1], data[offset + 2]);
}

function getLuminance(red: number, green: number, blue: number) {
	return red * 0.299 + green * 0.587 + blue * 0.114;
}

function drawPolygon(
	context: CanvasRenderingContext2D,
	points: number[][],
	width: number,
	height: number,
) {
	context.beginPath();
	context.moveTo(points[0][0] * width, points[0][1] * height);
	for (let index = 1; index < points.length; index += 1) {
		context.lineTo(points[index][0] * width, points[index][1] * height);
	}
	context.closePath();
}

function fillGradient(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
	topColor: string,
	bottomColor: string,
) {
	const gradient = context.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, topColor);
	gradient.addColorStop(1, bottomColor);
	context.fillStyle = gradient;
	context.fillRect(0, 0, width, height);
}

function addVignette(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
	strength: number,
) {
	const gradient = context.createRadialGradient(
		width * 0.5,
		height * 0.5,
		Math.min(width, height) * 0.12,
		width * 0.5,
		height * 0.5,
		Math.max(width, height) * 0.66,
	);
	gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
	gradient.addColorStop(1, `rgba(5, 11, 25, ${strength})`);
	context.fillStyle = gradient;
	context.fillRect(0, 0, width, height);
}

function randomRange(seed: number, min: number, max: number) {
	const value = pseudoRandom(seed);
	return min + (max - min) * value;
}

function pseudoRandom(seed: number) {
	const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
	return value - Math.floor(value);
}
