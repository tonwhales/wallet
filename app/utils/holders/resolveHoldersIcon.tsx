import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { WImage } from '../../components/WImage';

import SolanaIcon from '@assets/ic-solana.svg';

const ICON_SIZE = 24;
const ICON_RADIUS = ICON_SIZE / 2;

const styles = StyleSheet.create({
    container: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS,
        justifyContent: 'center',
        alignItems: 'center'
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS
    }
});

const solanaIc = <SolanaIcon width={styles.icon.width} height={styles.icon.width} style={[styles.icon, { transform: [{ scale: 0.7 }] }]} />;
const tonIcon = <Image source={require('@assets/ic-ton-acc.png')} style={styles.icon} />;

export function resolveHoldersIcon({ image, ticker }: { image?: string | null, ticker?: string, }) {
    let content;

    if (ticker === 'USDT') {
        content = tonIcon;
    } else if (ticker === 'USDC') {
        content = solanaIc;
    } else if (image) {
        content = <WImage src={image} width={ICON_SIZE} height={ICON_SIZE} borderRadius={ICON_SIZE} />;
    } else {
        content = tonIcon;
    }

    return (
        <View style={styles.container}>
            {content}
        </View>
    );
}
