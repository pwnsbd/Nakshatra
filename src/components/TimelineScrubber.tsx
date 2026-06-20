import { useMemo } from "react";
import { DateTime } from "luxon";
import { convertBirthInputToMoment } from "../services/timeService";
import { useNakshatraStore, type AppMode } from "../state/nakshatraStore";

type TimelineScrubberProps = {
	currentUtc: string;
	activeTimestampUtc: string;
};

const FUTURE_POSITION_PERCENT = 96;

function formatTimelineMoment(timestampUtc: string, timezone?: string) {
	const parsed = DateTime.fromISO(timestampUtc, { zone: "utc" });

	if (!parsed.isValid) {
		return "Date unavailable";
	}

	const zoned = timezone ? parsed.setZone(timezone) : parsed.toLocal();

	return zoned.toFormat("dd LLL yyyy • HH:mm");
}

function getScrubberPosition(
	mode: AppMode,
	transitionProgress: number,
	birthIsInFuture: boolean,
) {
	const birthPosition = birthIsInFuture ? FUTURE_POSITION_PERCENT : 0;
	const nowPosition = birthIsInFuture ? 0 : FUTURE_POSITION_PERCENT;

	if (mode === "rewinding") {
		return `${nowPosition + (birthPosition - nowPosition) * transitionProgress}%`;
	}

	if (mode === "returning-live") {
		return `${birthPosition + (nowPosition - birthPosition) * transitionProgress}%`;
	}

	if (mode === "birth-snapshot") {
		return `${birthPosition}%`;
	}

	return `${nowPosition}%`;
}

function TimelineScrubber({
	currentUtc,
	activeTimestampUtc,
}: TimelineScrubberProps) {
	const mode = useNakshatraStore((state) => state.mode);
	const birthDetails = useNakshatraStore((state) => state.birthDetails);
	const transitionProgress = useNakshatraStore(
		(state) => state.transitionProgress,
	);
	const isRewindPaused = useNakshatraStore((state) => state.isRewindPaused);
	const toggleRewindPaused = useNakshatraStore(
		(state) => state.toggleRewindPaused,
	);

	const birthTimestampUtc = useMemo(() => {
		try {
			return convertBirthInputToMoment({
				date: birthDetails.birthDate,
				time: birthDetails.birthTime,
				latitude: birthDetails.latitude,
				longitude: birthDetails.longitude,
				timezone: birthDetails.timezone,
			}).utcDateTime;
		} catch {
			return activeTimestampUtc;
		}
	}, [
		activeTimestampUtc,
		birthDetails.birthDate,
		birthDetails.birthTime,
		birthDetails.latitude,
		birthDetails.longitude,
		birthDetails.timezone,
	]);
	const birthIsInFuture =
		Date.parse(birthTimestampUtc) > Date.parse(currentUtc);
	const leftLabel = birthIsInFuture ? "NOW" : "BIRTH MOMENT";
	const rightLabel = birthIsInFuture ? "BIRTH MOMENT" : "NOW";
	const birthMomentLabel = formatTimelineMoment(
		birthTimestampUtc,
		birthDetails.timezone,
	);
	const nowMomentLabel = formatTimelineMoment(currentUtc);
	const leftMomentLabel = birthIsInFuture ? nowMomentLabel : birthMomentLabel;
	const rightMomentLabel = birthIsInFuture ? birthMomentLabel : nowMomentLabel;
	const scrubberLeft = getScrubberPosition(
		mode,
		transitionProgress,
		birthIsInFuture,
	);
	const isAtBirthSnapshot = mode === "birth-snapshot";
	const isTransitioning = mode === "rewinding" || mode === "returning-live";

	return (
		<section className="panel timeline-shell timeline-shell-responsive px-4 py-3 md:px-[1.125rem] md:py-3.5">
			<div className="flex items-start gap-3 md:items-center md:gap-3.5">
				<button
					type="button"
					onClick={toggleRewindPaused}
					disabled={!isTransitioning}
					aria-label={
						isTransitioning && !isRewindPaused
							? "Pause transition"
							: "Resume transition"
					}
					className={`timeline-play-button ${!isTransitioning ? "timeline-play-button-disabled" : ""}`}
				>
					{isTransitioning && !isRewindPaused ? (
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
						<div className="min-w-0 md:min-w-[172px]">
							<p
								className={`text-[11px] font-semibold uppercase tracking-[0.38em] ${birthIsInFuture ? "text-slate-100" : "text-amber-300"}`}
							>
								{leftLabel}
							</p>
							<p className="mt-1 text-xs text-slate-300/80">
								{leftMomentLabel}
							</p>
						</div>

						<div className="hidden flex-1 md:block" />

						<div className="min-w-0 md:min-w-[138px] md:text-right">
							<p
								className={`text-[11px] font-semibold uppercase tracking-[0.38em] ${birthIsInFuture ? "text-amber-300" : "text-slate-100"}`}
							>
								{rightLabel}
							</p>
							<p className="mt-1 text-xs text-slate-300/80 md:text-right">
								{rightMomentLabel}
							</p>
						</div>
					</div>

					<div className="relative mt-3.5 md:mt-4">
						<div
							className={`absolute left-0 top-1/2 h-7 w-px -translate-y-1/2 bg-gradient-to-b from-transparent ${birthIsInFuture ? "via-sky-200/60" : "via-amber-200/70"} to-transparent`}
						/>
						<div
							className={`absolute right-0 top-1/2 h-7 w-px -translate-y-1/2 bg-gradient-to-b from-transparent ${birthIsInFuture ? "via-amber-200/70" : "via-sky-200/60"} to-transparent`}
						/>
						<div className="timeline-track" />
						<div className="timeline-track-glow" />
						<div
							className={`timeline-particle ${
								isTransitioning && !isRewindPaused
									? "timeline-particle-active"
									: ""
							} ${isAtBirthSnapshot ? "timeline-particle-birth" : ""}`}
							style={{ left: scrubberLeft }}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

export default TimelineScrubber;
