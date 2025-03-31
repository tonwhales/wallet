import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { WImage } from '../../components/WImage';
import SolanaIcon from '@assets/ic-solana.svg';
import { ThemeType } from '../../engine/state/theme';

const ICON_SIZE = 24;
const ICON_RADIUS = ICON_SIZE / 2;

const styles = StyleSheet.create({
    container: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS,
        borderWidth: 0
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS
    }
});

const usdtIcon = <Image source={require('@assets/known/ic-usdt.png')} style={styles.icon} />;
const tonIcon = <Image source={require('@assets/ic-ton-acc.png')} style={styles.icon} />;
const usdcIcon = <Image source={require('@assets/ic-usdc.png')} style={styles.icon} />;

export function resolveHoldersIcon({ image, ticker, network, holdersIc }: { image?: string | null, ticker?: string, network?: string, holdersIc?: boolean }, theme: ThemeType) {
    let content;

    const isSolana = network === 'solana';

    let networkIcon: React.ReactNode | null = isSolana ? (
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

    const holders = holdersIc ? (
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

    if (ticker === 'USDT') {
        content = usdtIcon;
    } else if (ticker === 'USDC') {
        content = usdcIcon;
    } else if (image) {
        content = <WImage src={image} width={ICON_SIZE} height={ICON_SIZE} borderRadius={ICON_SIZE} />;
    } else {
        networkIcon = null;
        content = tonIcon;
    }

    return (
        <View style={styles.container}>
            {content}
            {holders}
            {networkIcon}
        </View>
    );
}
