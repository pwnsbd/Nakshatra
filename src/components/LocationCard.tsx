import { formatCoordinates } from "../services/geocodeService";
import { useNakshatraStore } from "../state/nakshatraStore";

function formatCoordinate(value: number, positive: string, negative: string) {
	const direction = value >= 0 ? positive : negative;
	return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

function LocationCard() {
	const birthInput = useNakshatraStore((state) => state.birthInput);
	const birthDetails = useNakshatraStore((state) => state.birthDetails);

	if (!birthInput) {
		return null;
	}

	const fallbackLabel = formatCoordinates(
		birthDetails.latitude,
		birthDetails.longitude,
	);
	const isFallbackLocation = birthDetails.locationLabel === fallbackLabel;
	const mapsUrl = `https://www.google.com/maps?q=${birthDetails.latitude},${birthDetails.longitude}`;

	return (
		<section className="panel overflow-hidden p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-[10px] uppercase tracking-[0.32em] text-sky-300/80">
						Your location on Earth
					</p>
					<h2 className="mt-2 text-lg font-semibold tracking-tight text-white md:text-[1.35rem]">
						{birthDetails.locationLabel}
					</h2>
				</div>
				<div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-emerald-200 md:text-[11px] md:tracking-[0.28em]">
					{isFallbackLocation ? "Coordinates only" : "Place resolved"}
				</div>
			</div>

			<div className="mt-4 rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.5))] p-3.5 shadow-[0_18px_48px_rgba(2,6,23,0.26)]">
				<div className="flex items-center gap-3.5">
					<div className="[perspective:220px]">
						<div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-sky-200/20 bg-[radial-gradient(circle_at_35%_28%,rgba(191,219,254,0.92),rgba(59,130,246,0.86)_34%,rgba(15,23,42,0.98)_74%)] shadow-[inset_-18px_-18px_32px_rgba(2,6,23,0.48),0_18px_40px_rgba(8,47,73,0.28)] [transform:rotateX(-18deg)]">
							<div className="absolute inset-[14%] rounded-full border border-white/12" />
							<div className="absolute inset-[7%] rounded-full border border-sky-200/12" />
							<div className="absolute left-[10%] top-[44%] h-px w-[80%] bg-white/18" />
							<div className="absolute left-[12%] top-[58%] h-px w-[76%] bg-white/12" />
							<div className="absolute left-1/2 top-[12%] h-[76%] w-px -translate-x-1/2 bg-white/18" />
							<div className="absolute inset-x-[18%] bottom-[10%] h-[24%] rounded-[999px] bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.02),rgba(2,6,23,0.36)_78%)] blur-[2px]" />
							<div className="absolute right-[24%] top-[28%] h-3.5 w-3.5 rounded-full bg-cyan-100 shadow-[0_0_0_5px_rgba(56,189,248,0.16),0_0_22px_rgba(56,189,248,0.95)]" />
							<div className="absolute right-[28%] top-[38%] h-8 w-[2px] rounded-full bg-gradient-to-b from-cyan-100 via-sky-300 to-sky-500/20 shadow-[0_0_14px_rgba(56,189,248,0.92)]" />
						</div>
					</div>

					<div className="flex-1 text-sm text-slate-300">
						<p className="text-[10px] uppercase tracking-[0.26em] text-sky-100/75">
							Saved earth reference
						</p>
						<p className="mt-1.5 text-sm font-medium text-white">
							Marker ready for map view
						</p>
						<p className="mt-2.5 leading-5 text-slate-300/90">
							This page shows the resolved location and saved coordinates.
						</p>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
					<div className="rounded-[1rem] border border-white/8 bg-white/4 p-2.5">
						<p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
							Latitude
						</p>
						<p className="mt-1.5 text-white">
							{formatCoordinate(birthDetails.latitude, "N", "S")}
						</p>
					</div>
					<div className="rounded-[1rem] border border-white/8 bg-white/4 p-2.5">
						<p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
							Longitude
						</p>
						<p className="mt-1.5 text-white">
							{formatCoordinate(birthDetails.longitude, "E", "W")}
						</p>
					</div>
				</div>

				<a
					href={mapsUrl}
					target="_blank"
					rel="noreferrer"
					className="mt-4 inline-flex w-full items-center justify-center rounded-[1rem] border border-sky-300/25 bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(59,130,246,0.14))] px-4 py-2.5 text-sm font-semibold tracking-[0.14em] text-sky-50 shadow-[0_14px_32px_rgba(14,165,233,0.14)] transition hover:border-sky-200/40 hover:bg-[linear-gradient(135deg,rgba(56,189,248,0.3),rgba(59,130,246,0.2))]"
				>
					View on Map
				</a>
			</div>
		</section>
	);
}

export default LocationCard;
