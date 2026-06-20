import { DateTime, IANAZone } from "luxon";

export type BirthInput = {
	date: string;
	time: string;
	latitude: number;
	longitude: number;
	timezone: string;
};

export type BirthMoment = {
	localDateTime: string;
	timezone: string;
	utcDateTime: string;
	latitude: number;
	longitude: number;
};

export function formatTimelineLabel(progress: number): string {
	const clampedProgress = Math.max(0, Math.min(100, progress));
	const totalMinutes = Math.round((clampedProgress / 100) * 24 * 60);
	const hours = Math.floor(totalMinutes / 60)
		.toString()
		.padStart(2, "0");
	const minutes = (totalMinutes % 60).toString().padStart(2, "0");
	return `${hours}:${minutes}`;
}

export function describeTimelinePhase(progress: number): string {
	const clampedProgress = Math.max(0, Math.min(100, progress));

	if (clampedProgress < 25) {
		return "Dawn ascendant";
	}
	if (clampedProgress < 50) {
		return "Solar rise";
	}
	if (clampedProgress < 75) {
		return "Golden descent";
	}
	return "Midnight transit";
}

function normalizeTimezone(timezone: string): string {
	const trimmedTimezone = timezone.trim();

	if (!trimmedTimezone) {
		throw new Error("Birth timezone is required.");
	}

	if (!IANAZone.isValidZone(trimmedTimezone)) {
		throw new Error(`Invalid IANA timezone: ${trimmedTimezone}`);
	}

	return trimmedTimezone;
}

function toUtcIso(date: string, time: string, timezone: string): string {
	const localDateTime = DateTime.fromISO(`${date}T${time}`, {
		zone: timezone,
		setZone: true,
	});

	if (!localDateTime.isValid) {
		throw new Error(
			localDateTime.invalidExplanation ?? "Invalid birth date or time.",
		);
	}

	return localDateTime.toUTC().toISO({
		suppressMilliseconds: true,
		includeOffset: true,
	}) as string;
}

export function convertBirthInputToMoment(input: BirthInput): BirthMoment {
	const timezone = normalizeTimezone(input.timezone);
	const localDateTime = `${input.date}T${input.time}`;

	return {
		localDateTime,
		timezone,
		utcDateTime: toUtcIso(input.date, input.time, timezone),
		latitude: input.latitude,
		longitude: input.longitude,
	};
}
