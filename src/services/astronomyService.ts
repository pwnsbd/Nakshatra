import * as THREE from "three";
import { Body, Ecliptic, HelioVector } from "astronomy-engine";

export type PlanetId =
	| "mercury"
	| "venus"
	| "earth"
	| "mars"
	| "jupiter"
	| "saturn";

export type AstronomyPosition = {
	x: number;
	y: number;
	z: number;
};

export type PlanetPosition = {
	id: PlanetId;
	x: number;
	y: number;
	z: number;
	angleRadians: number;
};

export type SolarSystemSnapshot = {
	timestampUtc: string;
	source: "astronomy-engine" | "fake-circular-orbits";
	planets: PlanetPosition[];
};

export interface AstronomyProvider {
	getSolarSystemSnapshot(timestampUtc: string): Promise<SolarSystemSnapshot>;
}

type OrbitPathPoint = {
	x: number;
	y: number;
	z: number;
};

type OrbitalBodyConfig = {
	id: PlanetId;
	astronomyBody: Body;
	averageOrbitRadiusAu: number;
	eccentricity: number;
	longitudeOfPerihelionRadians: number;
	orbitRadius: number;
	orbitPath: ReadonlyArray<OrbitPathPoint>;
	initialAngleRadians: number;
	height?: number;
};

const MIN_HELIOCENTRIC_DISTANCE_AU = 0.28;
const MAX_HELIOCENTRIC_DISTANCE_AU = 9.537;
const SCENE_DISTANCE_MIN = 13;
const SCENE_DISTANCE_MAX = 43;
const SCENE_ORBIT_SCALE = 1.18;
const DISTANCE_CURVE_POWER = 0.72;
const VERTICAL_EXAGGERATION = 3;
const TWO_PI = Math.PI * 2;

function normalizeAngle(angleRadians: number) {
	return ((angleRadians % TWO_PI) + TWO_PI) % TWO_PI;
}

function toAstronomyDate(timestampUtc: string) {
	const parsedDate = new Date(timestampUtc);

	if (Number.isNaN(parsedDate.getTime())) {
		throw new Error(`Invalid UTC timestamp: ${timestampUtc}`);
	}

	return parsedDate;
}

export function mapAstronomyPositionToScene(position: AstronomyPosition): {
	x: number;
	y: number;
	z: number;
} {
	const planarDistanceAu = Math.hypot(position.x, position.y);
	const normalizedDistance =
		planarDistanceAu > 0
			? (Math.log(planarDistanceAu) - Math.log(MIN_HELIOCENTRIC_DISTANCE_AU)) /
				(Math.log(MAX_HELIOCENTRIC_DISTANCE_AU) -
					Math.log(MIN_HELIOCENTRIC_DISTANCE_AU))
			: 0;
	const clampedDistance = Math.min(Math.max(normalizedDistance, 0), 1);
	const curvedDistance = Math.pow(clampedDistance, DISTANCE_CURVE_POWER);
	const sceneDistance =
		SCENE_DISTANCE_MIN +
		curvedDistance * (SCENE_DISTANCE_MAX - SCENE_DISTANCE_MIN);
	const planarScale =
		planarDistanceAu > 0 ? sceneDistance / planarDistanceAu : 0;

	// This mapping is intentionally artistic, not physically to scale.
	// We compress the real heliocentric AU distances with a non-linear curve so
	// Mercury through Saturn all fit inside the default camera framing while still
	// keeping the inner planets clear of the Sun and the gas giants visibly farther out.
	return {
		x: position.x * planarScale * SCENE_ORBIT_SCALE,
		y: position.z * VERTICAL_EXAGGERATION,
		z: position.y * planarScale * SCENE_ORBIT_SCALE,
	};
}

function createOrbitPath(
	averageOrbitRadiusAu: number,
	eccentricity: number,
	longitudeOfPerihelionRadians: number,
	segments = 240,
): ReadonlyArray<OrbitPathPoint> {
	const semiLatusRectum =
		averageOrbitRadiusAu * (1 - eccentricity * eccentricity);
	const points: OrbitPathPoint[] = [];

	for (let index = 0; index < segments; index += 1) {
		const trueAnomaly = (index / segments) * TWO_PI;
		const heliocentricRadiusAu =
			semiLatusRectum / (1 + eccentricity * Math.cos(trueAnomaly));
		const longitude = trueAnomaly + longitudeOfPerihelionRadians;
		points.push(
			mapAstronomyPositionToScene({
				x: Math.cos(longitude) * heliocentricRadiusAu,
				y: Math.sin(longitude) * heliocentricRadiusAu,
				z: 0,
			}),
		);
	}

	return points;
}

function createOrbitalBodyConfig(
	id: PlanetId,
	astronomyBody: Body,
	averageOrbitRadiusAu: number,
	eccentricity: number,
	longitudeOfPerihelionDegrees: number,
	initialAngleRadians: number,
	height = 0,
): OrbitalBodyConfig {
	const longitudeOfPerihelionRadians = THREE.MathUtils.degToRad(
		longitudeOfPerihelionDegrees,
	);
	return {
		id,
		astronomyBody,
		averageOrbitRadiusAu,
		eccentricity,
		longitudeOfPerihelionRadians,
		orbitRadius: mapAstronomyPositionToScene({
			x: averageOrbitRadiusAu,
			y: 0,
			z: 0,
		}).x,
		orbitPath: createOrbitPath(
			averageOrbitRadiusAu,
			eccentricity,
			longitudeOfPerihelionRadians,
		),
		initialAngleRadians,
		height,
	};
}

export const ORBITAL_BODY_CONFIGS: ReadonlyArray<OrbitalBodyConfig> = [
	createOrbitalBodyConfig("mercury", Body.Mercury, 0.387, 0.2056, 77.457, 0.35),
	createOrbitalBodyConfig("venus", Body.Venus, 0.723, 0.0068, 131.602, 2.15),
	createOrbitalBodyConfig("earth", Body.Earth, 1, 0.0167, 102.937, 5.1),
	createOrbitalBodyConfig("mars", Body.Mars, 1.524, 0.0934, 336.041, 3.55),
	createOrbitalBodyConfig("jupiter", Body.Jupiter, 5.203, 0.0489, 14.754, 0.95),
	createOrbitalBodyConfig(
		"saturn",
		Body.Saturn,
		9.537,
		0.0565,
		92.432,
		4.25,
		0.1,
	),
] as const;

export class AstronomyEngineProvider implements AstronomyProvider {
	getSolarSystemSnapshot(timestampUtc: string): Promise<SolarSystemSnapshot> {
		const timestamp = toAstronomyDate(timestampUtc);

		return Promise.resolve({
			timestampUtc: timestamp.toISOString(),
			source: "astronomy-engine",
			planets: ORBITAL_BODY_CONFIGS.map((body) => {
				const heliocentricEquatorial = HelioVector(
					body.astronomyBody,
					timestamp,
				);
				const heliocentricEcliptic = Ecliptic(heliocentricEquatorial);
				const astronomyPosition = heliocentricEcliptic.vec;
				const angleRadians = normalizeAngle(
					Math.atan2(astronomyPosition.y, astronomyPosition.x),
				);
				const scenePosition = mapAstronomyPositionToScene(astronomyPosition);

				return {
					id: body.id,
					...scenePosition,
					angleRadians,
				};
			}),
		});
	}
}

export function createAstronomyProvider(): AstronomyProvider {
	return new AstronomyEngineProvider();
}
