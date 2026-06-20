import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultBirthDetails, type BirthDetails } from "../types/birth";

export type AppMode =
	| "live"
	| "input"
	| "rewinding"
	| "returning-live"
	| "birth-snapshot"
	| "error";

export type BirthInput = Pick<
	BirthDetails,
	"birthDate" | "birthTime" | "latitude" | "longitude" | "timezone"
>;

export type SceneSnapshot = {
	mode: AppMode;
	timelineProgress: number;
	capturedAt: string;
	birthInput: BirthInput | null;
};

export type NakshatraState = {
	mode: AppMode;
	birthInput: BirthInput | null;
	currentSnapshot: SceneSnapshot | null;
	birthSnapshot: SceneSnapshot | null;
	transitionProgress: number;
	isRewindPaused: boolean;
	systemPrefersReducedMotion: boolean;
	userReducedMotionOverride: boolean | null;
	reducedMotionEnabled: boolean;
	showLabels: boolean;
	showOrbits: boolean;
	showStars: boolean;
	showPlanets: boolean;
	selectedPlanetId: string | null;
};

type NakshatraStore = NakshatraState & {
	birthDetails: BirthDetails;
	timelineProgress: number;
	resetVersion: number;
	cameraResetVersion: number;
	startInputMode: () => void;
	submitBirthInput: (input: BirthInput) => void;
	setTransitionProgress: (progress: number) => void;
	toggleRewindPaused: () => void;
	completeBirthSnapshot: (snapshot?: SceneSnapshot | null) => void;
	returnToLive: () => void;
	setErrorMode: () => void;
	setTimelineProgress: (progress: number) => void;
	updateBirthDetails: (details: Partial<BirthDetails>) => void;
	setSystemPrefersReducedMotion: (prefersReducedMotion: boolean) => void;
	toggleReducedMotion: () => void;
	setShowLabels: (showLabels: boolean) => void;
	toggleLabels: () => void;
	toggleOrbits: () => void;
	toggleStars: () => void;
	togglePlanets: () => void;
	resetCamera: () => void;
	resetExperience: () => void;
};

const DEFAULT_TIMELINE_PROGRESS = 24;

function createSnapshot(
	mode: AppMode,
	timelineProgress: number,
	birthInput: BirthInput | null,
): SceneSnapshot {
	return {
		mode,
		timelineProgress,
		capturedAt: new Date().toISOString(),
		birthInput,
	};
}

const initialState: NakshatraState = {
	mode: "live",
	birthInput: null,
	currentSnapshot: null,
	birthSnapshot: null,
	transitionProgress: 0,
	isRewindPaused: false,
	systemPrefersReducedMotion: false,
	userReducedMotionOverride: null,
	reducedMotionEnabled: false,
	showLabels: true,
	showOrbits: true,
	showStars: true,
	showPlanets: true,
	selectedPlanetId: null,
};

export const useNakshatraStore = create<NakshatraStore>()(
	persist(
		(set) => ({
			...initialState,
			birthDetails: defaultBirthDetails,
			timelineProgress: DEFAULT_TIMELINE_PROGRESS,
			resetVersion: 0,
			cameraResetVersion: 0,
			startInputMode: () =>
				set((state) =>
					state.mode === "rewinding" || state.mode === "returning-live"
						? state
						: {
								mode: "input",
							},
				),
			submitBirthInput: (input) =>
				set((state) => ({
					birthInput: input,
					birthDetails: {
						...state.birthDetails,
						...input,
					},
					mode: "rewinding",
					currentSnapshot: createSnapshot(
						"rewinding",
						state.timelineProgress,
						input,
					),
					birthSnapshot: null,
					transitionProgress: 0,
					isRewindPaused: false,
				})),
			setTransitionProgress: (progress) =>
				set({ transitionProgress: Math.max(0, Math.min(1, progress)) }),
			toggleRewindPaused: () =>
				set((state) =>
					state.mode === "rewinding" || state.mode === "returning-live"
						? { isRewindPaused: !state.isRewindPaused }
						: state,
				),
			completeBirthSnapshot: (snapshot) =>
				set((state) => ({
					mode: "birth-snapshot",
					transitionProgress: 1,
					isRewindPaused: false,
					birthSnapshot:
						snapshot ??
						createSnapshot(
							"birth-snapshot",
							state.timelineProgress,
							state.birthInput,
						),
				})),
			returnToLive: () =>
				set((state) => {
					if (state.mode === "live" && !state.birthSnapshot) {
						return state;
					}

					return {
						mode: "returning-live",
						currentSnapshot: createSnapshot(
							"returning-live",
							state.timelineProgress,
							state.birthInput,
						),
						transitionProgress: 0,
						isRewindPaused: false,
						timelineProgress: 0,
						selectedPlanetId: null,
					};
				}),
			setErrorMode: () =>
				set({
					mode: "error",
					transitionProgress: 0,
					isRewindPaused: false,
				}),
			setTimelineProgress: (timelineProgress) =>
				set((state) => ({
					timelineProgress,
					currentSnapshot: createSnapshot(
						state.mode,
						timelineProgress,
						state.birthInput,
					),
				})),
			updateBirthDetails: (details) =>
				set((state) => ({
					birthDetails: {
						...state.birthDetails,
						...details,
					},
				})),
			setSystemPrefersReducedMotion: (prefersReducedMotion) =>
				set((state) => ({
					systemPrefersReducedMotion: prefersReducedMotion,
					reducedMotionEnabled:
						state.userReducedMotionOverride ?? prefersReducedMotion,
				})),
			toggleReducedMotion: () =>
				set((state) => {
					const nextReducedMotion = !state.reducedMotionEnabled;
					return {
						userReducedMotionOverride: nextReducedMotion,
						reducedMotionEnabled: nextReducedMotion,
					};
				}),
			setShowLabels: (showLabels) =>
				set({
					showLabels,
				}),
			toggleLabels: () =>
				set((state) => ({
					showLabels: !state.showLabels,
				})),
			toggleOrbits: () =>
				set((state) => ({
					showOrbits: !state.showOrbits,
				})),
			toggleStars: () =>
				set((state) => ({
					showStars: !state.showStars,
				})),
			togglePlanets: () =>
				set((state) => ({
					showPlanets: !state.showPlanets,
				})),
			resetCamera: () =>
				set((state) => ({
					cameraResetVersion: state.cameraResetVersion + 1,
				})),
			resetExperience: () =>
				set((state) => ({
					...initialState,
					systemPrefersReducedMotion: state.systemPrefersReducedMotion,
					userReducedMotionOverride: state.userReducedMotionOverride,
					reducedMotionEnabled: state.reducedMotionEnabled,
					birthDetails: defaultBirthDetails,
					timelineProgress: DEFAULT_TIMELINE_PROGRESS,
					resetVersion: state.resetVersion + 1,
					cameraResetVersion: state.cameraResetVersion + 1,
				})),
		}),
		{
			name: "nakshatra-browser-memory",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				birthInput: state.birthInput,
				birthDetails: state.birthDetails,
				systemPrefersReducedMotion: state.systemPrefersReducedMotion,
				userReducedMotionOverride: state.userReducedMotionOverride,
				reducedMotionEnabled: state.reducedMotionEnabled,
				showLabels: state.showLabels,
				showOrbits: state.showOrbits,
				showStars: state.showStars,
				showPlanets: state.showPlanets,
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) {
					return;
				}

				state.mode = state.birthInput ? "input" : "live";
				state.currentSnapshot = null;
				state.birthSnapshot = null;
				state.transitionProgress = 0;
				state.isRewindPaused = false;
				state.timelineProgress = DEFAULT_TIMELINE_PROGRESS;
				state.selectedPlanetId = null;
			},
		},
	),
);
