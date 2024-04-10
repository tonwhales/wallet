import React from "react";
import { Image } from 'react-native';
import { KnownWallet } from "../secure/KnownWallets";

export const KnownAvatar = React.memo((props: { size: number, wallet: KnownWallet }) => {
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