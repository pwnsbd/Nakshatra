import * as THREE from "three";
import { ORBITAL_BODY_CONFIGS, type SolarSystemSnapshot } from "../services/astronomyService";

const COLORS: Record<string, number> = { mercury: 0xc9b394, venus: 0xd5b897, earth: 0x9fac88, mars: 0xc98768, jupiter: 0xd9c4a1, saturn: 0xa7ad91 };

export class CelestialInstrument {
	private readonly host: HTMLDivElement;
	private readonly scene = new THREE.Scene();
	private readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);
	private readonly renderer: THREE.WebGLRenderer;
	private readonly group = new THREE.Group();
	private readonly bodies = new Map<string, THREE.Mesh>();
	private readonly frameMaterials: THREE.Material[] = [];
	private resizeObserver: ResizeObserver | null = null;
	private frame = 0;
 private glowTexture: THREE.CanvasTexture | null = null;
	private snapshot: SolarSystemSnapshot | null = null;
	private destroyed = false;

	constructor(host: HTMLDivElement) {
		this.host = host;
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
		this.renderer.setClearColor(0x000000, 0);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.25;
		this.camera.position.set(0, 72, 112);
		this.camera.lookAt(0, 0, 0);
		this.group.rotation.x = -0.16;
		this.group.rotation.z = -0.12;
		this.scene.add(this.group);
		this.buildInstrument();
	}

	private buildInstrument() {
		const ambient = new THREE.AmbientLight(0xf0dfbf, 1.3);
		this.scene.add(ambient);
		const sunLight = new THREE.PointLight(0xdcae73, 2.8, 100, 1.8);
		sunLight.position.set(0, 0, 0);
		this.scene.add(sunLight);
		const sun = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
		sun.name = "sun";
		this.group.add(sun);
		const glowCanvas = document.createElement("canvas");
 glowCanvas.width = glowCanvas.height = 64;
 const context = glowCanvas.getContext("2d")!;
 const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
 gradient.addColorStop(0, "rgba(255,255,255,0.8)"); gradient.addColorStop(0.2, "rgba(255,255,255,0.3)"); gradient.addColorStop(1, "rgba(255,255,255,0)");
 context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
 this.glowTexture = new THREE.CanvasTexture(glowCanvas);
 const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xd3985c, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
		sunGlow.scale.set(4.2, 4.2, 1);
		this.group.add(sunGlow);

		for (const config of ORBITAL_BODY_CONFIGS) {
			const points = config.orbitPath.map(p => new THREE.Vector3(p.x, p.y, p.z));
			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const material = new THREE.LineBasicMaterial({ color: 0xb99269, transparent: true, opacity: config.id === "earth" ? 0.3 : 0.19, depthWrite: false });
			this.frameMaterials.push(material);
			this.group.add(new THREE.LineLoop(geometry, material));
			const radius = config.id === "jupiter" || config.id === "saturn" ? 0.31 : 0.24;
			const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS[config.id], emissive: COLORS[config.id], emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.08 });
			const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), bodyMaterial);
			body.name = config.id;
			this.bodies.set(config.id, body);
			this.group.add(body);
		}
		// Sparse fixed dust flecks create a quiet depth cue without competing with the data.
		const points: THREE.Vector3[] = [];
		let seed = 2791;
		const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
		for (let i = 0; i < 130; i++) {
			const radius = 56 + rand() * 60;
			const theta = rand() * Math.PI * 2;
			const y = (rand() - 0.5) * 55;
			points.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
		}
		const dust = new THREE.BufferGeometry().setFromPoints(points);
		const dustMaterial = new THREE.PointsMaterial({ color: 0xd9c7a6, size: 0.18, transparent: true, opacity: 0.28, sizeAttenuation: true, depthWrite: false });
		this.frameMaterials.push(dustMaterial);
		this.scene.add(new THREE.Points(dust, dustMaterial));
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
		this.camera.position.x = width < 700 ? 0 : -8;
		this.camera.position.z = width < 700 ? 132 : 112;
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
		this.renderer.dispose();
 this.glowTexture?.dispose();
		this.scene.traverse(object => {
			if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
				object.geometry.dispose();
				const materials = Array.isArray(object.material) ? object.material : [object.material];
				materials.forEach(material => material.dispose());
			}
			if (object instanceof THREE.Sprite) object.material.dispose();
		});
		this.host.removeChild(this.renderer.domElement);
	}
}

