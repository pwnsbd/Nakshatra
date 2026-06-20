export interface BirthDetails {
	name: string;
	birthDate: string;
	birthTime: string;
	locationLabel: string;
	latitude: number;
	longitude: number;
	timezone: string;
}

export const defaultBirthDetails: BirthDetails = {
	name: "",
	birthDate: "",
	birthTime: "",
	locationLabel: "Jaipur, India",
	latitude: 26.9124,
	longitude: 75.7873,
	timezone: "Asia/Kolkata",
};
