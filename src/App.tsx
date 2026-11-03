import { useEffect, useMemo, useRef, useState } from "react";
import BirthForm from "./components/BirthForm";
import { createAstronomyProvider, type SolarSystemSnapshot } from "./services/astronomyService";
import { convertBirthInputToMoment } from "./services/timeService";
import { useNakshatraStore, type BirthInput } from "./state/nakshatraStore";
import { CelestialInstrument } from "./three/CelestialInstrument";

const REWIND_MS = 5600;
const PLANET_NAMES: Record<string, string> = { mercury: "Mercury", venus: "Venus", earth: "Earth", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn" };

function App() {
	const hostRef = useRef<HTMLDivElement>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const rewindFrameRef = useRef(0);
	const progressRef = useRef(0);
	const sceneRef = useRef<CelestialInstrument | null>(null);
	const birthInput = useNakshatraStore((s) => s.birthInput);
	const submitBirthInput = useNakshatraStore((s) => s.submitBirthInput);
	const startInputMode = useNakshatraStore((s) => s.startInputMode);
	const [now, setNow] = useState(() => new Date());
	const [progress, setProgress] = useState(0);
	const [rewindSequence, setRewindSequence] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [webglError, setWebglError] = useState(false);
	const [renderedSnapshot, setRenderedSnapshot] = useState<SolarSystemSnapshot | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(false);
	const provider = useMemo(() => createAstronomyProvider(), []);
	const birthMoment = useMemo(() => {
		if (!birthInput) return null;
		try { return convertBirthInputToMoment({ date: birthInput.birthDate, time: birthInput.birthTime, latitude: birthInput.latitude, longitude: birthInput.longitude, timezone: birthInput.timezone }); }
		catch { return null; }
	}, [birthInput]);
	const birthMs = birthMoment ? Date.parse(birthMoment.utcDateTime) : null;
	const nowMs = now.getTime();
	const timestampMs = birthMs === null ? nowMs : nowMs + (birthMs - nowMs) * progress;
	const timestamp = new Date(timestampMs);
	const arrival = progress === 1 && Boolean(birthInput);
	progressRef.current = progress;

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (dialogOpen && !dialog.open) dialog.showModal();
		if (!dialogOpen && dialog.open) dialog.close();
	}, [dialogOpen]);

	useEffect(() => {
		const id = window.setInterval(() => {
			if (progressRef.current === 0) setNow(new Date());
		}, 30_000);
		return () => window.clearInterval(id);
	}, []);

	useEffect(() => {
		if (!hostRef.current) return;
		try {
			const scene = new CelestialInstrument(hostRef.current);
			scene.mount(); sceneRef.current = scene;
			return () => { scene.destroy(); sceneRef.current = null; };
		} catch (e) { console.error(e); setWebglError(true); }
	}, []);

	useEffect(() => {
		let cancelled = false;
		let last = 0;
		const update = async () => {
			const current = Date.now();
			if (current - last < 33) return;
			last = current;
			try {
				const snapshot: SolarSystemSnapshot = await provider.getSolarSystemSnapshot(new Date(timestampMs).toISOString());
				if (!cancelled) { sceneRef.current?.setSnapshot(snapshot); setRenderedSnapshot(snapshot); }
			} catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Could not calculate this moment."); }
		};
		void update();
		return () => { cancelled = true; };
	}, [provider, timestampMs]);

	useEffect(() => {
		if (birthMs === null) return;
		if (birthMs >= Date.now()) return;
		let frame = 0;
		const started = performance.now();
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduce) { setProgress(1); return; }
		const step = (time: number) => {
			const p = Math.min(1, (time - started) / REWIND_MS);
			setProgress(p);
			if (p < 1) {
				frame = requestAnimationFrame(step);
				rewindFrameRef.current = frame;
			} else rewindFrameRef.current = 0;
		};
		frame = requestAnimationFrame(step);
		rewindFrameRef.current = frame;
		return () => cancelAnimationFrame(rewindFrameRef.current);
	}, [birthMs, rewindSequence]);

	function handleBirthSubmit(input: BirthInput) {
		try {
			cancelAnimationFrame(rewindFrameRef.current);
			const moment = convertBirthInputToMoment({ date: input.birthDate, time: input.birthTime, latitude: input.latitude, longitude: input.longitude, timezone: input.timezone });
			setError(""); submitBirthInput(input); setProgress(0); setRewindSequence(value => value + 1); setSelected(null); setDialogOpen(false);
			if (Date.parse(moment.utcDateTime) >= Date.now()) setProgress(1);
		} catch (e) { setError(e instanceof Error ? e.message : "Check the date, time, and timezone."); }
	}

	function returnToNow() { cancelAnimationFrame(rewindFrameRef.current); rewindFrameRef.current = 0; setNow(new Date()); setProgress(0); }
	function openDialog() { startInputMode(); setDialogOpen(true); }
	const selectedLongitude = selected ? renderedSnapshot?.planets.find(p => p.id === selected)?.angleRadians ?? null : null;
	const fmt = (d: Date) => new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: birthInput?.timezone || undefined }).format(d);

	return <main className="instrument-shell">
		<div className="instrument-disk" aria-hidden="true"><div ref={hostRef} className="instrument-canvas" />{webglError && <div className="canvas-note">The orbital instrument needs WebGL. Your moment can still be calculated.</div>}</div>
		<header className="masthead"><p className="brand">N A K S H A T R A</p><h1>The sky<br /><em>remembers.</em></h1><p className="intro">A small instrument for the great motions around us.</p></header>
		<div className="instrument-meta"><span className="eyebrow">HELIOCENTRIC STUDY</span><span>{fmt(timestamp)}{arrival ? " · YOUR FIRST MOMENT" : ""}</span></div>
		<section className="planet-key" aria-label="Select a planet to inspect its heliocentric longitude">
			{Object.entries(PLANET_NAMES).map(([id, name]) => <button key={id} className={selected === id ? "planet-key-item is-selected" : "planet-key-item"} onClick={() => setSelected(selected === id ? null : id)} aria-pressed={selected === id}><span className={`pearl pearl-${id}`} />{name}</button>)}
			{selected && <p className="longitude-readout" aria-live="polite">{PLANET_NAMES[selected]} · {selectedLongitude == null ? "calculating" : `${(selectedLongitude * 180 / Math.PI).toFixed(1)}° heliocentric longitude`}</p>}
		</section>
		{birthInput && <div className="moment-actions">{arrival && <span className="arrival-note">At your first moment · {birthInput.timezone}</span>}<button className="text-action" onClick={openDialog}>Edit moment</button><button className="text-action" onClick={returnToNow} disabled={progress === 0}>Return to now</button></div>}
		<div className="time-control"><div className="time-labels"><span>Now</span><span>{birthInput ? "Your first moment" : "Find your first moment"}</span></div><input aria-label="Explore time from now to your first moment" type="range" min="0" max="1" step="0.001" value={progress} disabled={!birthInput} onChange={e => { cancelAnimationFrame(rewindFrameRef.current); rewindFrameRef.current = 0; setProgress(Number(e.target.value)); }} /><div className="time-caption">{birthInput ? fmt(timestamp) : "Enter a birth moment to begin"}</div></div>
		<footer className="page-footer"><button className="primary-action" onClick={openDialog}>{birthInput ? "Choose a moment" : "Find your first sky"}<span aria-hidden="true">↗</span></button><button className="about-trigger" onClick={() => setAboutOpen(!aboutOpen)} aria-expanded={aboutOpen}>About this instrument</button>{aboutOpen && <p className="about-copy">Six planets are placed from astronomical positions at the selected instant. Their paths and distances are artistically scaled; this is a heliocentric view, not the sky as seen from your location.</p>}</footer>
		{error && <p className="calculation-error" role="alert">{error}</p>}
		<dialog ref={dialogRef} className="birth-dialog" onCancel={e => { e.preventDefault(); setDialogOpen(false); }} aria-labelledby="dialog-title"><div className="dialog-head"><div><p className="eyebrow">PERSONAL MOMENT</p><h2 id="dialog-title">Where should we begin?</h2></div><button className="dialog-close" onClick={() => setDialogOpen(false)} aria-label="Close">×</button></div><BirthForm onEditingStart={() => undefined} onBirthSubmit={handleBirthSubmit}/>{error && <p className="calculation-error" role="alert">{error}</p>}</dialog>
	</main>;
}

export default App;

