import { Profile } from './profile';

export interface ProfileUpdateInput extends Profile {
	readonly token: string;
}
