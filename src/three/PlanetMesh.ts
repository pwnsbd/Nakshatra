import * as THREE from "three";
import { EarthWithMarker } from "./EarthWithMarker";

export type PlanetKind =
	| "sun"
	| "mercury"
	| "venus"
	| "earth"
	| "mars"
	| "jupiter"
	| "saturn";

const textureCache = new Map<string, THREE.Texture>();

export function createPlanetMesh(
	kind: PlanetKind,
	radius: number,
): THREE.Group {
	const group = new THREE.Group();

	switch (kind) {
		case "sun": {
			const map = getSunTexture();
			const core = new THREE.Mesh(
				new THREE.SphereGeometry(radius, 48, 48),
				new THREE.MeshPhysicalMaterial({
					color: 0xfbbf24,
					map,
					emissive: 0xff8c1a,
					emissiveMap: map,
					emissiveIntensity: 2.8,
					normalMap: getNormalMapFromTexture("planet-sun-normal", map, 0.52),
					roughnessMap: getRoughnessMapFromTexture(
						"planet-sun-roughness",
						map,
						(luminance) => 72 + (255 - luminance) * 0.18,
					),
					roughness: 0.72,
					metalness: 0,
					clearcoat: 0.08,
					clearcoatRoughness: 0.84,
				}),
			);

			const glow = new THREE.Mesh(
				new THREE.SphereGeometry(radius * 1.45, 40, 40),
				new THREE.MeshBasicMaterial({
					color: 0xf59e0b,
					transparent: true,
					opacity: 0.2,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
				}),
			);

			const corona = new THREE.Mesh(
				new THREE.SphereGeometry(radius * 1.82, 32, 32),
				new THREE.MeshBasicMaterial({
					color: 0xfef3c7,
					transparent: true,
					opacity: 0.08,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
				}),
			);

			group.add(core, glow, corona);
			break;
		}
		case "mercury": {
			const map = getMercuryTexture();
			group.add(
				new THREE.Mesh(
					new THREE.SphereGeometry(radius, 36, 36),
					createRockyPlanetMaterial({
						key: "planet-mercury",
						color: 0xa08a74,
						map,
						roughness: 0.96,
						metalness: 0.01,
						normalStrength: 2.2,
						clearcoat: 0.04,
					}),
				),
			);
			break;
		}
		case "venus": {
			const map = getVenusTexture();
			const planet = new THREE.Mesh(
				new THREE.SphereGeometry(radius, 36, 36),
				new THREE.MeshPhysicalMaterial({
					color: 0xf1dfbd,
					map,
					normalMap: getNormalMapFromTexture("planet-venus-normal", map, 0.7),
					roughnessMap: getRoughnessMapFromTexture(
						"planet-venus-roughness",
						map,
						(luminance) => 150 + luminance * 0.25,
					),
					emissive: 0xcf9b63,
					emissiveIntensity: 0.08,
					roughness: 0.82,
					metalness: 0,
					clearcoat: 0.18,
					clearcoatRoughness: 0.54,
				}),
			);
			const haze = new THREE.Mesh(
				new THREE.SphereGeometry(radius * 1.09, 30, 30),
				new THREE.MeshBasicMaterial({
					color: 0xfff4df,
					transparent: true,
					opacity: 0.18,
					depthWrite: false,
				}),
			);
			group.add(planet, haze);
			break;
		}
		case "earth": {
			const earthWithMarker = new EarthWithMarker(radius);
			group.add(earthWithMarker.group);
			group.userData.earthWithMarker = earthWithMarker;
			break;
		}
		case "mars": {
			const map = getMarsTexture();
			group.add(
				new THREE.Mesh(
					new THREE.SphereGeometry(radius, 34, 34),
					createRockyPlanetMaterial({
						key: "planet-mars",
						color: 0xc8663a,
						map,
						emissive: 0x6f2414,
						emissiveIntensity: 0.05,
						roughness: 0.88,
						metalness: 0.02,
						normalStrength: 1.8,
						clearcoat: 0.05,
					}),
				),
			);
			break;
		}
		case "jupiter": {
			const map = getJupiterTexture();
			const planet = new THREE.Mesh(
				new THREE.SphereGeometry(radius, 42, 42),
				new THREE.MeshPhysicalMaterial({
					color: 0xd7bb96,
					map,
					normalMap: getNormalMapFromTexture(
						"planet-jupiter-normal",
						map,
						0.42,
					),
					roughnessMap: getRoughnessMapFromTexture(
						"planet-jupiter-roughness",
						map,
						(luminance) => 104 + luminance * 0.22,
					),
					emissive: 0x5e412a,
					emissiveIntensity: 0.03,
					roughness: 0.58,
					metalness: 0,
					clearcoat: 0.22,
					clearcoatRoughness: 0.48,
				}),
			);
			group.add(planet);
			addLatitudeBand(group, radius, 0.5, 0xf1dfbf, 0.07);
			addLatitudeBand(group, radius, -0.18, 0xb97754, 0.06);
			break;
		}
		case "saturn": {
			const map = getSaturnTexture();
			const planet = new THREE.Mesh(
				new THREE.SphereGeometry(radius, 38, 38),
				new THREE.MeshPhysicalMaterial({
					color: 0xd9c48d,
					map,
					normalMap: getNormalMapFromTexture("planet-saturn-normal", map, 0.34),
					roughnessMap: getRoughnessMapFromTexture(
						"planet-saturn-roughness",
						map,
						(luminance) => 120 + luminance * 0.2,
					),
					emissive: 0x4f4124,
					emissiveIntensity: 0.04,
					roughness: 0.66,
					metalness: 0,
					clearcoat: 0.2,
					clearcoatRoughness: 0.5,
				}),
			);
			const ring = new THREE.Mesh(
				new THREE.RingGeometry(radius * 1.52, radius * 2.27, 160),
				new THREE.MeshBasicMaterial({
					map: getSaturnRingTexture(),
					transparent: true,
					opacity: 0.95,
					side: THREE.DoubleSide,
					depthWrite: false,
				}),
			);
			ring.rotation.x = Math.PI / 2.28;
			ring.rotation.z = 0.34;
			ring.scale.set(1.18, 1, 0.82);

			const ringGlow = new THREE.Mesh(
				new THREE.RingGeometry(radius * 1.7, radius * 2.95, 120),
				new THREE.MeshBasicMaterial({
					color: 0xf2e7ca,
					transparent: true,
					opacity: 0.12,
					side: THREE.DoubleSide,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
				}),
			);
			ringGlow.rotation.copy(ring.rotation);
			ringGlow.scale.copy(ring.scale);
			group.add(planet, ringGlow, ring);
			break;
		}
	}

	return group;
}

function addLatitudeBand(
	group: THREE.Group,
	radius: number,
	heightFactor: number,
	color: number,
	opacity: number,
) {
	const bandRadius = Math.sqrt(
		Math.max(radius * radius - (radius * heightFactor) ** 2, 0),
	);
	const band = new THREE.Mesh(
		new THREE.TorusGeometry(bandRadius, Math.max(radius * 0.04, 0.02), 10, 64),
		new THREE.MeshBasicMaterial({
			color,
			transparent: true,
			opacity,
			depthWrite: false,
		}),
	);
	band.position.y = radius * heightFactor;
	band.rotation.x = Math.PI / 2;
	group.add(band);
}

function getSunTexture() {
	return getCanvasTexture("planet-sun", 1024, 512, (context, width, height) => {
		fillGradient(context, width, height, "#fff2b8", "#f97316");

		for (let band = 0; band < 24; band += 1) {
			const y = (band / 24) * height;
			const amplitude = randomRange(band * 31 + 1, 8, 28);
			const thickness = randomRange(band * 31 + 5, 14, 34);
			context.fillStyle = `rgba(255, ${Math.round(randomRange(band * 31 + 9, 150, 220))}, ${Math.round(randomRange(band * 31 + 11, 40, 120))}, ${randomRange(band * 31 + 13, 0.1, 0.26).toFixed(3)})`;
			context.beginPath();
			context.moveTo(0, y);
			for (let x = 0; x <= width; x += 14) {
				const waveY =
					y +
					Math.sin(x * 0.017 + band * 0.9) * amplitude +
					Math.cos(x * 0.006 + band * 0.42) * amplitude * 0.55;
				context.lineTo(x, waveY);
			}
			context.lineTo(width, y + thickness);
			context.lineTo(0, y + thickness);
			context.closePath();
			context.fill();
		}

		for (let index = 0; index < 160; index += 1) {
			const x = randomRange(index * 17 + 1, 0, width);
			const y = randomRange(index * 17 + 3, 0, height);
			const radius = randomRange(index * 17 + 5, 8, 42);
			const flare = context.createRadialGradient(x, y, 0, x, y, radius);
			flare.addColorStop(
				0,
				`rgba(255, 251, 235, ${randomRange(index * 17 + 7, 0.22, 0.48).toFixed(3)})`,
			);
			flare.addColorStop(
				0.38,
				`rgba(253, 186, 116, ${randomRange(index * 17 + 9, 0.14, 0.28).toFixed(3)})`,
			);
			flare.addColorStop(1, "rgba(249, 115, 22, 0)");
			context.fillStyle = flare;
			context.beginPath();
			context.arc(x, y, radius, 0, Math.PI * 2);
			context.fill();
		}

		addVignette(context, width, height, 0.05);
	});
}

function getMercuryTexture() {
	return getCanvasTexture(
		"planet-mercury",
		768,
		384,
		(context, width, height) => {
			fillGradient(context, width, height, "#97816f", "#65584f");
			for (let index = 0; index < 240; index += 1) {
				const radius = randomRange(index * 13 + 2, 4, 24);
				const x = randomRange(index * 13 + 5, 0, width);
				const y = randomRange(index * 13 + 7, 0, height);
				context.fillStyle = `rgba(58, 48, 43, ${randomRange(index * 13 + 11, 0.08, 0.22)})`;
				context.beginPath();
				context.arc(x, y, radius, 0, Math.PI * 2);
				context.fill();
				context.strokeStyle = `rgba(208, 190, 172, ${randomRange(index * 13 + 17, 0.04, 0.12)})`;
				context.lineWidth = Math.max(radius * 0.14, 1);
				context.beginPath();
				context.arc(x, y, radius * 0.72, 0, Math.PI * 2);
				context.stroke();
			}
			addVignette(context, width, height, 0.18);
		},
	);
}

function getVenusTexture() {
	return getCanvasTexture(
		"planet-venus",
		768,
		384,
		(context, width, height) => {
			fillGradient(context, width, height, "#f6ead1", "#d9b785");
			for (let band = 0; band < 18; band += 1) {
				const y = (band / 18) * height;
				const amplitude = randomRange(band * 23 + 1, 6, 18);
				const thickness = randomRange(band * 23 + 3, 12, 24);
				context.fillStyle = `rgba(255, 244, 221, ${randomRange(band * 23 + 5, 0.12, 0.26)})`;
				context.beginPath();
				context.moveTo(0, y);
				for (let x = 0; x <= width; x += 16) {
					const waveY =
						y +
						Math.sin(x * 0.016 + band * 0.85) * amplitude +
						Math.cos(x * 0.007 + band * 0.35) * amplitude * 0.42;
					context.lineTo(x, waveY);
				}
				context.lineTo(width, y + thickness);
				context.lineTo(0, y + thickness);
				context.closePath();
				context.fill();
			}
			addVignette(context, width, height, 0.08);
		},
	);
}

function getMarsTexture() {
	return getCanvasTexture("planet-mars", 768, 384, (context, width, height) => {
		fillGradient(context, width, height, "#ce7247", "#88381f");
		for (let index = 0; index < 140; index += 1) {
			const x = randomRange(index * 19 + 1, 0, width);
			const y = randomRange(index * 19 + 3, 0, height);
			const rx = randomRange(index * 19 + 5, 12, 48);
			const ry = randomRange(index * 19 + 7, 8, 24);
			context.fillStyle = `rgba(87, 31, 20, ${randomRange(index * 19 + 11, 0.08, 0.2)})`;
			context.beginPath();
			context.ellipse(
				x,
				y,
				rx,
				ry,
				randomRange(index * 19 + 13, 0, Math.PI),
				0,
				Math.PI * 2,
			);
			context.fill();
		}
		context.fillStyle = "rgba(255, 241, 225, 0.6)";
		context.beginPath();
		context.ellipse(
			width * 0.5,
			height * 0.08,
			width * 0.12,
			height * 0.05,
			0,
			0,
			Math.PI * 2,
		);
		context.fill();
		context.beginPath();
		context.ellipse(
			width * 0.48,
			height * 0.92,
			width * 0.09,
			height * 0.04,
			0,
			0,
			Math.PI * 2,
		);
		context.fill();
		addVignette(context, width, height, 0.1);
	});
}

function getJupiterTexture() {
	return getCanvasTexture(
		"planet-jupiter",
		1024,
		512,
		(context, width, height) => {
			fillGradient(context, width, height, "#ecd6b5", "#a97958");
			const bands = [
				"rgba(244, 226, 196, 0.95)",
				"rgba(200, 151, 111, 0.95)",
				"rgba(233, 205, 170, 0.95)",
				"rgba(181, 123, 89, 0.92)",
				"rgba(248, 232, 208, 0.9)",
				"rgba(196, 144, 108, 0.9)",
			];
			const bandHeight = height / 18;
			for (let band = 0; band < 18; band += 1) {
				const baseY = band * bandHeight;
				context.fillStyle = bands[band % bands.length];
				context.beginPath();
				context.moveTo(0, baseY);
				for (let x = 0; x <= width; x += 16) {
					const waveY =
						baseY +
						Math.sin(x * 0.02 + band * 0.5) * (bandHeight * 0.16) +
						Math.cos(x * 0.006 + band * 0.75) * (bandHeight * 0.12);
					context.lineTo(x, waveY);
				}
				context.lineTo(width, baseY + bandHeight * 1.35);
				context.lineTo(0, baseY + bandHeight * 1.35);
				context.closePath();
				context.fill();
			}
			context.fillStyle = "rgba(191, 112, 87, 0.78)";
			context.beginPath();
			context.ellipse(
				width * 0.7,
				height * 0.62,
				width * 0.085,
				height * 0.048,
				-0.15,
				0,
				Math.PI * 2,
			);
			context.fill();
			context.strokeStyle = "rgba(243, 214, 186, 0.45)";
			context.lineWidth = 12;
			context.beginPath();
			context.ellipse(
				width * 0.7,
				height * 0.62,
				width * 0.1,
				height * 0.062,
				-0.15,
				0,
				Math.PI * 2,
			);
			context.stroke();
			addVignette(context, width, height, 0.08);
		},
	);
}

function getSaturnTexture() {
	return getCanvasTexture(
		"planet-saturn",
		1024,
		512,
		(context, width, height) => {
			fillGradient(context, width, height, "#ead8ab", "#a98d61");
			const bands = [
				"rgba(248, 237, 207, 0.92)",
				"rgba(225, 203, 158, 0.82)",
				"rgba(195, 166, 117, 0.78)",
				"rgba(237, 219, 177, 0.82)",
			];
			const bandHeight = height / 16;
			for (let band = 0; band < 16; band += 1) {
				const y = band * bandHeight;
				context.fillStyle = bands[band % bands.length];
				context.fillRect(0, y, width, bandHeight * (0.9 + (band % 3) * 0.08));
			}
			addVignette(context, width, height, 0.08);
		},
	);
}

function getSaturnRingTexture() {
	return getCanvasTexture(
		"planet-saturn-ring",
		1024,
		1024,
		(context, width, height) => {
			context.clearRect(0, 0, width, height);
			const centerX = width / 2;
			const centerY = height / 2;
			for (let index = 0; index < 180; index += 1) {
				const t = index / 179;
				const radius = width * (0.28 + t * 0.32);
				const alpha =
					0.02 + Math.sin(t * Math.PI) * 0.14 + ((index % 7) / 7) * 0.04;
				context.strokeStyle = `rgba(244, 230, 193, ${alpha.toFixed(3)})`;
				context.lineWidth = 2 + (index % 4 === 0 ? 1.6 : 0);
				context.beginPath();
				context.arc(centerX, centerY, radius, 0, Math.PI * 2);
				context.stroke();
			}
			context.globalCompositeOperation = "destination-out";
			context.fillStyle = "rgba(0, 0, 0, 1)";
			context.beginPath();
			context.arc(centerX, centerY, width * 0.25, 0, Math.PI * 2);
			context.fill();
			context.globalCompositeOperation = "source-over";
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

function createRockyPlanetMaterial({
	key,
	color,
	map,
	roughness,
	metalness,
	normalStrength,
	clearcoat,
	emissive,
	emissiveIntensity,
}: {
	key: string;
	color: number;
	map: THREE.Texture;
	roughness: number;
	metalness: number;
	normalStrength: number;
	clearcoat: number;
	emissive?: number;
	emissiveIntensity?: number;
}) {
	return new THREE.MeshPhysicalMaterial({
		color,
		map,
		normalMap: getNormalMapFromTexture(`${key}-normal`, map, normalStrength),
		roughnessMap: getRoughnessMapFromTexture(
			`${key}-roughness`,
			map,
			(luminance) => 112 + (255 - luminance) * 0.45,
		),
		emissive,
		emissiveIntensity,
		roughness,
		metalness,
		clearcoat,
		clearcoatRoughness: 0.72,
	});
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

function getRoughnessMapFromTexture(
	key: string,
	sourceTexture: THREE.Texture,
	toRoughness: (luminance: number) => number,
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

	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	for (let index = 0; index < data.length; index += 4) {
		const luminance = getLuminance(
			data[index],
			data[index + 1],
			data[index + 2],
		);
		const roughness = THREE.MathUtils.clamp(toRoughness(luminance), 0, 255);
		data[index] = roughness;
		data[index + 1] = roughness;
		data[index + 2] = roughness;
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
		throw new Error("Texture image is not ready for derived material maps");
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
		Math.min(width, height) * 0.18,
		width * 0.5,
		height * 0.5,
		Math.max(width, height) * 0.62,
	);
	gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
	gradient.addColorStop(1, `rgba(16, 12, 10, ${strength})`);
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
