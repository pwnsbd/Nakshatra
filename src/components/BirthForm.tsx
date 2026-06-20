import { useState, type ComponentProps } from "react";
import { IANAZone } from "luxon";
import { useNakshatraStore, type BirthInput } from "../state/nakshatraStore";
import type { BirthDetails } from "../types/birth";

type BirthFormValues = {
	birthDate: string;
	birthTime: string;
	latitude: string;
	longitude: string;
	timezone: string;
};

type BirthFormErrors = Partial<Record<keyof BirthFormValues, string>>;
type BirthFormSubmitEvent = Parameters<
	NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type LocationPreset = {
	label: string;
	latitude: string;
	longitude: string;
	timezone: string;
};

const LOCATION_PRESETS: LocationPreset[] = [
	{
		label: "Kathmandu, Nepal",
		latitude: "27.7172",
		longitude: "85.3240",
		timezone: "Asia/Kathmandu",
	},
	{
		label: "Bengaluru, India",
		latitude: "12.9716",
		longitude: "77.5946",
		timezone: "Asia/Kolkata",
	},
	{
		label: "New York, USA",
		latitude: "40.7128",
		longitude: "-74.0060",
		timezone: "America/New_York",
	},
	{
		label: "London, UK",
		latitude: "51.5074",
		longitude: "-0.1278",
		timezone: "Europe/London",
	},
	{
		label: "Damak, Nepal",
		latitude: "26.660914994947753",
		longitude: "87.69750205564499",
		timezone: "Asia/Kathmandu",
	},
];

interface BirthFormProps {
	onEditingStart?: () => void;
	onBirthSubmit: (input: BirthInput) => void;
}

function toFormValues(birthDetails: BirthDetails): BirthFormValues {
	return {
		birthDate: birthDetails.birthDate,
		birthTime: birthDetails.birthTime,
		latitude: birthDetails.latitude.toString(),
		longitude: birthDetails.longitude.toString(),
		timezone: birthDetails.timezone,
	};
}

function parseCoordinate(value: string) {
	if (!value.trim()) {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validate(values: BirthFormValues): BirthFormErrors {
	const errors: BirthFormErrors = {};
	const latitude = parseCoordinate(values.latitude);
	const longitude = parseCoordinate(values.longitude);

	if (!values.birthDate) {
		errors.birthDate = "Select the birth date to anchor the rewind.";
	}

	if (!values.birthTime) {
		errors.birthTime = "Add the birth time for a precise sky snapshot.";
	}

	if (latitude === null) {
		errors.latitude = "Enter a latitude between -90 and 90.";
	} else if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
		errors.latitude = "Latitude must stay between -90 and 90 degrees.";
	}

	if (longitude === null) {
		errors.longitude = "Enter a longitude between -180 and 180.";
	} else if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
		errors.longitude = "Longitude must stay between -180 and 180 degrees.";
	}

	const timezone = values.timezone.trim();
	if (!timezone) {
		errors.timezone = "Timezone is required for the final sky alignment.";
	} else if (!IANAZone.isValidZone(timezone)) {
		errors.timezone =
			"Use a real timezone such as Asia/Kolkata or America/New_York.";
	}

	return errors;
}

function isValidCoordinatePair(lat: number | null, lon: number | null) {
	return !(
		lat === null ||
		lon === null ||
		Number.isNaN(lat) ||
		Number.isNaN(lon) ||
		lat < -90 ||
		lat > 90 ||
		lon < -180 ||
		lon > 180
	);
}

function fallbackTimezone(lat: number, lon: number) {
	if (lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98) {
		return "Asia/Kolkata";
	}

	const roundedOffset = Math.round(lon / 15);
	if (roundedOffset === 0) {
		return "Etc/GMT";
	}

	return roundedOffset > 0
		? `Etc/GMT-${roundedOffset}`
		: `Etc/GMT+${Math.abs(roundedOffset)}`;
}

function inferTimezone(latitude: string, longitude: string) {
	const lat = parseCoordinate(latitude);
	const lon = parseCoordinate(longitude);

	if (!isValidCoordinatePair(lat, lon)) {
		return null;
	}

	const safeLat = lat as number;
	const safeLon = lon as number;
	return fallbackTimezone(safeLat, safeLon);
}

export default function BirthForm({
	onEditingStart,
	onBirthSubmit,
}: BirthFormProps) {
	const birthDetails = useNakshatraStore((state) => state.birthDetails);
	const [values, setValues] = useState<BirthFormValues>(() =>
		toFormValues(birthDetails),
	);
	const [errors, setErrors] = useState<BirthFormErrors>({});
	const [timezoneHint, setTimezoneHint] = useState("Auto from lat/lon");

	function updateField<K extends keyof BirthFormValues>(
		field: K,
		value: BirthFormValues[K],
	) {
		onEditingStart?.();
		setValues((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
	}

	function handleCoordinateBlur() {
		const nextTimezone = inferTimezone(values.latitude, values.longitude);
		const nextErrors = validate(values);
		setErrors(nextErrors);

		if (!nextErrors.latitude && !nextErrors.longitude && nextTimezone) {
			setValues((current) => ({ ...current, timezone: nextTimezone }));
			setErrors((current) => ({ ...current, timezone: undefined }));
			setTimezoneHint("Timezone synced from latitude and longitude");
			return;
		}

		if (!nextErrors.latitude && !nextErrors.longitude) {
			setErrors((current) => ({
				...current,
				timezone:
					"We couldn't infer the timezone from those coordinates yet. Please enter it manually.",
			}));
			setTimezoneHint("Timezone inference needs a manual assist");
		}
	}

	function applyPreset(label: string) {
		if (!label) {
			return;
		}

		const preset = LOCATION_PRESETS.find((item) => item.label === label);
		if (!preset) {
			return;
		}

		onEditingStart?.();
		setValues((current) => ({
			...current,
			latitude: preset.latitude,
			longitude: preset.longitude,
			timezone: preset.timezone,
		}));
		setErrors((current) => ({
			...current,
			latitude: undefined,
			longitude: undefined,
			timezone: undefined,
		}));
		setTimezoneHint(`Preset: ${preset.label}`);
	}

	function handleSubmit(event: BirthFormSubmitEvent) {
		event.preventDefault();
		const nextErrors = validate(values);
		setErrors(nextErrors);

		if (Object.keys(nextErrors).length > 0) {
			setTimezoneHint("Resolve the highlighted fields to continue");
			return;
		}

		onBirthSubmit({
			birthDate: values.birthDate,
			birthTime: values.birthTime,
			latitude: Number(values.latitude),
			longitude: Number(values.longitude),
			timezone: values.timezone.trim(),
		});
		setTimezoneHint("Birth profile saved and ready for the sky view");
	}

	return (
		<section className="space-y-2.5">
			<p className="ui-kicker text-sky-300/80">Birth Profile</p>

			<form className="space-y-2.5" onSubmit={handleSubmit} noValidate>
				<div className="grid gap-1.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 xl:items-start">
					<label className="min-w-0 space-y-1">
						<span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
							Preset
						</span>
						<select
							defaultValue=""
							onChange={(event) => {
								applyPreset(event.target.value);
								event.currentTarget.value = "";
							}}
							className="birth-input themed-select themed-select-input min-w-0 px-2.5 py-2 pr-10 text-[13px]"
						>
							<option value="">Choose city</option>
							{LOCATION_PRESETS.map((preset) => (
								<option key={preset.label} value={preset.label}>
									{preset.label}
								</option>
							))}
						</select>
						<p className="birth-help">Quick fill location + TZ</p>
					</label>
					<label className="min-w-0 space-y-1">
						<span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
							Date
						</span>
						<input
							type="date"
							value={values.birthDate}
							onChange={(event) => updateField("birthDate", event.target.value)}
							className={`birth-input min-w-0 px-2.5 py-2 text-[13px] ${errors.birthDate ? "birth-input-error" : ""}`}
						/>
						{errors.birthDate ? (
							<p className="birth-error">{errors.birthDate}</p>
						) : null}
					</label>
					<label className="min-w-0 space-y-1">
						<span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
							Time
						</span>
						<input
							type="time"
							value={values.birthTime}
							onChange={(event) => updateField("birthTime", event.target.value)}
							className={`birth-input min-w-0 px-2.5 py-2 text-[13px] ${errors.birthTime ? "birth-input-error" : ""}`}
						/>
						{errors.birthTime ? (
							<p className="birth-error">{errors.birthTime}</p>
						) : null}
					</label>
					<label className="min-w-0 space-y-1">
						<span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
							Lat
						</span>
						<input
							type="number"
							inputMode="decimal"
							step="0.0001"
							placeholder="12.9716"
							value={values.latitude}
							onChange={(event) => updateField("latitude", event.target.value)}
							onBlur={handleCoordinateBlur}
							className={`birth-input min-w-0 px-2.5 py-2 text-[13px] ${errors.latitude ? "birth-input-error" : ""}`}
						/>
						{errors.latitude ? (
							<p className="birth-error">{errors.latitude}</p>
						) : (
							<p className="birth-help">Decimal, north +</p>
						)}
					</label>
					<label className="min-w-0 space-y-1">
						<span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
							Lon
						</span>
						<input
							type="number"
							inputMode="decimal"
							step="0.0001"
							placeholder="77.5946"
							value={values.longitude}
							onChange={(event) => updateField("longitude", event.target.value)}
							onBlur={handleCoordinateBlur}
							className={`birth-input min-w-0 px-2.5 py-2 text-[13px] ${errors.longitude ? "birth-input-error" : ""}`}
						/>
						{errors.longitude ? (
							<p className="birth-error">{errors.longitude}</p>
						) : (
							<p className="birth-help">Decimal, east +</p>
						)}
					</label>
					<label className="min-w-0 space-y-1">
						<div className="flex items-center justify-between gap-1">
							<span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
								TZ
							</span>
							<span className="max-w-[5.5rem] truncate rounded-full border border-sky-300/15 bg-sky-400/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em] text-sky-100/80 xl:max-w-[4.75rem]">
								{timezoneHint}
							</span>
						</div>
						<input
							type="text"
							placeholder="Asia/Kolkata"
							value={values.timezone}
							onChange={(event) => updateField("timezone", event.target.value)}
							className={`birth-input min-w-0 px-2.5 py-2 text-[13px] ${errors.timezone ? "birth-input-error" : ""}`}
						/>
						{errors.timezone ? (
							<p className="birth-error">{errors.timezone}</p>
						) : (
							<p className="birth-help">Auto-filled, editable.</p>
						)}
					</label>
					<div className="min-w-0 space-y-1">
						<span
							aria-hidden="true"
							className="block text-[10px] uppercase tracking-[0.26em] opacity-0"
						>
							Action
						</span>
						<button
							type="submit"
							className="birth-input birth-submit-button flex min-h-[40px] w-full items-center justify-center rounded-[1rem] px-2 py-1.5 text-[13px] font-semibold tracking-[0.08em] text-amber-50 transition"
						>
							Show Birth Sky
						</button>
						<p aria-hidden="true" className="birth-help opacity-0">
							Submit birth profile
						</p>
					</div>
				</div>
			</form>
		</section>
	);
}
