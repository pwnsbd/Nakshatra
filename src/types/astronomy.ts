export interface TimelineState {
	progress: number;
	isPlaying: boolean;
}

export interface SceneStatus {
	status: "Idle" | "Ready" | "Animating";
	message: string;
}
