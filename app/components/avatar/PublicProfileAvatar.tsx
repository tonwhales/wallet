import * as React from 'react';
import { memo } from 'react';
import { Avatar, AvatarIcProps, avatarColors, avatarImages } from './Avatar';
import { ForcedAvatarType } from './ForcedAvatar';
import { ThemeType } from '../../engine/state/theme';
import { KnownWallet } from '../../secure/KnownWallets';
import { usePublicProfile } from '../../engine/hooks/publicProfile/usePublicProfile';
import { avatarHash } from '../../utils/avatarHash';

export interface PublicProfileAvatarProps {
    size: number;
    id: string;
    address?: string;
    /** If provided, will skip public profile lookup and use this hash */
    overrideHash?: number | null;
    /** If provided, will skip public profile lookup and use this color */
    overrideBackgroundColor?: string;
    image?: string;
    spam?: boolean;
    showSpambadge?: boolean;
    markContact?: boolean;
    verified?: boolean;
    dontShowVerified?: boolean;
    borderColor?: string;
    borderWidth?: number;
    icProps?: AvatarIcProps;
    theme: ThemeType;
    hashColor?: { hash: number } | boolean;
    knownWallets?: { [key: string]: KnownWallet };
    isLedger?: boolean;
    forcedAvatar?: ForcedAvatarType;
    /** Enable public profile lookup for this address */
    enablePublicProfile?: boolean;
}

/**
 * Avatar component that optionally fetches public profile data
 * If enablePublicProfile is true and the address has a public profile,
 * the avatar and background color from the profile will be used
 */
export const PublicProfileAvatar = memo((props: PublicProfileAvatarProps) => {
    const {
        enablePublicProfile = false,
        address,
        overrideHash,
        overrideBackgroundColor,
        ...avatarProps
    } = props;

    // Fetch public profile if enabled and address is provided
    const publicProfile = usePublicProfile(enablePublicProfile ? address : null);

    console.log('publicProfile', JSON.stringify(publicProfile, null, 2));

    // Determine avatar hash
    let hash: number | null = null;
    if (overrideHash !== undefined && overrideHash !== null) {
        // Use override if provided (e.g., from local wallet settings)
        hash = overrideHash;
    } else if (publicProfile.avatar !== null) {
        // Use public profile avatar if available
        hash = publicProfile.avatar;
    }
    // Otherwise, Avatar component will use avatarHash(id, ...) as default

    // Determine background color
    let backgroundColor: string | undefined = undefined;
    if (overrideBackgroundColor) {
        // Use override if provided
        backgroundColor = overrideBackgroundColor;
    } else if (publicProfile.backgroundColor) {
        // Use public profile background color if available
        backgroundColor = publicProfile.backgroundColor;
    }
    // Otherwise, Avatar will use theme default

    // Determine hashColor prop - if we have a public profile with avatar,
    // use the profile's backgroundColor instead of hash-based color
    let hashColor = avatarProps.hashColor;
    if (publicProfile.avatar !== null && publicProfile.backgroundColor) {
        // Override hashColor to use profile's background
        hashColor = false; // Disable hash color since we're setting backgroundColor directly
        backgroundColor = publicProfile.backgroundColor;
    }

    return (
        <Avatar
            {...avatarProps}
            address={address}
            hash={hash}
            backgroundColor={backgroundColor}
            hashColor={hashColor}
        />
    );
});

PublicProfileAvatar.displayName = 'PublicProfileAvatar';

/**
 * Hook to get resolved avatar data for an address
 * Combines local wallet settings, public profile, and default hash
 */
export function useResolvedAvatarData(params: {
    address: string;
    localAvatarHash?: number | null;
    localColorHash?: number | null;
    enablePublicProfile?: boolean;
}): {
    avatarHash: number;
    colorHash: number;
    backgroundColor: string;
    isFromPublicProfile: boolean;
} {
    const { address, localAvatarHash, localColorHash, enablePublicProfile = false } = params;
    const publicProfile = usePublicProfile(enablePublicProfile ? address : null);

    // Priority: local settings > public profile > default hash
    const resolvedAvatarHash = localAvatarHash ?? publicProfile.avatar ?? avatarHash(address, avatarImages.length);
    const resolvedColorHash = localColorHash ?? (publicProfile.avatar !== null ? 0 : avatarHash(address, avatarColors.length));
    const backgroundColor = publicProfile.backgroundColor ?? avatarColors[resolvedColorHash];
    const isFromPublicProfile = publicProfile.avatar !== null && localAvatarHash === null && localAvatarHash === undefined;

    return {
        avatarHash: resolvedAvatarHash,
        colorHash: resolvedColorHash,
        backgroundColor,
        isFromPublicProfile
    };
}

