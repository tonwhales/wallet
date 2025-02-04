import { memo, useEffect } from 'react';
import { useSyncState, useTheme } from '../../../engine/hooks';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';

import NoConnection from '@assets/ic-no-connection.svg';
import { useLedgerTransport } from '../../ledger/components/TransportContext';
import { useToaster } from '../../../components/toast/ToastProvider';
import { t } from '../../../i18n/t';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const BlinkingDot = memo(() => {
    const theme = useTheme();
    const opacity = useSharedValue(1);

    opacity.value = withRepeat(
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        Infinity
    )

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    return (
        <View style={{ height: 16, width: 16, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.iconNav }, animatedStyle]} />
        </View>
    )
});

export const HeaderSyncStatus = memo(({ address, isLedger }: { address?: string, isLedger?: boolean }) => {
    const theme = useTheme();
    const syncState = useSyncState(address);
    const ledgerContext = useLedgerTransport();
    const toaster = useToaster();
    const bottomBarHeight = useBottomTabBarHeight();
    const isLedgerConnected = isLedger && !!ledgerContext.tonTransport;

    useEffect(() => {
        if (isLedgerConnected) {
            toaster.show({
                type: 'success',
                message: t('syncStatus.online'),
                marginBottom: bottomBarHeight + 16
            });
        }
    }, [isLedgerConnected]);

    if (syncState === 'updating') {
        return <BlinkingDot />;
    }

    if (isLedger && !isLedgerConnected) {
        return (
            <View style={{ height: 16, width: 16, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: theme.iconNav, width: 8, height: 8, borderRadius: 4 }} />
            </View>
        );
    }

    if (syncState === 'connecting') {
        return (
            <NoConnection
                height={16}
                width={16}
                style={{ height: 16, width: 16 }}
            />
        );
    }

    return (
        <View style={{ height: 16, width: 16, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.accentGreen, width: 8, height: 8, borderRadius: 4 }} />
        </View>
    );
});