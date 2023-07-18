import { BoosterType, CardClass } from '@firestone-hs/reference-data';

export interface Profile {
	readonly sets?: readonly ProfileSet[];
	readonly achievementCategories?: readonly ProfileAchievementCategory[];
	readonly bgFullTimeStatsByHero?: readonly ProfileBgHeroStat[];
	readonly packsAllTime?: readonly ProfilePackStat[];
	readonly winsForModes?: readonly ProfileWinsForMode[];
	readonly classesProgress?: readonly ProfileClassProgress[];
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

export interface ProfileBgHeroStat {
	readonly heroCardId: string;
	readonly gamesPlayed: number;
	readonly top4: number;
	readonly top1: number;
}

export interface ProfilePackStat {
	readonly id: BoosterType;
	readonly totalObtained: number;
}

export interface ProfileWinsForMode {
	readonly mode: 'constructed' | 'duels' | 'arena';
	readonly wins: number;
	readonly losses: number;
	readonly ties: number;
}

export interface ProfileClassProgress {
	readonly playerClass: CardClass;
	readonly level: number;
	readonly wins: number;
	// I don't think I can have info about this
	// readonly losses: number;
	// readonly ties: number;
}
