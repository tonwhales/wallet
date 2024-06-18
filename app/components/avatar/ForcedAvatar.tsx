import { memo } from "react";
import { Image } from 'expo-image';

export type ForcedAvatarType = 'dedust' | 'holders' | 'ledger';

export const ForcedAvatar = memo(({ type, size }: { type: ForcedAvatarType, size: number }) => {

    switch (type) {
        case 'dedust':
            return (
                <Image
                    source={require('@assets/known/ic-dedust.png')}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        case 'holders':
            return (
                <Image
                    source={require('@assets/ic-holders-accounts.png')}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        case 'ledger':
            return (
                <Image
                    source={require('@assets/ledger_device.png')}
                    style={{ height: size, width: size }}
                />
            );
        default: return null;
    }
});