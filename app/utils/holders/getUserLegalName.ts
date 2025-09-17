import type { UserProfileT } from '../../engine/api/holders/fetchUserProfile';

export function getUserLegalName(profile: Partial<UserProfileT>): string {
	if (!profile) return '';

	return [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(' ');
}