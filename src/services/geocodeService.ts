type ReverseGeocodeResponse = {
	address?: {
		city?: string;
		town?: string;
		village?: string;
		hamlet?: string;
		municipality?: string;
		county?: string;
		state_district?: string;
		state?: string;
		country?: string;
	};
};

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

function formatCoordinate(
	value: number,
	positiveLabel: string,
	negativeLabel: string,
) {
	const direction = value >= 0 ? positiveLabel : negativeLabel;
	return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function formatCoordinates(lat: number, lon: number) {
	return `${formatCoordinate(lat, "N", "S")}, ${formatCoordinate(lon, "E", "W")}`;
}

function buildPlaceName(address?: ReverseGeocodeResponse["address"]) {
	if (!address) {
		return null;
	}

	const locality =
		address.city ??
		address.town ??
		address.village ??
		address.hamlet ??
		address.municipality ??
		address.county ??
		address.state_district ??
		address.state;
	const country = address.country;

	if (!locality && !country) {
		return null;
	}

	if (!locality) {
		return country ?? null;
	}

	if (!country || locality === country) {
		return locality;
	}

	return `${locality}, ${country}`;
}

export async function reverseGeocode(
	lat: number,
	lon: number,
): Promise<string> {
	const fallbackLabel = formatCoordinates(lat, lon);

	try {
		const url = new URL(NOMINATIM_ENDPOINT);
		url.searchParams.set("format", "jsonv2");
		url.searchParams.set("lat", lat.toString());
		url.searchParams.set("lon", lon.toString());
		url.searchParams.set("zoom", "10");
		url.searchParams.set("addressdetails", "1");

		const response = await fetch(url.toString(), {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			return fallbackLabel;
		}

		const data = (await response.json()) as ReverseGeocodeResponse;
		return buildPlaceName(data.address) ?? fallbackLabel;
	} catch {
		return fallbackLabel;
	}
}
