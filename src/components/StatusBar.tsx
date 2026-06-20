type SurfaceView = "sky" | "earth";

type StatusBarProps = {
	currentUtc: string;
	statusMessage?: string | null;
	statusTone?: "idle" | "loading" | "error";
	activeView?: SurfaceView;
	onViewChange?: (view: SurfaceView) => void;
};

function formatUtcTimestamp(timestampUtc: string) {
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
		second: "2-digit",
		hour12: false,
		timeZone: "UTC",
	}).format(parsedDate);
}

function StatusBar({
	currentUtc,
	statusMessage = null,
	statusTone = "idle",
	activeView = "sky",
	onViewChange,
}: StatusBarProps) {
	const formattedCurrentUtc = formatUtcTimestamp(currentUtc);

	return (
		<header className="panel overflow-hidden px-3 py-2.5 sm:px-4 sm:py-3">
			{statusMessage ? (
				<div className="mb-2">
					<div
						className={`rounded-[0.9rem] border px-3 py-2 text-[13px] ${
							statusTone === "error"
								? "border-rose-300/25 bg-rose-400/10 text-rose-50"
								: "border-sky-300/20 bg-sky-400/10 text-sky-50"
						}`}
					>
						{statusMessage}
					</div>
				</div>
			) : null}
			<div className="flex flex-wrap items-center justify-between gap-2.5">
				<div className="flex items-center gap-2.5">
					<label className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300 sm:text-[11px]">
						<span className="text-slate-400">View</span>
						<select
							value={activeView}
							onChange={(event) =>
								onViewChange?.(event.target.value as SurfaceView)
							}
							className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-50 outline-none sm:text-[11px]"
						>
							<option value="sky">Sky View</option>
							<option value="earth">Earth View</option>
						</select>
					</label>
					<div className="flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-sky-400/25 bg-[radial-gradient(circle_at_30%_30%,rgba(186,230,253,0.26),rgba(56,189,248,0.12)_45%,rgba(2,6,23,0.28)_100%)] text-sm font-semibold text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.14)]">
						N
					</div>
					<div>
						<p className="ui-kicker text-[0.6rem] tracking-[0.3em] text-sky-300/80">
							Nakshatra
						</p>
						<h1 className="observatory-title text-[0.95rem] text-white">
							Celestial Birth Atlas
						</h1>
					</div>
				</div>

				<div className="rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-2.5 py-1 text-[10px] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-3 sm:text-[11px]">
					UTC • {formattedCurrentUtc}
				</div>
			</div>
		</header>
	);
}

export default StatusBar;
