import React from "react";
import { KnownWallet } from "../secure/KnownWallets";
import FastImage from 'react-native-fast-image';

export const KnownAvatar = React.memo((props: { size: number, wallet: KnownWallet }) => {
    return (
        <FastImage
            style={{
                width: props.size,
                height: props.size,
                borderRadius: props.size / 2,
                overflow: 'hidden'
            }}
            source={props.wallet.ic}
        />
    );
});