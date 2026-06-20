interface CompassRoseProps {
	headingDegrees: number;
	className?: string;
}

const CARDINALS = [
	{ label: "N", angle: 0, accent: true },
	{ label: "E", angle: 90, accent: false },
	{ label: "S", angle: 180, accent: false },
	{ label: "W", angle: 270, accent: false },
] as const;

function CompassRose({ headingDegrees, className = "" }: CompassRoseProps) {
	return (
		<div
			className={`pointer-events-none rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.64),rgba(2,6,23,0.52))] p-3 shadow-[0_20px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl ${className}`.trim()}
		>
			<div className="mb-2 flex items-center justify-between gap-3">
				<span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-200/88">
					Orientation
				</span>
				<span className="text-[10px] uppercase tracking-[0.28em] text-sky-200/72">
					True north
				</span>
			</div>

			<div className="relative grid h-28 w-28 place-items-center rounded-full border border-sky-300/22 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_rgba(2,6,23,0.12)_38%,_rgba(2,6,23,0.75)_100%)] shadow-[inset_0_0_40px_rgba(56,189,248,0.09),0_0_22px_rgba(56,189,248,0.08)]">
				<div className="absolute inset-[10px] rounded-full border border-white/10" />
				<div className="absolute inset-[18px] rounded-full border border-white/6" />
				<div className="absolute inset-[24px] rounded-full border border-sky-200/8" />
				<div
					className="absolute inset-0 transition-transform duration-150 ease-out"
					style={{ transform: `rotate(${-headingDegrees}deg)` }}
				>
					{CARDINALS.map((cardinal) => {
						const radians = (cardinal.angle - 90) * (Math.PI / 180);
						const radius = 48;
						const x = Math.cos(radians) * radius;
						const y = Math.sin(radians) * radius;

						return (
							<span
								key={cardinal.label}
								className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-semibold uppercase tracking-[0.32em] ${
									cardinal.accent
										? "text-sky-100 drop-shadow-[0_0_12px_rgba(125,211,252,0.5)]"
										: "text-slate-200/90"
								}`}
								style={{
									transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
								}}
							>
								{cardinal.label}
							</span>
						);
					})}
				</div>
				<div className="absolute top-[14px] h-9 w-[2px] rounded-full bg-gradient-to-b from-sky-100 via-sky-300/95 to-transparent shadow-[0_0_18px_rgba(125,211,252,0.55)]" />
				<div className="absolute top-[10px] h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-sky-100 drop-shadow-[0_0_12px_rgba(125,211,252,0.45)]" />
				<div className="absolute h-3 w-3 rounded-full border border-sky-200/45 bg-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.22)]" />
			</div>
		</div>
	);
}

export default CompassRose;
