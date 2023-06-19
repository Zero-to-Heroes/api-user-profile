import { Profile } from './profile';

export interface ProfileUpdateInput extends Profile {
	jwt: string;
	isFirestoneToken?: boolean;
}
