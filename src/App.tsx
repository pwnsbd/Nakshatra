import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import BirthForm from "./components/BirthForm";
import CompassRose from "./components/CompassRose";
import ControlDock from "./components/ControlDock";
import LocationCard from "./components/LocationCard";
import StatusBar from "./components/StatusBar";
import TimelineScrubber from "./components/TimelineScrubber";
import {
	createAstronomyProvider,
	type AstronomyProvider,
	type SolarSystemSnapshot,
} from "./services/astronomyService";
import { formatCoordinates, reverseGeocode } from "./services/geocodeService";
import { convertBirthInputToMoment } from "./services/timeService";
import {
	useNakshatraStore,
	type AppMode,
	type BirthInput,
	type NakshatraState,
} from "./state/nakshatraStore";
import { SolarSystemScene } from "./three/SolarSystemScene";

const REWIND_DURATION_MS = 5600;
const REDUCED_MOTION_FADE_MS = 180;
const LIVE_UPDATE_INTERVAL_MS = 30_000;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const TIMELINE_YEAR_SPAN = 10;
const REWIND_SAMPLE_COUNT = 360;
type SurfaceView = "sky" | "earth";

const ACTIVE_VIEW_STORAGE_KEY = "nakshatra-active-view";

function describeViewportMode(mode: AppMode) {
	switch (mode) {
		case "rewinding":
			return "Rewinding to birth snapshot";
		case "returning-live":
			return "Returning to live sky";
		case "birth-snapshot":
			return "Birth snapshot locked";
		case "error":
			return "Scene error";
		default:
			return "Live celestial viewport";
	}
}

function toSnapshotTimestampUtc(
	mode: AppMode,
	timelineProgress: number,
	birthInput: BirthInput | null,
	currentUtc: string,
) {
	if (mode === "birth-snapshot" && birthInput) {
		return convertBirthInputToMoment({
			date: birthInput.birthDate,
			time: birthInput.birthTime,
			latitude: birthInput.latitude,
			longitude: birthInput.longitude,
			timezone: birthInput.timezone,
		}).utcDateTime;
	}

	if (
		mode === "live" ||
		mode === "input" ||
		mode === "error" ||
		mode === "returning-live"
	) {
		return currentUtc;
	}

	const centeredProgress = timelineProgress - 50;
	const offsetDays = (centeredProgress / 100) * 365 * TIMELINE_YEAR_SPAN;
	return new Date(
		Date.parse(currentUtc) + offsetDays * DAY_IN_MS,
	).toISOString();
}

function normalizeAngleRadians(angleRadians: number) {
	const twoPi = Math.PI * 2;
	return ((angleRadians % twoPi) + twoPi) % twoPi;
}

function unwrapAngleRadians(
	referenceAngleRadians: number,
	targetAngleRadians: number,
) {
	let delta = targetAngleRadians - referenceAngleRadians;
	if (delta > Math.PI) {
		delta -= Math.PI * 2;
	} else if (delta < -Math.PI) {
		delta += Math.PI * 2;
	}

	return referenceAngleRadians + delta;
}

function interpolateCatmullRom(
	p0: number,
	p1: number,
	p2: number,
	p3: number,
	progress: number,
) {
	const t = progress;
	const t2 = t * t;
	const t3 = t2 * t;
	return (
		0.5 *
		(2 * p1 +
			(-p0 + p2) * t +
			(2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
			(-p0 + 3 * p1 - 3 * p2 + p3) * t3)
	);
}

async function createRewindInterpolationPlan(
	astronomyProvider: AstronomyProvider,
	startTimestampUtc: string,
	endTimestampUtc: string,
	sampleCount: number,
) {
	const startTime = Date.parse(startTimestampUtc);
	const endTime = Date.parse(endTimestampUtc);
	const totalSamples = Math.max(2, sampleCount + 1);
	const timestamps = Array.from({ length: totalSamples }, (_, index) => {
		const progress = index / (totalSamples - 1);
		return new Date(startTime + (endTime - startTime) * progress).toISOString();
	});
	const snapshots = await Promise.all(
		timestamps.map((timestampUtc) =>
			astronomyProvider.getSolarSystemSnapshot(timestampUtc),
		),
	);

	return {
		startSnapshot: snapshots[0],
		endSnapshot: snapshots[snapshots.length - 1],
		getSnapshotAtProgress(progress: number): SolarSystemSnapshot {
			const clampedProgress = Math.max(0, Math.min(1, progress));
			const segmentProgress = clampedProgress * (snapshots.length - 1);
			const startIndex = Math.min(
				Math.floor(segmentProgress),
				snapshots.length - 2,
			);
			const localProgress = segmentProgress - startIndex;
			const previousSnapshot = snapshots[Math.max(0, startIndex - 1)];
			const startSnapshot = snapshots[startIndex];
			const endSnapshot = snapshots[startIndex + 1];
			const nextSnapshot =
				snapshots[Math.min(snapshots.length - 1, startIndex + 2)];
			const previousPlanetsById = new Map(
				previousSnapshot.planets.map((planet) => [planet.id, planet]),
			);
			const endPlanetsById = new Map(
				endSnapshot.planets.map((planet) => [planet.id, planet]),
			);
			const nextPlanetsById = new Map(
				nextSnapshot.planets.map((planet) => [planet.id, planet]),
			);

			return {
				timestampUtc:
					localProgress >= 1
						? endSnapshot.timestampUtc
						: startSnapshot.timestampUtc,
				source: startSnapshot.source,
				planets: startSnapshot.planets.map((planet) => {
					const previousPlanet = previousPlanetsById.get(planet.id) ?? planet;
					const nextPlanet = endPlanetsById.get(planet.id) ?? planet;
					const futurePlanet = nextPlanetsById.get(planet.id) ?? nextPlanet;
					const startAngleRadians = planet.angleRadians;
					const previousAngleRadians = unwrapAngleRadians(
						startAngleRadians,
						previousPlanet.angleRadians,
					);
					const nextAngleRadians = unwrapAngleRadians(
						startAngleRadians,
						nextPlanet.angleRadians,
					);
					const futureAngleRadians = unwrapAngleRadians(
						nextAngleRadians,
						futurePlanet.angleRadians,
					);

					return {
						id: planet.id,
						x: interpolateCatmullRom(
							previousPlanet.x,
							planet.x,
							nextPlanet.x,
							futurePlanet.x,
							localProgress,
						),
						y: interpolateCatmullRom(
							previousPlanet.y,
							planet.y,
							nextPlanet.y,
							futurePlanet.y,
							localProgress,
						),
						z: interpolateCatmullRom(
							previousPlanet.z,
							planet.z,
							nextPlanet.z,
							futurePlanet.z,
							localProgress,
						),
						angleRadians: normalizeAngleRadians(
							interpolateCatmullRom(
								previousAngleRadians,
								startAngleRadians,
								nextAngleRadians,
								futureAngleRadians,
								localProgress,
							),
						),
					};
				}),
			};
		},
	};
}

type ViewportStatusTone = "loading" | "error";

type ViewportStatus = {
	message: string;
	detail?: string;
	tone: ViewportStatusTone;
	blocking?: boolean;
	retryable?: boolean;
};

function supportsWebGL() {
	const canvas = document.createElement("canvas");
	const context =
		canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
	return Boolean(window.WebGLRenderingContext && context);
}

function App() {
	const canvasHostRef = useRef<HTMLDivElement | null>(null);
	const viewportPanelRef = useRef<HTMLElement | null>(null);
	const sceneRef = useRef<SolarSystemScene | null>(null);
	const rewindTweenRef = useRef<gsap.core.Tween | null>(null);
	const rewindRunIdRef = useRef(0);
	const geocodeRequestIdRef = useRef(0);
	const mode = useNakshatraStore((state): NakshatraState["mode"] => state.mode);
	const showLabels = useNakshatraStore((state) => state.showLabels);
	const timelineProgress = useNakshatraStore((state) => state.timelineProgress);
	const birthInput = useNakshatraStore((state) => state.birthInput);
	const hasBirthInput = Boolean(birthInput);
	const resetVersion = useNakshatraStore((state) => state.resetVersion);
	const cameraResetVersion = useNakshatraStore(
		(state) => state.cameraResetVersion,
	);
	const startInputMode = useNakshatraStore((state) => state.startInputMode);
	const submitBirthInput = useNakshatraStore((state) => state.submitBirthInput);
	const updateBirthDetails = useNakshatraStore(
		(state) => state.updateBirthDetails,
	);
	const setTimelineProgress = useNakshatraStore(
		(state) => state.setTimelineProgress,
	);
	const setTransitionProgress = useNakshatraStore(
		(state) => state.setTransitionProgress,
	);
	const completeBirthSnapshot = useNakshatraStore(
		(state) => state.completeBirthSnapshot,
	);
	const isRewindPaused = useNakshatraStore((state) => state.isRewindPaused);
	const setErrorMode = useNakshatraStore((state) => state.setErrorMode);
	const reducedMotionEnabled = useNakshatraStore(
		(state) => state.reducedMotionEnabled,
	);
	const showOrbits = useNakshatraStore((state) => state.showOrbits);
	const showStars = useNakshatraStore((state) => state.showStars);
	const showPlanets = useNakshatraStore((state) => state.showPlanets);
	const setSystemPrefersReducedMotion = useNakshatraStore(
		(state) => state.setSystemPrefersReducedMotion,
	);
	const setShowLabels = useNakshatraStore((state) => state.setShowLabels);
	const [headingDegrees, setHeadingDegrees] = useState(0);
	const [isMobileLayout, setIsMobileLayout] = useState(false);
	const autoHiddenLabelsRef = useRef(false);
	const [currentUtc, setCurrentUtc] = useState(() => new Date().toISOString());
	const [viewportStatus, setViewportStatus] = useState<ViewportStatus | null>({
		message: "Preparing solar system…",
		tone: "loading",
		blocking: true,
	});
	const [hasRenderedSnapshot, setHasRenderedSnapshot] = useState(false);
	const [snapshotRetryToken, setSnapshotRetryToken] = useState(0);
	const [activeView, setActiveView] = useState<SurfaceView>(() => {
		if (typeof window === "undefined") {
			return "sky";
		}

		const savedView = window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
		return savedView === "earth" ? "earth" : "sky";
	});
	const astronomyProvider = useMemo<AstronomyProvider>(
		() => createAstronomyProvider(),
		[],
	);
	const activeTimestampUtc = toSnapshotTimestampUtc(
		mode,
		timelineProgress,
		birthInput,
		currentUtc,
	);

	useEffect(() => {
		if (!canvasHostRef.current) {
			return undefined;
		}

		let mountedScene: SolarSystemScene | null = null;
		let isCancelled = false;

		void Promise.resolve().then(() => {
			if (isCancelled) {
				return;
			}

			setViewportStatus({
				message: "Preparing solar system…",
				tone: "loading",
				blocking: true,
			});

			if (!supportsWebGL()) {
				setViewportStatus({
					message: "WebGL isn’t available on this device.",
					detail:
						"You can still enter birth details, but the 3D solar system needs a browser or device with WebGL enabled.",
					tone: "error",
					blocking: true,
					retryable: false,
				});
				setErrorMode();
				return;
			}

			try {
				mountedScene = new SolarSystemScene(canvasHostRef.current!, {
					onHeadingChange: setHeadingDegrees,
				});
				mountedScene.mount();
				sceneRef.current = mountedScene;
				setViewportStatus(null);
			} catch (error) {
				console.error("[Nakshatra] failed to mount scene", error);
				setViewportStatus({
					message: "We couldn’t start the solar system view.",
					detail:
						"Please try again in a WebGL-enabled browser. Your birth details are still safe here.",
					tone: "error",
					blocking: true,
					retryable: false,
				});
				setErrorMode();
			}
		});

		return () => {
			isCancelled = true;
			mountedScene?.destroy();
			sceneRef.current = null;
		};
	}, [setErrorMode]);

	useEffect(() => {
		const syncLiveClock = () => {
			setCurrentUtc(new Date().toISOString());
		};

		syncLiveClock();
		const intervalId = window.setInterval(
			syncLiveClock,
			LIVE_UPDATE_INTERVAL_MS,
		);
		return () => window.clearInterval(intervalId);
	}, []);

	useEffect(() => {
		window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeView);
	}, [activeView]);

	useEffect(() => {
		if (
			mode === "rewinding" ||
			mode === "returning-live" ||
			!sceneRef.current
		) {
			return undefined;
		}

		let isCancelled = false;
		setViewportStatus({
			message: "Calculating birth sky…",
			tone: "loading",
			blocking: !hasRenderedSnapshot,
		});

		const syncSnapshot = async () => {
			try {
				const timestampUtc = toSnapshotTimestampUtc(
					mode,
					timelineProgress,
					birthInput,
					currentUtc,
				);
				const snapshot =
					await astronomyProvider.getSolarSystemSnapshot(timestampUtc);

				if (!isCancelled) {
					sceneRef.current?.setSolarSystemSnapshot(snapshot);
					setHasRenderedSnapshot(true);
					setViewportStatus(null);
				}
			} catch (error) {
				console.error("[Nakshatra] failed to sync astronomy snapshot", error);
				if (!isCancelled) {
					setViewportStatus({
						message: "We couldn’t calculate the sky just now.",
						detail:
							"Try again in a moment. If you changed birth details, you can resubmit without refreshing the page.",
						tone: "error",
						blocking: !hasRenderedSnapshot,
						retryable: true,
					});
				}
			}
		};

		void syncSnapshot();
		return () => {
			isCancelled = true;
		};
	}, [
		astronomyProvider,
		birthInput,
		currentUtc,
		hasRenderedSnapshot,
		mode,
		snapshotRetryToken,
		timelineProgress,
	]);

	useEffect(() => {
		const reducedMotionQuery = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);
		const mobileQuery = window.matchMedia("(max-width: 767px)");
		const syncViewport = () => {
			setSystemPrefersReducedMotion(reducedMotionQuery.matches);
			setIsMobileLayout(mobileQuery.matches);
		};

		syncViewport();
		reducedMotionQuery.addEventListener("change", syncViewport);
		mobileQuery.addEventListener("change", syncViewport);
		return () => {
			reducedMotionQuery.removeEventListener("change", syncViewport);
			mobileQuery.removeEventListener("change", syncViewport);
		};
	}, [hasBirthInput, setSystemPrefersReducedMotion]);
	useEffect(() => {
		if (isMobileLayout && showLabels) {
			autoHiddenLabelsRef.current = true;
			setShowLabels(false);
			return;
		}

		if (!isMobileLayout && autoHiddenLabelsRef.current && !showLabels) {
			autoHiddenLabelsRef.current = false;
			setShowLabels(true);
		}
	}, [isMobileLayout, setShowLabels, showLabels]);

	useEffect(() => {
		sceneRef.current?.setLabelsVisible(showLabels);
	}, [showLabels]);

	useEffect(() => {
		sceneRef.current?.setOrbitsVisible(showOrbits);
	}, [showOrbits]);

	useEffect(() => {
		sceneRef.current?.setStarsVisible(showStars);
	}, [showStars]);

	useEffect(() => {
		sceneRef.current?.setPlanetsVisible(showPlanets);
	}, [showPlanets]);

	useEffect(() => {
		sceneRef.current?.setEarthMarkerCoordinates(
			birthInput
				? {
						latitude: birthInput.latitude,
						longitude: birthInput.longitude,
					}
				: null,
		);
	}, [birthInput]);

	useEffect(() => {
		sceneRef.current?.setFocusEarthMarker(mode === "birth-snapshot");
		sceneRef.current?.setPlanetMotionFrozen(mode === "birth-snapshot");
		sceneRef.current?.setCameraControlsEnabled(
			mode !== "rewinding" && mode !== "returning-live",
		);
	}, [mode]);

	useEffect(() => {
		sceneRef.current?.resetView();
		sceneRef.current?.setFocusEarthMarker(false);
	}, [resetVersion]);

	useEffect(() => {
		sceneRef.current?.resetView();
	}, [cameraResetVersion]);

	useEffect(() => {
		console.debug("[Nakshatra] mode", mode);
	}, [mode]);

	useEffect(() => {
		if ((mode !== "rewinding" && mode !== "returning-live") || !birthInput) {
			return undefined;
		}

		rewindRunIdRef.current += 1;
		const runId = rewindRunIdRef.current;
		let isCancelled = false;
		rewindTweenRef.current?.kill();
		sceneRef.current?.setCameraControlsEnabled(false);

		const runRewind = async () => {
			try {
				setViewportStatus({
					message:
						mode === "returning-live"
							? "Restoring live sky…"
							: "Calculating birth sky…",
					tone: "loading",
					blocking: true,
				});
				const nowUtc = new Date().toISOString();
				const birthMoment = convertBirthInputToMoment({
					date: birthInput.birthDate,
					time: birthInput.birthTime,
					latitude: birthInput.latitude,
					longitude: birthInput.longitude,
					timezone: birthInput.timezone,
				});
				const rewindInterpolationPlan = await createRewindInterpolationPlan(
					astronomyProvider,
					nowUtc,
					birthMoment.utcDateTime,
					REWIND_SAMPLE_COUNT,
				);
				const liveSnapshot = rewindInterpolationPlan.startSnapshot;
				const rewoundSnapshot = rewindInterpolationPlan.endSnapshot;

				if (isCancelled || rewindRunIdRef.current !== runId) {
					return;
				}

				const startsFromBirthSnapshot = mode === "returning-live";
				const startSnapshot = startsFromBirthSnapshot
					? rewoundSnapshot
					: liveSnapshot;
				const endSnapshot = startsFromBirthSnapshot
					? liveSnapshot
					: rewoundSnapshot;
				const getSnapshotAtProgress = (progress: number) =>
					startsFromBirthSnapshot
						? rewindInterpolationPlan.getSnapshotAtProgress(1 - progress)
						: rewindInterpolationPlan.getSnapshotAtProgress(progress);
				const completeTransition = () => {
					sceneRef.current?.setSolarSystemSnapshot(endSnapshot);
					setTransitionProgress(1);
					setTimelineProgress(startsFromBirthSnapshot ? 100 : 0);
					if (startsFromBirthSnapshot) {
						useNakshatraStore.setState((state) => ({
							mode: "live",
							currentSnapshot: null,
							birthSnapshot: null,
							transitionProgress: 0,
							isRewindPaused: false,
							timelineProgress: 24,
							selectedPlanetId: null,
							resetVersion: state.resetVersion + 1,
						}));
					} else {
						completeBirthSnapshot();
					}
					setHasRenderedSnapshot(true);
					setViewportStatus(null);
					sceneRef.current?.setCameraControlsEnabled(true);
				};

				sceneRef.current?.setSolarSystemSnapshot(startSnapshot);
				setCurrentUtc(nowUtc);
				setTransitionProgress(0);
				setTimelineProgress(startsFromBirthSnapshot ? 0 : 100);

				setViewportStatus({
					message: startsFromBirthSnapshot
						? "Returning to live sky…"
						: "Rewinding time…",
					tone: "loading",
					blocking: false,
				});

				if (reducedMotionEnabled) {
					const viewportPanel = viewportPanelRef.current;
					viewportPanel?.classList.add("viewport-fade");

					window.setTimeout(() => {
						if (isCancelled || rewindRunIdRef.current !== runId) {
							return;
						}

						completeTransition();
						window.requestAnimationFrame(() => {
							viewportPanel?.classList.remove("viewport-fade");
						});
					}, REDUCED_MOTION_FADE_MS);

					return;
				}

				const tweenState = { progress: 0 };
				const tween = gsap.to(tweenState, {
					progress: 1,
					duration: REWIND_DURATION_MS / 1000,
					ease: "power2.inOut",
					onUpdate: () => {
						if (isCancelled || rewindRunIdRef.current !== runId) {
							return;
						}

						const progress = tweenState.progress;
						setTransitionProgress(progress);
						setTimelineProgress(
							startsFromBirthSnapshot
								? Math.round(progress * 100)
								: Math.round((1 - progress) * 100),
						);
						sceneRef.current?.setSolarSystemSnapshot(
							getSnapshotAtProgress(progress),
						);
					},
					onComplete: () => {
						if (isCancelled || rewindRunIdRef.current !== runId) {
							return;
						}

						completeTransition();
					},
				});

				rewindTweenRef.current = tween;
				if (isRewindPaused) {
					tween.pause();
				}
			} catch (error) {
				console.error("[Nakshatra] failed to run rewind animation", error);
				setViewportStatus({
					message:
						mode === "returning-live"
							? "We couldn’t restore the live sky just now."
							: "We couldn’t rewind to that birth moment.",
					detail:
						"Please check the timezone and birth details, then try again. You don’t need to refresh the page.",
					tone: "error",
					blocking: !hasRenderedSnapshot,
					retryable: true,
				});
				setErrorMode();
			}
		};

		void runRewind();
		return () => {
			isCancelled = true;
			rewindTweenRef.current?.kill();
			rewindTweenRef.current = null;
		};
	}, [
		astronomyProvider,
		birthInput,
		completeBirthSnapshot,
		isRewindPaused,
		mode,
		setErrorMode,
		setTimelineProgress,
		setTransitionProgress,
		reducedMotionEnabled,
	]);

	useEffect(() => {
		const tween = rewindTweenRef.current;
		if (!tween) {
			return;
		}

		if ((mode === "rewinding" || mode === "returning-live") && isRewindPaused) {
			tween.pause();
			return;
		}

		if (mode === "rewinding" || mode === "returning-live") {
			tween.resume();
		}
	}, [isRewindPaused, mode]);

	function handleBirthSubmit(input: BirthInput) {
		setViewportStatus({
			message: "Calculating birth sky…",
			tone: "loading",
			blocking: !hasRenderedSnapshot,
		});
		setSnapshotRetryToken((value) => value + 1);
		const requestId = geocodeRequestIdRef.current + 1;
		geocodeRequestIdRef.current = requestId;

		submitBirthInput(input);
		updateBirthDetails({
			locationLabel: formatCoordinates(input.latitude, input.longitude),
		});

		setActiveView("sky");

		void reverseGeocode(input.latitude, input.longitude).then(
			(locationLabel) => {
				if (geocodeRequestIdRef.current !== requestId) {
					return;
				}

				updateBirthDetails({ locationLabel });
			},
		);
	}

	function handleOpenSkyViewFromEarth() {
		setActiveView("sky");
		if (!birthInput) {
			return;
		}

		if (mode === "rewinding" || mode === "returning-live") {
			return;
		}

		if (mode !== "birth-snapshot") {
			handleBirthSubmit(birthInput);
		}
	}

	return (
		<main
			className={`min-h-screen overflow-hidden bg-[#030712] text-slate-100 ${
				reducedMotionEnabled ? "reduced-motion" : ""
			}`}
		>
			<div
				className={`relative flex min-h-screen w-full flex-col px-2.5 py-2.5 sm:px-3.5 sm:py-3.5 lg:px-4 ${isMobileLayout && activeView === "sky" ? "main-mobile-safe-space" : ""}`}
			>
				<div className="cosmic-backdrop absolute inset-0" />
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_30%),radial-gradient(circle_at_75%_35%,_rgba(99,102,241,0.12),_transparent_24%)]" />
				<div className="pointer-events-none absolute inset-x-[8%] top-[8%] h-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.09),_transparent_68%)] blur-3xl" />

				<div className="relative flex min-h-screen flex-col gap-3.5 sm:gap-4">
					<div className="min-w-0">
						<StatusBar
							currentUtc={currentUtc}
							statusMessage={
								viewportStatus?.message ?? viewportStatus?.detail ?? null
							}
							statusTone={viewportStatus?.tone ?? "idle"}
							activeView={activeView}
							onViewChange={setActiveView}
						/>
					</div>

					<section
						className={`flex flex-1 flex-col gap-3.5 xl:gap-4 ${activeView === "sky" ? "" : "hidden"}`}
						aria-hidden={activeView !== "sky"}
					>
						<div className="panel min-w-0 p-3.5 sm:p-4">
							<BirthForm
								key={resetVersion}
								onEditingStart={startInputMode}
								onBirthSubmit={handleBirthSubmit}
							/>
						</div>

						<div className="grid flex-1 gap-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[minmax(0,1fr)_auto] xl:gap-4">
							<section
								ref={viewportPanelRef}
								className={`panel viewport-panel relative overflow-hidden bg-[radial-gradient(circle_at_50%_42%,_rgba(56,189,248,0.14),_transparent_20%),linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.58))] shadow-[0_30px_120px_rgba(2,6,23,0.45)] ${isMobileLayout ? "min-h-[72vh] flex-1" : "min-h-[60vh] lg:min-h-[66vh] xl:min-h-[0]"}`}
							>
								<div
									ref={canvasHostRef}
									className="absolute inset-0 z-0"
									aria-label="Nakshatra solar system canvas"
								/>
								{viewportStatus ? (
									<div
										className={`absolute inset-0 z-30 flex ${viewportStatus.blocking ? "items-center justify-center bg-slate-950/72" : "items-end justify-start p-5"}`}
									>
										<div
											className={`max-w-md rounded-[1.5rem] border px-5 py-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] ${viewportStatus.tone === "error" ? "border-rose-300/22 bg-[linear-gradient(180deg,rgba(127,29,29,0.4),rgba(2,6,23,0.92))] text-rose-50" : "border-sky-300/18 bg-[linear-gradient(180deg,rgba(8,47,73,0.58),rgba(2,6,23,0.9))] text-sky-50"}`}
										>
											<p className="text-[11px] uppercase tracking-[0.32em] text-white/70">
												{viewportStatus.tone === "error"
													? "Viewport message"
													: "Loading"}
											</p>
											<p className="mt-2 text-lg font-semibold">
												{viewportStatus.message}
											</p>
											{viewportStatus.detail ? (
												<p className="mt-2 text-sm leading-6 text-white/80">
													{viewportStatus.detail}
												</p>
											) : null}
											{viewportStatus.tone === "error" &&
											viewportStatus.retryable !== false ? (
												<div className="mt-4 flex flex-wrap gap-3">
													<button
														type="button"
														onClick={() => {
															if (birthInput) {
																handleBirthSubmit(birthInput);
																return;
															}
															setViewportStatus((current) =>
																current?.blocking ? current : null,
															);
															setSnapshotRetryToken((value) => value + 1);
														}}
														className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16"
													>
														Try again
													</button>
													<button
														type="button"
														onClick={() => {
															setViewportStatus(null);
															startInputMode();
														}}
														className="rounded-full border border-white/12 bg-transparent px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/8"
													>
														Edit details
													</button>
												</div>
											) : null}
										</div>
									</div>
								) : null}
								<div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.02),_rgba(2,6,23,0.5))]" />
								<div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
								<div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 text-[10px] uppercase tracking-[0.3em] text-slate-300/75 sm:p-5 sm:text-[11px] sm:tracking-[0.35em]">
									<span className="pt-2">Celestial viewport</span>
									<div className="flex items-start gap-3">
										{!isMobileLayout ? (
											<span className="pt-2">{mode}</span>
										) : null}
										<CompassRose headingDegrees={headingDegrees} />
									</div>
								</div>
								<div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.54))] px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-sky-200/80 shadow-[0_12px_32px_rgba(2,6,23,0.36)] sm:bottom-5 sm:left-5 sm:px-4 sm:text-xs sm:tracking-[0.3em]">
									{describeViewportMode(mode)}
								</div>
								<div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-[18rem] rounded-[1.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.82),rgba(2,6,23,0.62))] px-3 py-2.5 text-[10px] leading-5 text-slate-200/82 shadow-[0_12px_32px_rgba(2,6,23,0.36)] sm:bottom-5 sm:right-5 sm:px-4 sm:text-[11px]">
									<span className="block uppercase tracking-[0.26em] text-sky-200/78">
										Artistic scale
									</span>
									Planet sizes and distances are intentionally stylized for
									clarity.
								</div>
								{isMobileLayout ? (
									<div className="absolute inset-x-3 bottom-3 z-20 space-y-3 sm:hidden">
										<TimelineScrubber
											currentUtc={currentUtc}
											activeTimestampUtc={activeTimestampUtc}
										/>
										<ControlDock />
									</div>
								) : null}
							</section>

							{!isMobileLayout ? (
								<>
									<div className="control-dock-sidebar shrink-0 md:row-span-2">
										<ControlDock compact vertical />
									</div>
									<div className="md:col-start-1 md:row-start-2">
										<TimelineScrubber
											currentUtc={currentUtc}
											activeTimestampUtc={activeTimestampUtc}
										/>
									</div>
								</>
							) : null}
						</div>
					</section>

					<section
						className={`flex flex-1 items-start justify-center ${activeView === "earth" ? "" : "hidden"}`}
						aria-hidden={activeView !== "earth"}
					>
						<div className="w-full max-w-4xl rounded-[1.75rem] border border-sky-300/12 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.46))] p-5 shadow-[0_28px_80px_rgba(2,6,23,0.34)] sm:p-6">
							<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-[10px] uppercase tracking-[0.32em] text-sky-300/80">
										Earth view
									</p>
									<h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
										Saved location reference
									</h2>
									<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300/90">
										Switch here anytime from the view dropdown. If no location
										has been searched yet, this page stays empty.
									</p>
								</div>
								<button
									type="button"
									onClick={handleOpenSkyViewFromEarth}
									className="rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-50 transition hover:bg-sky-400/16"
								>
									Back to Sky View
								</button>
							</div>

							{hasBirthInput ? (
								<LocationCard onOpenSkyView={handleOpenSkyViewFromEarth} />
							) : (
								<div className="panel flex min-h-[18rem] items-center justify-center px-6 py-10 text-center">
									<div className="max-w-lg">
										<p className="text-[10px] uppercase tracking-[0.32em] text-sky-300/80">
											Earth view empty
										</p>
										<h3 className="mt-3 text-xl font-semibold text-white">
											No saved location yet
										</h3>
										<p className="mt-2 text-sm leading-6 text-slate-300/90">
											Search and submit a birth location in Sky View to see the
											Earth reference here.
										</p>
									</div>
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}

export default App;
