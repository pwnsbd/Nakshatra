import * as THREE from "three";
import { ORBITAL_BODY_CONFIGS, type SolarSystemSnapshot } from "../services/astronomyService";

const BODY_RADII: Record<string, number> = {
	mercury: 1.05,
	venus: 1.55,
	earth: 1.65,
	mars: 1.25,
	jupiter: 2.4,
	saturn: 1.9,
};

const BODY_COLORS: Record<string, string> = {
	mercury: "#a99c8d",
	venus: "#d7c09a",
	earth: "#4b86a0",
	mars: "#b65e43",
	jupiter: "#cba880",
	saturn: "#c7b28d",
};

const TWO_PI = Math.PI * 2;

function seededRandom(seed: number) {
	let value = seed;
	return () => {
		value = (value * 16807) % 2147483647;
		return (value - 1) / 2147483646;
	};
}

function textureCanvas(bodyId: string) {
	const canvas = document.createElement("canvas");
	canvas.width = 1024;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	const rand = seededRandom(bodyId.split("").reduce((a, c) => a + c.charCodeAt(0), 1));
	const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
	const base: Record<string, [string, string, string]> = {
		mercury: ["#786f65", "#a69a8c", "#615b55"],
		venus: ["#b89d72", "#ead8af", "#d0b789"],
		earth: ["#163b58", "#286785", "#102f4b"],
		mars: ["#7f392b", "#cb7450", "#994630"],
		jupiter: ["#a97f5e", "#dbc39f", "#a86f52"],
		saturn: ["#a38961", "#dfcda6", "#927a59"],
	};
	const tones = base[bodyId] ?? ["#777", "#aaa", "#555"];
	gradient.addColorStop(0, tones[0]);
	gradient.addColorStop(0.48, tones[1]);
	gradient.addColorStop(1, tones[2]);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	if (bodyId === "earth") {
		// Loose, layered landmasses give the tiny globe a familiar blue-green read.
		const continents = [
			[[105, 115], [145, 82], [194, 90], [223, 120], [206, 157], [177, 166], [166, 212], [143, 229], [123, 187], [105, 164]],
			[[233, 245], [272, 258], [292, 300], [280, 350], [264, 405], [245, 380], [230, 326], [215, 285]],
			[[375, 112], [421, 88], [454, 106], [474, 147], [453, 177], [429, 172], [407, 210], [383, 186], [360, 150]],
			[[433, 214], [473, 200], [503, 227], [510, 270], [487, 309], [468, 361], [444, 332], [427, 279]],
			[[535, 117], [603, 89], [660, 110], [685, 142], [660, 168], [618, 159], [591, 188], [555, 165]],
			[[624, 232], [667, 215], [710, 238], [729, 281], [696, 311], [671, 353], [644, 335], [631, 285]],
			[[766, 135], [812, 122], [843, 149], [826, 177], [788, 175]],
		];
		for (let index = 0; index < continents.length; index++) {
			const poly = continents[index];
			ctx.beginPath();
			ctx.moveTo(poly[0][0], poly[0][1]);
			for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
			ctx.closePath();
			ctx.fillStyle = index % 2 ? "#778b67" : "#718765";
			ctx.fill();
			ctx.strokeStyle = "rgba(210,205,166,.25)";
			ctx.lineWidth = 3;
			ctx.stroke();
		}
		ctx.globalAlpha = 0.3;
		for (let i = 0; i < 26; i++) {
			ctx.beginPath();
			const x = rand() * 1024;
			const y = 30 + rand() * 450;
			ctx.ellipse(x, y, 22 + rand() * 66, 2 + rand() * 7, (rand() - 0.5) * 0.4, 0, TWO_PI);
			ctx.fillStyle = "#eee9d9";
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	} else if (bodyId === "jupiter" || bodyId === "saturn" || bodyId === "venus") {
		const bands = bodyId === "jupiter"
			? ["#a66e50", "#e0c8a3", "#bd8f6b", "#e7d7bb", "#9b6d54", "#d8be99", "#b27c59", "#ead9b9"]
			: bodyId === "saturn"
				? ["#b3976d", "#e0d0aa", "#9d845f", "#d6c39e", "#b69b71"]
				: ["#c5aa7f", "#e1d0a7", "#ad9066", "#d7c29a"];
		const height = canvas.height / bands.length;
		bands.forEach((color, i) => {
			ctx.fillStyle = color;
			ctx.fillRect(0, i * height, canvas.width, height + 1);
			ctx.fillStyle = "rgba(255,239,207,.12)";
			ctx.fillRect(0, i * height + height * 0.18, canvas.width, Math.max(2, height * 0.08));
		});
		if (bodyId === "jupiter") {
			ctx.fillStyle = "rgba(143,71,47,.72)";
			ctx.beginPath(); ctx.ellipse(713, 335, 58, 26, -0.1, 0, TWO_PI); ctx.fill();
			ctx.strokeStyle = "rgba(239,208,166,.44)"; ctx.lineWidth = 5; ctx.stroke();
		}
	} else {
		// Small crater rims and softened impact basins on the rocky worlds.
		const count = bodyId === "mercury" ? 74 : 38;
		for (let i = 0; i < count; i++) {
			const x = rand() * canvas.width;
			const y = rand() * canvas.height;
			const radius = bodyId === "mercury" ? 3 + rand() * 22 : 5 + rand() * 18;
			ctx.beginPath(); ctx.arc(x, y, radius, 0, TWO_PI);
			ctx.fillStyle = bodyId === "mars" ? "rgba(74,35,29,.16)" : "rgba(43,38,34,.2)"; ctx.fill();
			ctx.beginPath(); ctx.arc(x - radius * 0.08, y - radius * 0.08, radius * 0.86, Math.PI * 1.05, Math.PI * 1.95);
			ctx.strokeStyle = "rgba(244,222,189,.24)"; ctx.lineWidth = Math.max(1, radius * 0.12); ctx.stroke();
		}
	}
	return canvas;
}

function makeTexture(bodyId: string) {
	const canvas = textureCanvas(bodyId);
	if (!canvas) return null;
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}

function makeStarTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 64; canvas.height = 64;
	const context = canvas.getContext("2d");
	if (!context) return null;
	const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, "rgba(255,255,255,1)");
	gradient.addColorStop(0.12, "rgba(255,255,255,.8)");
	gradient.addColorStop(0.45, "rgba(255,255,255,.19)");
	gradient.addColorStop(1, "rgba(255,255,255,0)");
	context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

export class CelestialInstrument {
	private readonly host: HTMLDivElement;
	private readonly scene = new THREE.Scene();
	private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
	private readonly renderer: THREE.WebGLRenderer;
	private readonly group = new THREE.Group();
	private readonly bodies = new Map<string, THREE.Mesh>();
	private readonly textures: THREE.Texture[] = [];
	private readonly materials: THREE.Material[] = [];
	private resizeObserver: ResizeObserver | null = null;
	private frame = 0;
	private starTexture: THREE.CanvasTexture | null = null;
	private snapshot: SolarSystemSnapshot | null = null;
	private destroyed = false;

	constructor(host: HTMLDivElement) {
		this.host = host;
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
		this.renderer.setClearColor(0x000000, 0);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.12;
		this.camera.position.set(-5, 70, 158);
		this.camera.lookAt(0, 0, 0);
		this.group.rotation.x = -0.16;
		this.group.rotation.z = -0.12;
		this.scene.add(this.group);
		this.buildInstrument();
	}

	private buildInstrument() {
		this.scene.add(new THREE.AmbientLight(0xbfc7d4, 0.42));
		const hemisphere = new THREE.HemisphereLight(0x8295ae, 0x171713, 0.65);
		this.scene.add(hemisphere);
		const sunLight = new THREE.PointLight(0xffd39a, 620, 180, 1.55);
		sunLight.position.set(0, 0, 0);
		this.scene.add(sunLight);
		const rimLight = new THREE.DirectionalLight(0x91a9c7, 0.65);
		rimLight.position.set(-65, 40, -70);
		this.scene.add(rimLight);

		const sun = new THREE.Mesh(
			new THREE.SphereGeometry(1.4, 32, 24),
			new THREE.MeshBasicMaterial({ color: 0xffd39a }),
		);
		sun.name = "sun";
		this.group.add(sun);
		this.addGlow(16, 0.75, 0xe0a66e);
		this.addGlow(6, 0.8, 0xffd9a8);

		for (const config of ORBITAL_BODY_CONFIGS) {
			const points = config.orbitPath.map(p => new THREE.Vector3(p.x, p.y, p.z));
			const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
			const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xc3a276, transparent: true, opacity: config.id === "earth" ? 0.33 : 0.22, depthWrite: false });
			this.materials.push(orbitMaterial);
			this.group.add(new THREE.LineLoop(orbitGeometry, orbitMaterial));

			const radius = BODY_RADII[config.id] ?? 1;
			const texture = makeTexture(config.id);
			if (texture) this.textures.push(texture);
			const bodyMaterial = new THREE.MeshStandardMaterial({
				color: texture ? 0xffffff : BODY_COLORS[config.id],
				map: texture ?? undefined,
				roughness: 0.88,
				metalness: 0.02,
			});
			this.materials.push(bodyMaterial);
			const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 30), bodyMaterial);
			body.name = config.id;
			body.rotation.z = config.id === "earth" ? 0.32 : 0;
			this.bodies.set(config.id, body);
			this.group.add(body);
			if (config.id === "saturn") this.addSaturnRings(body, radius);
			if (config.id === "earth") this.addAtmosphere(body, radius);
		}
		this.addStarfield();
	}

	private addGlow(size: number, opacity: number, color: number) {
		const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
		gradient.addColorStop(0, "rgba(255,255,255,0.9)");
		gradient.addColorStop(0.14, "rgba(255,255,255,0.45)");
		gradient.addColorStop(0.44, "rgba(255,255,255,0.1)");
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
		const texture = new THREE.CanvasTexture(canvas);
		this.textures.push(texture);
		const material = new THREE.SpriteMaterial({ map: texture, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
		this.materials.push(material);
		const sprite = new THREE.Sprite(material);
		sprite.scale.set(size, size, 1);
		this.group.add(sprite);
	}

	private addSaturnRings(body: THREE.Mesh, radius: number) {
		const geometry = new THREE.RingGeometry(radius * 1.35, radius * 2.25, 96, 3);
		const position = geometry.attributes.position;
		const uv = geometry.attributes.uv;
		for (let i = 0; i < position.count; i++) {
			const x = position.getX(i); const y = position.getY(i);
			const distance = Math.sqrt(x * x + y * y);
			uv.setXY(i, distance / (radius * 2.25), (Math.atan2(y, x) + Math.PI) / TWO_PI);
		}
		const material = new THREE.MeshStandardMaterial({ color: 0xcbb58e, side: THREE.DoubleSide, transparent: true, opacity: 0.84, roughness: 0.92, metalness: 0.08, depthWrite: false });
		this.materials.push(material);
		const rings = new THREE.Mesh(geometry, material);
		rings.rotation.x = Math.PI * 0.5;
		rings.rotation.z = -0.28;
		body.add(rings);
	}

	private addAtmosphere(body: THREE.Mesh, radius: number) {
		const material = new THREE.MeshBasicMaterial({ color: 0x78a9c0, transparent: true, opacity: 0.11, side: THREE.BackSide, depthWrite: false });
		this.materials.push(material);
		body.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.09, 28, 20), material));
	}

	private addStarfield() {
		this.starTexture = makeStarTexture();
		if (this.starTexture) this.textures.push(this.starTexture);
		const rand = seededRandom(2791);
		const layers = [
			{ count: 760, radius: 220, size: 1.15, opacity: 0.8 },
			{ count: 360, radius: 290, size: 0.85, opacity: 0.65 },
			{ count: 180, radius: 370, size: 0.65, opacity: 0.5 },
		];
		for (const layer of layers) {
			const positions = new Float32Array(layer.count * 3);
			const colors = new Float32Array(layer.count * 3);
			for (let i = 0; i < layer.count; i++) {
				const theta = rand() * TWO_PI;
				const u = rand() * 2 - 1;
				const spread = Math.sqrt(1 - u * u);
				const radius = layer.radius + (rand() - 0.5) * 35;
				positions[i * 3] = radius * spread * Math.cos(theta);
				positions[i * 3 + 1] = radius * u;
				positions[i * 3 + 2] = radius * spread * Math.sin(theta);
				const tint = rand();
				const color = new THREE.Color(tint < 0.22 ? 0xaebbd0 : tint < 0.37 ? 0xd3b38c : 0xf0eadd);
				colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
			}
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
			const material = new THREE.PointsMaterial({ map: this.starTexture ?? undefined, color: 0xffffff, vertexColors: true, size: layer.size, transparent: true, opacity: layer.opacity, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, alphaTest: 0.02 });
			this.materials.push(material);
			this.scene.add(new THREE.Points(geometry, material));
		}
	}

	mount() {
		this.host.appendChild(this.renderer.domElement);
		this.renderer.domElement.className = "instrument-webgl";
		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(this.host);
		this.resize();
		const render = () => {
			if (this.destroyed) return;
			this.frame = requestAnimationFrame(render);
			this.renderer.render(this.scene, this.camera);
		};
		this.frame = requestAnimationFrame(render);
	}

	private resize() {
		const width = Math.max(1, this.host.clientWidth);
		const height = Math.max(1, this.host.clientHeight);
		this.camera.aspect = width / height;
		// Keep Saturn's outer orbit comfortably inside the narrower portrait canvas.
		const narrow = width / height < 1.15;
		this.camera.position.set(0, narrow ? 82 : 88, narrow ? 155 : 126);
		this.camera.lookAt(0, 0, 0);
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height, false);
	}

	setSnapshot(snapshot: SolarSystemSnapshot) {
		this.snapshot = snapshot;
		for (const planet of snapshot.planets) {
			const mesh = this.bodies.get(planet.id);
			if (mesh) mesh.position.set(planet.x, planet.y, planet.z);
		}
	}

	getLongitude(id: string) { return this.snapshot?.planets.find(p => p.id === id)?.angleRadians ?? null; }

	destroy() {
		this.destroyed = true;
		cancelAnimationFrame(this.frame);
		this.resizeObserver?.disconnect();
		this.scene.traverse(object => {
			if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) object.geometry.dispose();
		});
		for (const material of this.materials) material.dispose();
		for (const texture of this.textures) texture.dispose();
		this.renderer.dispose();
		if (this.host.contains(this.renderer.domElement)) this.host.removeChild(this.renderer.domElement);
	}
}


