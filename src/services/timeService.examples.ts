import { convertBirthInputToMoment } from "./timeService";

const kolkataMoment = convertBirthInputToMoment({
	date: "1990-08-15",
	time: "06:30",
	latitude: 26.9124,
	longitude: 75.7873,
	timezone: "Asia/Kolkata",
});

const londonMoment = convertBirthInputToMoment({
	date: "1990-08-15",
	time: "06:30",
	latitude: 51.5072,
	longitude: -0.1276,
	timezone: "Europe/London",
});

const kolkataMomentRepeat = convertBirthInputToMoment({
	date: "1990-08-15",
	time: "06:30",
	latitude: 26.9124,
	longitude: 75.7873,
	timezone: "Asia/Kolkata",
});

console.assert(
	kolkataMoment.utcDateTime === kolkataMomentRepeat.utcDateTime,
	"Same input should always produce the same UTC timestamp.",
);

console.assert(
	kolkataMoment.utcDateTime !== londonMoment.utcDateTime,
	"Different timezones should change the UTC timestamp.",
);

console.log("Kolkata birth moment", kolkataMoment);
console.log("London birth moment", londonMoment);
