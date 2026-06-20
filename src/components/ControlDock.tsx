import { useMemo, useState, type ReactNode } from "react";
import {
	useNakshatraStore,
	type NakshatraState,
} from "../state/nakshatraStore";

type DockButtonProps = {
	label: string;
	icon: ReactNode;
	active?: boolean;
	onClick: () => void;
	pressed?: boolean;
	compact?: boolean;
	tooltipLeft?: boolean;
};

type ActionButtonProps = {
	label: string;
	icon?: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	compact?: boolean;
	tooltipLeft?: boolean;
};

type ControlDockProps = {
	compact?: boolean;
	vertical?: boolean;
};

function DockButton({
	label,
	icon,
	active = false,
	onClick,
	pressed,
	compact = false,
	tooltipLeft = false,
}: DockButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			aria-pressed={pressed}
			title={compact ? label : undefined}
			className={`control-dock-icon-button control-dock-tooltip-trigger ${active ? "control-dock-icon-button-active" : ""}`}
		>
			<span className="control-dock-icon">{icon}</span>
			<span className="control-dock-label">{label}</span>
			{compact ? (
				<span
					className={`control-dock-tooltip ${tooltipLeft ? "control-dock-tooltip-left" : ""}`}
				>
					{label}
				</span>
			) : null}
		</button>
	);
}

function ActionButton({
	label,
	icon,
	onClick,
	disabled = false,
	compact = false,
	tooltipLeft = false,
}: ActionButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			title={compact ? label : undefined}
			className={`control-dock-action-button ${compact ? "control-dock-action-button-compact control-dock-tooltip-trigger" : ""}`}
		>
			{icon ? <span className="control-dock-icon">{icon}</span> : null}
			<span className={compact ? "sr-only" : ""}>{label}</span>
			{compact ? (
				<span
					className={`control-dock-tooltip ${tooltipLeft ? "control-dock-tooltip-left" : ""}`}
				>
					{label}
				</span>
			) : null}
		</button>
	);
}

function OrbitsIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<ellipse
				cx="12"
				cy="12"
				rx="8"
				ry="3.2"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<ellipse
				cx="12"
				cy="12"
				rx="4.8"
				ry="9"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.2"
				opacity="0.7"
			/>
			<circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
		</svg>
	);
}

function PlanetsIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<circle
				cx="12"
				cy="12"
				r="4.5"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M4 13.5c2.8 2 12.9 2 16-.7"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
				opacity="0.8"
			/>
			<circle cx="17.8" cy="11.1" r="1.1" fill="currentColor" />
		</svg>
	);
}

function StarsIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<path
				d="m12 4 1.2 3.4L16.6 8l-3.4 1.2L12 12.6l-1.2-3.4L7.4 8l3.4-.6Z"
				fill="currentColor"
			/>
			<path
				d="m18 13 .7 2 .3.1-2 .7-.7 2-.7-2-2-.7 2-.7Z"
				fill="currentColor"
				opacity="0.75"
			/>
			<path
				d="m7 14 .8 2.2L10 17l-2.2.8L7 20l-.8-2.2L4 17l2.2-.8Z"
				fill="currentColor"
				opacity="0.75"
			/>
		</svg>
	);
}

function LabelsIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<rect x="4.5" y="6" width="15" height="3" rx="1.5" fill="currentColor" />
			<rect
				x="4.5"
				y="10.5"
				width="10.5"
				height="3"
				rx="1.5"
				fill="currentColor"
				opacity="0.82"
			/>
			<rect
				x="4.5"
				y="15"
				width="13"
				height="3"
				rx="1.5"
				fill="currentColor"
				opacity="0.64"
			/>
		</svg>
	);
}

function SettingsIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<path
				d="M12 4.4 13.5 3l1.7 1 .2 2a7.5 7.5 0 0 1 1.6.9l1.9-.7 1.2 1.7-1.2 1.6c.2.6.3 1.2.4 1.9l1.7 1-1 2-2 .1a7.6 7.6 0 0 1-.9 1.6l.7 1.9-1.7 1.2-1.6-1.2c-.6.2-1.2.3-1.9.4l-1 1.7-2-1-.1-2a7.6 7.6 0 0 1-1.6-.9l-1.9.7L4 16.2l1.2-1.6a7 7 0 0 1-.4-1.9L3 11.6l1-2 2-.1c.2-.6.5-1.1.9-1.6l-.7-1.9L7.9 4l1.6 1.2c.6-.2 1.2-.3 1.9-.4Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinejoin="round"
			/>
			<circle
				cx="12"
				cy="12"
				r="2.7"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.4"
			/>
		</svg>
	);
}

function ResetCameraIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<path
				d="M12 5a7 7 0 1 1-6.1 3.6"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
			/>
			<path
				d="M5 4.8v4.7h4.7"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function ReturnToLiveIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.92" />
			<path
				d="M12 3.5v3.2M12 17.3v3.2M20.5 12h-3.2M6.7 12H3.5M17.8 6.2l-2.3 2.3M8.5 15.5l-2.3 2.3M17.8 17.8l-2.3-2.3M8.5 8.5 6.2 6.2"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.45"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ControlDock({ compact = false, vertical = false }: ControlDockProps) {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const tooltipLeft = compact && vertical;
	const mode = useNakshatraStore((state): NakshatraState["mode"] => state.mode);
	const birthSnapshot = useNakshatraStore((state) => state.birthSnapshot);
	const showLabels = useNakshatraStore((state) => state.showLabels);
	const showOrbits = useNakshatraStore((state) => state.showOrbits);
	const showStars = useNakshatraStore((state) => state.showStars);
	const showPlanets = useNakshatraStore((state) => state.showPlanets);
	const reducedMotionEnabled = useNakshatraStore(
		(state) => state.reducedMotionEnabled,
	);
	const systemPrefersReducedMotion = useNakshatraStore(
		(state) => state.systemPrefersReducedMotion,
	);
	const toggleLabels = useNakshatraStore((state) => state.toggleLabels);
	const toggleOrbits = useNakshatraStore((state) => state.toggleOrbits);
	const toggleStars = useNakshatraStore((state) => state.toggleStars);
	const togglePlanets = useNakshatraStore((state) => state.togglePlanets);
	const toggleReducedMotion = useNakshatraStore(
		(state) => state.toggleReducedMotion,
	);
	const returnToLive = useNakshatraStore((state) => state.returnToLive);
	const resetCamera = useNakshatraStore((state) => state.resetCamera);

	const liveDisabled = useMemo(
		() => mode === "returning-live" || (mode === "live" && !birthSnapshot),
		[mode, birthSnapshot],
	);

	return (
		<section
			className={`control-dock control-dock-shell panel ${compact ? "control-dock-compact p-2" : "p-2.5 md:p-3"} ${vertical ? "control-dock-vertical" : ""}`}
		>
			{compact ? (
				<div
					className={`flex items-center justify-start gap-2 ${vertical ? "control-dock-compact-layout flex-col" : "flex-wrap"}`}
				>
					<DockButton
						label="Orbits"
						icon={<OrbitsIcon />}
						active={showOrbits}
						pressed={showOrbits}
						onClick={toggleOrbits}
						compact
						tooltipLeft={tooltipLeft}
					/>
					<DockButton
						label="Planets"
						icon={<PlanetsIcon />}
						active={showPlanets}
						pressed={showPlanets}
						onClick={togglePlanets}
						compact
						tooltipLeft={tooltipLeft}
					/>
					<DockButton
						label="Stars"
						icon={<StarsIcon />}
						active={showStars}
						pressed={showStars}
						onClick={toggleStars}
						compact
						tooltipLeft={tooltipLeft}
					/>
					<DockButton
						label="Labels"
						icon={<LabelsIcon />}
						active={showLabels}
						pressed={showLabels}
						onClick={toggleLabels}
						compact
						tooltipLeft={tooltipLeft}
					/>
					<DockButton
						label="Settings"
						icon={<SettingsIcon />}
						active={settingsOpen}
						pressed={settingsOpen}
						onClick={() => setSettingsOpen((open) => !open)}
						compact
						tooltipLeft={tooltipLeft}
					/>
					{settingsOpen ? (
						<button
							type="button"
							onClick={toggleReducedMotion}
							role="switch"
							aria-checked={reducedMotionEnabled}
							className={`control-dock-toggle-pill ${reducedMotionEnabled ? "control-dock-toggle-pill-active" : ""}`}
						>
							Reduced motion {reducedMotionEnabled ? "On" : "Off"}
						</button>
					) : null}
					<ActionButton
						label="Reset Camera"
						icon={<ResetCameraIcon />}
						onClick={resetCamera}
						compact
						tooltipLeft={tooltipLeft}
					/>
					<ActionButton
						label="Return to Live"
						icon={<ReturnToLiveIcon />}
						onClick={returnToLive}
						disabled={liveDisabled}
						compact
						tooltipLeft={tooltipLeft}
					/>
				</div>
			) : (
				<>
					<div className="hidden items-center justify-between gap-3 sm:flex">
						<div>
							<p className="text-[10px] uppercase tracking-[0.36em] text-slate-400">
								Control dock
							</p>
							<p className="mt-1 text-xs uppercase tracking-[0.28em] text-sky-100/80">
								{mode === "birth-snapshot"
									? "Snapshot mode"
									: mode === "returning-live"
										? "Returning to live"
										: "Live mode"}
							</p>
						</div>
						<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-300">
							{mode}
						</span>
					</div>

					<div className="mt-0 grid grid-cols-4 gap-1.5 sm:mt-2.5 sm:grid-cols-5">
						<DockButton
							label="Orbits"
							icon={<OrbitsIcon />}
							active={showOrbits}
							pressed={showOrbits}
							onClick={toggleOrbits}
						/>
						<DockButton
							label="Planets"
							icon={<PlanetsIcon />}
							active={showPlanets}
							pressed={showPlanets}
							onClick={togglePlanets}
						/>
						<DockButton
							label="Stars"
							icon={<StarsIcon />}
							active={showStars}
							pressed={showStars}
							onClick={toggleStars}
						/>
						<DockButton
							label="Labels"
							icon={<LabelsIcon />}
							active={showLabels}
							pressed={showLabels}
							onClick={toggleLabels}
						/>
						<DockButton
							label="Settings"
							icon={<SettingsIcon />}
							active={settingsOpen}
							pressed={settingsOpen}
							onClick={() => setSettingsOpen((open) => !open)}
						/>
					</div>

					<div className="mt-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.28em] text-slate-400 sm:hidden">
						<span>
							{mode === "birth-snapshot"
								? "Snapshot"
								: mode === "returning-live"
									? "Returning"
									: "Live"}
						</span>
						<button
							type="button"
							onClick={() => setSettingsOpen((open) => !open)}
							className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-slate-200"
							aria-expanded={settingsOpen}
						>
							Settings
						</button>
					</div>

					{settingsOpen ? (
						<div className="control-dock-settings mt-2.5 rounded-[1.15rem] border border-white/10 bg-slate-950/72 p-2.5">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-[10px] uppercase tracking-[0.32em] text-slate-400">
										Reduced motion
									</p>
									<p className="mt-1 text-xs text-slate-300">
										{systemPrefersReducedMotion
											? "Following system preference"
											: "Gentler fades and minimal movement"}
									</p>
								</div>
								<button
									type="button"
									onClick={toggleReducedMotion}
									role="switch"
									aria-checked={reducedMotionEnabled}
									className={`control-dock-toggle-pill ${reducedMotionEnabled ? "control-dock-toggle-pill-active" : ""}`}
								>
									{reducedMotionEnabled ? "On" : "Off"}
								</button>
							</div>
						</div>
					) : null}

					<div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-2">
						<ActionButton
							label="Reset Camera"
							icon={<ResetCameraIcon />}
							onClick={resetCamera}
						/>
						<ActionButton
							label="Return to Live"
							icon={<ReturnToLiveIcon />}
							onClick={returnToLive}
							disabled={liveDisabled}
						/>
					</div>
				</>
			)}
		</section>
	);
}

export default ControlDock;
