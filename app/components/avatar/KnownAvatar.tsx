import React, { memo } from "react";
import { Image } from 'expo-image';
import { KnownWallet } from "../../secure/KnownWallets";

export const KnownAvatar = memo((props: { size: number, wallet: KnownWallet }) => {
    return (
        <Image
            style={{
                width: props.size,
                height: props.size,
                borderRadius: props.size / 2,
                overflow: 'hidden'
            }}
            fadeDuration={0}
            source={props.wallet.ic}
        />
    );
});