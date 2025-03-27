import { Image } from 'expo-image';
import { View } from 'react-native';
import { WImage } from '../../components/WImage';
import { ThemeType } from '../../engine/state/theme';

import SolanaIcon from '@assets/ic-solana.svg';

const usdtIcon = (
    <Image
        source={require('@assets/known/ic-usdt.png')}
        style={{
            borderRadius: 23,
            height: 46,
            width: 46
        }}
    />
);

const tonIcon = (
    <Image
        source={require('@assets/ic-ton-acc.png')}
        style={{
            borderRadius: 23,
            height: 46,
            width: 46
        }}
    />
);

export function resolveHoldersIcon(
    params: { image?: string | null, ticker?: string, holdersIc?: boolean, network?: string },
    theme: ThemeType
) {

    const isSolana = params.network === 'solana';

    const networkIcon = isSolana ? (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            height: 20, width: 20, borderRadius: 10,
            position: 'absolute', right: -2, bottom: -2,
            backgroundColor: theme.surfaceOnBg
        }}>
            <SolanaIcon
                width={10}
                height={10}
                style={{
                    borderRadius: 5,
                    height: 10,
                    width: 10
                }}
            />
        </View>
    ) : (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            height: 20, width: 20, borderRadius: 10,
            position: 'absolute', right: -2, bottom: -2,
            backgroundColor: theme.surfaceOnBg
        }}>
            <Image
                source={require('@assets/ic-ton-acc.png')}
                style={{
                    borderRadius: 10,
                    height: 20,
                    width: 20
                }}
            />
        </View>
    );

    const holdersIc = params.holdersIc ? (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            height: 20, width: 20, borderRadius: 10,
            position: 'absolute', right: -2, bottom: -2,
            backgroundColor: theme.surfaceOnElevation
        }}>
            <Image
                source={require('@assets/ic-holders-accounts.png')}
                style={{ height: 20, width: 20 }}
            />
        </View>
    ) : null;

    if (params.ticker === 'USDT') {
        return (
            <View style={{ width: 46, height: 46, borderRadius: 46 / 2, borderWidth: 0 }}>
                {usdtIcon}
                {holdersIc}
                {networkIcon}
            </View>
        );
    }

    if (params.image) {
        return (
            <View style={{ width: 46, height: 46, borderRadius: 46 / 2, borderWidth: 0 }}>
                <WImage
                    src={params.image}
                    width={46}
                    height={46}
                    borderRadius={46}
                />
                {holdersIc}
                {networkIcon}
            </View>
        );
    }

    if (params.ticker === 'USDC') {
        return (
            <View style={{ width: 46, height: 46, borderRadius: 46 / 2, borderWidth: 0 }}>
                <Image
                    source={require('@assets/ic-usdc.png')}
                    style={{ width: 46, height: 46 }}
                />
                {holdersIc}
                {networkIcon}
            </View>
        );
    }

    return (
        <View style={{ width: 46, height: 46, borderRadius: 46 / 2, borderWidth: 0 }}>
            {tonIcon}
            {holdersIc}
        </View>
    );
}