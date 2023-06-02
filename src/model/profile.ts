export interface Profile {
	readonly sets?: readonly ProfileSet[];
	readonly achievementCategories?: readonly ProfileAchievementCategory[];
	readonly shareAlias?: string;
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

export interface ProfileAchievementCategory {
	readonly id: number;
	readonly availablePoints: number;
	readonly points: number;
	readonly completedAchievements: number;
	readonly totalAchievements: number;
}
