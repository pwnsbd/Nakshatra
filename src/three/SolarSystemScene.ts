import * as THREE from "three";
import {
	CSS2DObject,
	CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
	ORBITAL_BODY_CONFIGS,
	type PlanetId,
	type SolarSystemSnapshot,
} from "../services/astronomyService";
import { createOrbitRing } from "./OrbitRing";
import { createPlanetMesh, type PlanetKind } from "./PlanetMesh";
import {
	EarthWithMarker,
	type EarthMarkerCoordinates,
} from "./EarthWithMarker";
import { Starfield } from "./Starfield";

const DEFAULT_CAMERA_AZIMUTH = 0.14;
const DEFAULT_CAMERA_POLAR = 1.18;
const HORIZONTAL_VIEWPORT_PADDING = -0.06;
const VERTICAL_VIEWPORT_PADDING = -0.035;
const FRAMING_DISTANCE_SCALE = 0.68;
const POLAR_SINGULARITY_EPSILON = 0.001;
const DRAG_AZIMUTH_SENSITIVITY = 0.012;
const DRAG_POLAR_SENSITIVITY = 0.008;
const WHEEL_ZOOM_SENSITIVITY = 0.0012;
const MIN_ZOOM_SCALE = 0.4;
const MAX_ZOOM_SCALE = 1.8;

interface PlanetNode {
	id: PlanetId;
	kind: PlanetKind;
	mesh: THREE.Group;
	label: CSS2DObject;
	spinRate: number;
	initialAngleRadians: number;
	earthWithMarker?: EarthWithMarker;
}

interface SolarSystemAssembly {
	group: THREE.Group;
	sun: THREE.Group;
	planets: PlanetNode[];
	orbitRings: THREE.Object3D[];
}

export class SolarSystemScene {
	private host: HTMLDivElement;
	private scene = new THREE.Scene();
	private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 420);
	private renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	private labelRenderer = new CSS2DRenderer();
	private frameId: number | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private starfield: Starfield | null = null;
	private solarSystemGroup: THREE.Group | null = null;
	private sun: THREE.Group | null = null;
	private planets: PlanetNode[] = [];
	private orbitRings: THREE.Object3D[] = [];
	private animationTick = 0;
	private labelsVisible = true;
	private snapshot: SolarSystemSnapshot | null = null;
	private readonly orbitTarget = new THREE.Vector3();
	private readonly framingBounds = new THREE.Box3();
	private orbitRadius = 84.08;
	private framedOrbitRadius = 84.08;
	private zoomScale = 1;
	private orbitAzimuth = DEFAULT_CAMERA_AZIMUTH;
	private orbitPolar = DEFAULT_CAMERA_POLAR;
	private isDragging = false;
	private dragPointerId: number | null = null;
	private lastPointerPosition: { x: number; y: number } | null = null;
	private cameraControlsEnabled = true;
	private onHeadingChange?: (headingDegrees: number) => void;
	private earthMarkerCoordinates: EarthMarkerCoordinates | null = null;
	private focusEarthMarker = false;
	private planetMotionFrozen = false;

	constructor(
		host: HTMLDivElement,
		options?: { onHeadingChange?: (headingDegrees: number) => void },
	) {
		this.host = host;
		this.onHeadingChange = options?.onHeadingChange;
		this.scene.fog = new THREE.Fog(0x020617, 150, 320);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(0x020617, 0);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.12;
		this.renderer.domElement.style.width = "100%";
		this.renderer.domElement.style.height = "100%";
		this.renderer.domElement.style.display = "block";

		this.labelRenderer.domElement.style.position = "absolute";
		this.labelRenderer.domElement.style.inset = "0";
		this.labelRenderer.domElement.style.pointerEvents = "none";
		this.labelRenderer.domElement.style.overflow = "hidden";
		this.host.style.touchAction = "none";
		this.host.style.cursor = "grab";
		this.setCameraToDefaultView();
	}

	mount() {
		if (!this.host.contains(this.renderer.domElement)) {
			this.host.appendChild(this.renderer.domElement);
		}
		if (!this.host.contains(this.labelRenderer.domElement)) {
			this.host.appendChild(this.labelRenderer.domElement);
		}

		this.scene.add(new THREE.AmbientLight(0xdbeafe, 0.72));
		this.scene.add(new THREE.HemisphereLight(0x9dd6ff, 0x08111f, 0.58));

		const sunLight = new THREE.PointLight(0xffd27a, 220, 320, 1.8);
		sunLight.position.set(0, 0, 0);
		this.scene.add(sunLight);

		const keyLight = new THREE.DirectionalLight(0xc084fc, 0.9);
		keyLight.position.set(34, 28, 36);
		this.scene.add(keyLight);

		const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
		fillLight.position.set(-28, 18, 40);
		this.scene.add(fillLight);

		this.starfield = new Starfield();
		const solarAssembly = createSolarSystemGroup();
		this.solarSystemGroup = solarAssembly.group;
		this.sun = solarAssembly.sun;
		this.planets = solarAssembly.planets;
		this.orbitRings = solarAssembly.orbitRings;
		this.applyPlanetPositions();
		this.scene.add(
			this.starfield.farPoints,
			this.starfield.points,
			this.solarSystemGroup,
		);
		this.resize();

		this.resizeObserver = new ResizeObserver(() => {
			this.resize();
		});
		this.resizeObserver.observe(this.host);
		this.addInteractionHandlers();
		this.animate();
	}

	public setSolarSystemSnapshot(snapshot: SolarSystemSnapshot | null) {
		this.snapshot = snapshot;
		this.applyPlanetPositions();
	}

	public setLabelsVisible(isVisible: boolean) {
		this.labelsVisible = isVisible;
		this.labelRenderer.domElement.style.display = isVisible ? "block" : "none";
	}

	public setOrbitsVisible(isVisible: boolean) {
		for (const orbitRing of this.orbitRings) {
			orbitRing.visible = isVisible;
		}
	}

	public setStarsVisible(isVisible: boolean) {
		if (this.starfield) {
			this.starfield.points.visible = isVisible;
		}
	}

	public setPlanetsVisible(isVisible: boolean) {
		if (this.sun) {
			this.sun.visible = isVisible;
		}

		for (const planet of this.planets) {
			planet.mesh.visible = isVisible;
		}
	}

	public setEarthMarkerCoordinates(coordinates: EarthMarkerCoordinates | null) {
		this.earthMarkerCoordinates = coordinates;
		this.getEarthNode()?.earthWithMarker?.setMarkerCoordinates(coordinates);
	}

	public setFocusEarthMarker(shouldFocus: boolean) {
		this.focusEarthMarker = shouldFocus;
		if (shouldFocus) {
			this.orientEarthTowardMarker();
			return;
		}

		this.getEarthNode()?.earthWithMarker?.resetOrientation();
	}

	public setPlanetMotionFrozen(isFrozen: boolean) {
		this.planetMotionFrozen = isFrozen;
		this.applyPlanetPositions();
	}

	public setCameraControlsEnabled(isEnabled: boolean) {
		this.cameraControlsEnabled = isEnabled;
		if (!isEnabled) {
			this.isDragging = false;
			this.dragPointerId = null;
			this.lastPointerPosition = null;
		}
		this.host.style.cursor = isEnabled ? "grab" : "default";
	}

	destroy() {
		if (this.frameId !== null) {
			cancelAnimationFrame(this.frameId);
			this.frameId = null;
		}

		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.removeInteractionHandlers();
		this.disposeSceneObjects();
		this.scene.clear();
		this.renderer.dispose();
		if (this.renderer.domElement.parentNode === this.host) {
			this.host.removeChild(this.renderer.domElement);
		}
		if (this.labelRenderer.domElement.parentNode === this.host) {
			this.host.removeChild(this.labelRenderer.domElement);
		}
	}

	public resetView() {
		this.setCameraToDefaultView();
	}

	private resize() {
		const width = this.host.clientWidth || 1;
		const height = this.host.clientHeight || 1;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.updateFraming();
		this.renderer.setSize(width, height, false);
		this.labelRenderer.setSize(width, height);
	}

	private animate = () => {
		this.animationTick += 0.01;

		if (this.starfield) {
			this.starfield.points.rotation.y = this.animationTick * 0.035;
			this.starfield.points.rotation.x =
				Math.sin(this.animationTick * 0.08) * 0.04;
			this.starfield.update(this.animationTick);
		}

		if (this.solarSystemGroup) {
			this.solarSystemGroup.rotation.z = this.planetMotionFrozen
				? 0
				: Math.sin(this.animationTick * 0.18) * 0.006;
		}

		if (this.sun) {
			const scale = 1 + Math.sin(this.animationTick * 1.4) * 0.015;
			this.sun.scale.setScalar(scale);
		}

		this.applyPlanetPositions();
		this.renderer.render(this.scene, this.camera);
		if (this.labelsVisible) {
			this.labelRenderer.render(this.scene, this.camera);
		}
		this.frameId = requestAnimationFrame(this.animate);
	};

	private applyPlanetPositions() {
		this.updateCameraPosition();
		const snapshotById = new Map(
			this.snapshot?.planets.map((planet) => [planet.id, planet]),
		);

		const earthNode = this.getEarthNode();
		earthNode?.earthWithMarker?.setMarkerCoordinates(
			this.earthMarkerCoordinates,
		);

		for (const planet of this.planets) {
			const position = snapshotById.get(planet.id);
			const rotationAngle =
				position?.angleRadians ?? planet.initialAngleRadians;

			if (position) {
				planet.mesh.position.set(position.x, position.y, position.z);
			} else {
				const fallbackConfig = ORBITAL_BODY_CONFIGS.find(
					(body) => body.id === planet.id,
				);
				if (!fallbackConfig) {
					continue;
				}
				planet.mesh.position.set(
					Math.cos(planet.initialAngleRadians) * fallbackConfig.orbitRadius,
					fallbackConfig.height ?? 0,
					Math.sin(planet.initialAngleRadians) * fallbackConfig.orbitRadius,
				);
			}

			const orbitalRotation = rotationAngle * (0.75 + planet.spinRate * 12);
			const axialSpinRate =
				planet.id === "earth" ? 0.18 : 0.7 + planet.spinRate * 10;
			planet.mesh.rotation.y = this.planetMotionFrozen
				? orbitalRotation
				: orbitalRotation + this.animationTick * axialSpinRate;
		}

		if (this.focusEarthMarker) {
			this.orientEarthTowardMarker();
		}
	}

	private setCameraToDefaultView() {
		this.zoomScale = 1;
		this.orbitAzimuth = DEFAULT_CAMERA_AZIMUTH;
		this.orbitPolar = DEFAULT_CAMERA_POLAR;
		this.updateFraming();
	}

	private updateFraming() {
		if (this.solarSystemGroup) {
			this.framingBounds.setFromObject(this.solarSystemGroup);
			this.framingBounds.getCenter(this.orbitTarget);
			this.framedOrbitRadius = this.getFramedCameraDistance(this.framingBounds);
			this.orbitRadius = this.framedOrbitRadius * this.zoomScale;
		}
		this.updateCameraPosition();
	}

	private getFramedCameraDistance(bounds: THREE.Box3) {
		const size = bounds.getSize(new THREE.Vector3());
		const center = bounds.getCenter(new THREE.Vector3());
		const halfWidth = Math.max(size.x / 2, 1);
		const halfHeight = Math.max(size.y / 2, 1);
		const baseDistanceFromWidth = this.getDistanceForWidth(halfWidth);
		const baseDistanceFromHeight = this.getDistanceForHeight(halfHeight);
		let requiredDistance = Math.max(
			baseDistanceFromWidth,
			baseDistanceFromHeight,
			1,
		);

		const corners = [
			new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
			new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
			new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
			new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
			new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
			new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
			new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
			new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z),
		];
		const cameraBasis = this.getCameraBasis();

		for (const corner of corners) {
			const relative = corner.sub(center);
			const horizontal = Math.abs(relative.dot(cameraBasis.right));
			const vertical = Math.abs(relative.dot(cameraBasis.up));
			const depthOffset = relative.dot(cameraBasis.back);
			requiredDistance = Math.max(
				requiredDistance,
				depthOffset + this.getDistanceForWidth(horizontal),
				depthOffset + this.getDistanceForHeight(vertical),
			);
		}

		return Math.max(requiredDistance * FRAMING_DISTANCE_SCALE, 1);
	}

	private getDistanceForWidth(halfWidth: number) {
		const halfHorizontalFov = Math.atan(
			Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) *
				this.camera.aspect,
		);
		const safeHalfViewportWidth = Math.max(
			0.1,
			1 - HORIZONTAL_VIEWPORT_PADDING * 2,
		);
		return halfWidth / (Math.tan(halfHorizontalFov) * safeHalfViewportWidth);
	}

	private getDistanceForHeight(halfHeight: number) {
		const halfVerticalFov = THREE.MathUtils.degToRad(this.camera.fov) / 2;
		const safeHalfViewportHeight = Math.max(
			0.1,
			1 - VERTICAL_VIEWPORT_PADDING * 2,
		);
		return halfHeight / (Math.tan(halfVerticalFov) * safeHalfViewportHeight);
	}

	private getCameraBasis() {
		const sinPolar = Math.sin(this.orbitPolar);
		const back = new THREE.Vector3(
			Math.sin(this.orbitAzimuth) * sinPolar,
			Math.cos(this.orbitPolar),
			Math.cos(this.orbitAzimuth) * sinPolar,
		).normalize();
		const forward = back.clone().multiplyScalar(-1);
		const right = new THREE.Vector3()
			.crossVectors(new THREE.Vector3(0, 1, 0), forward)
			.normalize();
		const up = new THREE.Vector3().crossVectors(forward, right).normalize();

		return { back, right, up };
	}

	private updateCameraPosition() {
		const sinPolar = Math.sin(this.orbitPolar);
		const x = Math.sin(this.orbitAzimuth) * this.orbitRadius * sinPolar;
		const y = Math.cos(this.orbitPolar) * this.orbitRadius;
		const z = Math.cos(this.orbitAzimuth) * this.orbitRadius * sinPolar;
		this.camera.position.set(
			x + this.orbitTarget.x,
			y + this.orbitTarget.y,
			z + this.orbitTarget.z,
		);
		this.camera.lookAt(this.orbitTarget);

		const forward = this.orbitTarget.clone().sub(this.camera.position);
		forward.y = 0;
		if (forward.lengthSq() > 0.0001) {
			forward.normalize();
			const heading = THREE.MathUtils.euclideanModulo(
				THREE.MathUtils.radToDeg(Math.atan2(forward.x, -forward.z)),
				360,
			);
			this.onHeadingChange?.(heading);
		}
	}

	private addInteractionHandlers() {
		this.host.addEventListener("pointerdown", this.handlePointerDown);
		this.host.addEventListener("wheel", this.handleWheel, { passive: false });
		window.addEventListener("pointermove", this.handlePointerMove);
		window.addEventListener("pointerup", this.handlePointerUp);
		window.addEventListener("pointercancel", this.handlePointerUp);
	}

	private removeInteractionHandlers() {
		this.host.removeEventListener("pointerdown", this.handlePointerDown);
		this.host.removeEventListener("wheel", this.handleWheel);
		window.removeEventListener("pointermove", this.handlePointerMove);
		window.removeEventListener("pointerup", this.handlePointerUp);
		window.removeEventListener("pointercancel", this.handlePointerUp);
	}

	private handlePointerDown = (event: PointerEvent) => {
		if (!this.cameraControlsEnabled) {
			return;
		}

		event.preventDefault();
		this.isDragging = true;
		this.dragPointerId = event.pointerId;
		this.lastPointerPosition = { x: event.clientX, y: event.clientY };
		this.host.style.cursor = "grabbing";
	};

	private handlePointerMove = (event: PointerEvent) => {
		if (
			!this.cameraControlsEnabled ||
			!this.isDragging ||
			this.dragPointerId !== event.pointerId
		) {
			return;
		}

		const previous = this.lastPointerPosition;
		if (!previous) {
			this.lastPointerPosition = { x: event.clientX, y: event.clientY };
			return;
		}

		const deltaX = event.clientX - previous.x;
		const deltaY = event.clientY - previous.y;
		this.lastPointerPosition = { x: event.clientX, y: event.clientY };

		this.orbitAzimuth -= deltaX * DRAG_AZIMUTH_SENSITIVITY;

		const nextPolar = this.orbitPolar + deltaY * DRAG_POLAR_SENSITIVITY;
		this.orbitPolar = THREE.MathUtils.clamp(
			nextPolar,
			POLAR_SINGULARITY_EPSILON,
			Math.PI - POLAR_SINGULARITY_EPSILON,
		);
		this.updateCameraPosition();
	};

	private handlePointerUp = (event: PointerEvent) => {
		if (this.dragPointerId !== event.pointerId) {
			return;
		}

		this.isDragging = false;
		this.dragPointerId = null;
		this.lastPointerPosition = null;
		this.host.style.cursor = "grab";
	};

	private handleWheel = (event: WheelEvent) => {
		if (!this.cameraControlsEnabled) {
			return;
		}

		event.preventDefault();
		const nextZoomScale = THREE.MathUtils.clamp(
			this.zoomScale * Math.exp(event.deltaY * WHEEL_ZOOM_SENSITIVITY),
			MIN_ZOOM_SCALE,
			MAX_ZOOM_SCALE,
		);
		if (nextZoomScale === this.zoomScale) {
			return;
		}

		this.zoomScale = nextZoomScale;
		this.orbitRadius = this.framedOrbitRadius * this.zoomScale;
		this.updateCameraPosition();
	};

	private getEarthNode() {
		return this.planets.find((planet) => planet.id === "earth");
	}

	private orientEarthTowardMarker() {
		const earthNode = this.getEarthNode();
		if (!earthNode?.earthWithMarker) {
			return;
		}

		earthNode.earthWithMarker.orientMarkerToward(this.camera.position.clone());
	}

	private disposeSceneObjects() {
		if (this.starfield) {
			this.scene.remove(this.starfield.points);
			this.scene.remove(this.starfield.farPoints);
			this.starfield.dispose();
			this.starfield = null;
		}
		this.scene.traverse((object) => {
			const mesh = object as THREE.Mesh;
			if (mesh.geometry) {
				mesh.geometry.dispose();
			}

			const material = mesh.material;
			if (Array.isArray(material)) {
				material.forEach(disposeMaterial);
			} else {
				disposeMaterial(material);
			}
		});
	}
}

function disposeMaterial(material?: THREE.Material) {
	material?.dispose();
}

function createSolarSystemGroup(): SolarSystemAssembly {
	const group = new THREE.Group();
	group.position.set(0, 4, 0);
	group.rotation.x = THREE.MathUtils.degToRad(-5);
	group.rotation.z = 0;

	const orbitalPlane = new THREE.Mesh(
		new THREE.CircleGeometry(56, 64),
		new THREE.MeshBasicMaterial({
			color: 0x0f172a,
			transparent: true,
			opacity: 0.07,
			depthWrite: false,
		}),
	);
	orbitalPlane.rotation.x = -Math.PI / 2;
	group.add(orbitalPlane);

	const sun = createPlanetMesh("sun", 5.8);
	group.add(sun);

	const orbitRings: THREE.Object3D[] = [];
	const planets: PlanetNode[] = ORBITAL_BODY_CONFIGS.map((config, index) => {
		const orbitRing = createOrbitRing(
			config.orbitPath.map(
				(point) =>
					new THREE.Vector3(point.x, config.height ?? point.y, point.z),
			),
		);
		orbitRings.push(orbitRing);
		group.add(orbitRing);

		const mesh = createPlanetMesh(config.id, getPlanetVisualRadius(config.id));
		const earthWithMarker = mesh.userData.earthWithMarker as
			| EarthWithMarker
			| undefined;
		const label = createPlanetLabel(
			config.id,
			getPlanetVisualRadius(config.id),
		);
		mesh.add(label);
		mesh.position.set(
			Math.cos(config.initialAngleRadians) * config.orbitRadius,
			config.height ?? 0,
			Math.sin(config.initialAngleRadians) * config.orbitRadius,
		);
		group.add(mesh);

		return {
			id: config.id,
			kind: config.id,
			mesh,
			label,
			spinRate: 0.008 + index * 0.0015,
			initialAngleRadians: config.initialAngleRadians,
			earthWithMarker,
		};
	});

	return { group, sun, planets, orbitRings };
}

function getPlanetVisualRadius(kind: PlanetId) {
	switch (kind) {
		case "mercury":
			return 0.85;
		case "venus":
			return 1.35;
		case "earth":
			return 1.45;
		case "mars":
			return 1.08;
		case "jupiter":
			return 3.45;
		case "saturn":
			return 2.9;
	}
}

function createPlanetLabel(kind: PlanetId, radius: number) {
	const element = document.createElement("div");
	element.className = "planet-label";
	element.textContent = kind.charAt(0).toUpperCase() + kind.slice(1);

	const label = new CSS2DObject(element);
	label.position.set(0, radius + 1.75, 0);
	label.center.set(0.5, 1);
	return label;
}
