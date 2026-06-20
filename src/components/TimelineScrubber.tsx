import { useMemo } from "react";
import { useNakshatraStore, type AppMode } from "../state/nakshatraStore";

type TimelineScrubberProps = {
	currentUtc: string;
};

type YearMarker = {
	year: number;
	highlighted: boolean;
};

function formatNow(timestampUtc: string) {
	const parsedDate = new Date(timestampUtc);

	if (Number.isNaN(parsedDate.getTime())) {
		return "UTC unavailable";
	}

	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "UTC",
	}).format(parsedDate);
}

function formatBirthMoment(date: string, time: string, timezone: string) {
	if (!date || !time) {
		return "Awaiting birth data";
	}

	const formattedDate = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		timeZone: "UTC",
	}).format(new Date(`${date}T00:00:00Z`));

	return `${formattedDate} · ${time} · ${timezone}`;
}

function getTimelineMarkers(
	currentYear: number,
	birthYear: number,
): YearMarker[] {
	const currentDecade = Math.floor(currentYear / 10) * 10;
	const birthDecade = Math.floor(birthYear / 10) * 10;
	const markers: YearMarker[] = [];

	for (let year = currentDecade; year > birthDecade; year -= 10) {
		markers.push({ year, highlighted: false });
	}

	markers.push({ year: birthYear, highlighted: true });
	markers.push({ year: birthDecade - 10, highlighted: false });

	return markers;
}

function getScrubberPosition(mode: AppMode, transitionProgress: number) {
	if (mode === "rewinding") {
		return `${100 - transitionProgress * 100}%`;
	}

	if (mode === "birth-snapshot") {
		return "0%";
	}

	return "100%";
}

function TimelineScrubber({ currentUtc }: TimelineScrubberProps) {
	const mode = useNakshatraStore((state) => state.mode);
	const birthDetails = useNakshatraStore((state) => state.birthDetails);
	const transitionProgress = useNakshatraStore(
		(state) => state.transitionProgress,
	);
	const isRewindPaused = useNakshatraStore((state) => state.isRewindPaused);
	const toggleRewindPaused = useNakshatraStore(
		(state) => state.toggleRewindPaused,
	);

	const nowLabel = useMemo(() => formatNow(currentUtc), [currentUtc]);
	const birthYear =
		Number.parseInt(birthDetails.birthDate.slice(0, 4), 10) || 1992;
	const currentYear = new Date(currentUtc).getUTCFullYear() || 2026;
	const markers = useMemo(
		() => getTimelineMarkers(currentYear, birthYear),
		[birthYear, currentYear],
	);
	const scrubberLeft = getScrubberPosition(mode, transitionProgress);
	const isAtBirthSnapshot = mode === "birth-snapshot";
	const isRewinding = mode === "rewinding";

	return (
		<section className="panel timeline-shell timeline-shell-responsive px-4 py-3 md:px-[1.125rem] md:py-3.5">
			<div className="flex items-start gap-3 md:items-center md:gap-3.5">
				<button
					type="button"
					onClick={toggleRewindPaused}
					disabled={!isRewinding}
					aria-label={
						isRewinding && !isRewindPaused ? "Pause rewind" : "Resume rewind"
					}
					className={`timeline-play-button ${!isRewinding ? "timeline-play-button-disabled" : ""}`}
				>
					{isRewinding && !isRewindPaused ? (
						<span className="flex items-center gap-1">
							<span className="block h-3 w-1 rounded-full bg-current" />
							<span className="block h-3 w-1 rounded-full bg-current" />
						</span>
					) : (
						<span className="ml-0.5 block h-0 w-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-current" />
					)}
				</button>

				<div className="min-w-0 flex-1">
					<div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between md:gap-3">
						<div className="min-w-0 md:min-w-[138px]">
							<p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-slate-100">
								NOW
							</p>
							<p className="mt-1.5 text-[11px] tracking-[0.14em] text-slate-400">
								{nowLabel}
							</p>
						</div>

						<div className="timeline-markers hidden flex-1 items-center justify-center gap-6 px-4 md:flex">
							{markers.map((marker) => (
								<div
									key={marker.year}
									className="flex flex-col items-center gap-2"
								>
									<span
										className={`h-2 w-2 rounded-full ${marker.highlighted ? "bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.7)]" : "bg-slate-600/80"}`}
									/>
									<span
										className={`text-xs font-medium tracking-[0.34em] ${
											marker.highlighted
												? "text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,0.55)]"
												: "text-slate-500"
										}`}
									>
										{marker.year}
									</span>
								</div>
							))}
						</div>

						<div className="min-w-0 md:min-w-[172px] md:text-right">
							<p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-amber-300">
								BIRTH MOMENT
							</p>
							<p className="mt-1.5 text-[11px] tracking-[0.1em] text-amber-100/85 md:tracking-[0.14em]">
								{formatBirthMoment(
									birthDetails.birthDate,
									birthDetails.birthTime,
									birthDetails.timezone,
								)}
							</p>
						</div>
					</div>

					<div className="relative mt-3.5 md:mt-4">
						<div className="absolute left-0 top-1/2 h-7 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-sky-200/60 to-transparent" />
						<div className="absolute right-0 top-1/2 h-7 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-amber-200/70 to-transparent" />
						<div className="timeline-track" />
						<div className="timeline-track-glow" />
						<div
							className={`timeline-particle ${
								isRewinding && !isRewindPaused ? "timeline-particle-active" : ""
							} ${isAtBirthSnapshot ? "timeline-particle-birth" : ""}`}
							style={{ left: scrubberLeft }}
						/>
					</div>

					<div className="mt-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-500 md:hidden">
						{markers.map((marker) => (
							<span
								key={marker.year}
								className={marker.highlighted ? "text-amber-300" : undefined}
							>
								{marker.year}
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

export default TimelineScrubber;
