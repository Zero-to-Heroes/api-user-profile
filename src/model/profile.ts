export interface Profile {
	readonly sets?: readonly ProfileSet[];
}

export interface ProfileSet {
	readonly id: string;
	readonly global: CardsForSet;
	readonly vanilla: CardsForSet;
	readonly golden: CardsForSet;
	readonly diamond: CardsForSet;
	readonly signature: CardsForSet;
}

export interface CardsForSet {
	readonly common: number;
	readonly rare: number;
	readonly epic: number;
	readonly legendary: number;
}
