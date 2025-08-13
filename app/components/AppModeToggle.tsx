import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNetwork, useSelectedAccount, useTheme } from '../engine/hooks';
import { useAppMode } from '../engine/hooks/appstate/useAppMode';
import { holdersUrl } from '../engine/api/holders/fetchUserState';
import { useLedgerTransport } from '../fragments/ledger/components/TransportContext';
import { Address } from '@ton/core';
import { t } from '../i18n/t';
import { queryClient } from '../engine/clients';
import { Queries } from '../engine/queries';
import { APP_MODE_TOGGLE_HEIGHT } from '../utils/constants';

const ICON_SIZE = 16;
const GAP_BETWEEN_ICON_AND_TEXT = 4;
const TOGGLE_BORDER_WIDTH = 2;

export const AppModeToggle = memo(({ isLedger, scrollOffsetSv, walletHeaderHeight, headerTopPadding }: { isLedger?: boolean, scrollOffsetSv: SharedValue<number>, walletHeaderHeight: number, headerTopPadding: number }) => {
    const leftLabel = t('common.wallet')
    const rightLabel = t('common.cards')
    const theme = useTheme();
    const selected = useSelectedAccount();
    const [isWalletMode, toggleAppMode] = useAppMode(selected?.address, { isLedger });
    const ledgerContext = useLedgerTransport();
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : selected!.address!;
    const [isToggleInWalletMode, setToggleInWalletMode] = useState(isWalletMode);
    const [toggleWidth, setToggleWidth] = useState(0);
    const { isTestnet } = useNetwork();
    const url = holdersUrl(isTestnet);

    useEffect(() => {
        setToggleInWalletMode(isWalletMode);
    }, [address?.toString(), isWalletMode]);

    useEffect(() => {
        const leftLabelWidth = leftLabel.length * 10;
        const rightLabelWidth = rightLabel.length * 10;
        setToggleWidth(Math.max(leftLabelWidth, rightLabelWidth) + ICON_SIZE + GAP_BETWEEN_ICON_AND_TEXT + 16);
    }, [leftLabel, rightLabel]);

    const handleToggle = useCallback(() => {
        setToggleInWalletMode(value => !value)
    }, []);

    const onSwitchAppMode = useCallback((isSwitchingToWallet: boolean) => {
        toggleAppMode(isSwitchingToWallet);
        if (!isSwitchingToWallet) {
            queryClient.invalidateQueries({ queryKey: Queries.Holders(address.toString({ testOnly: isTestnet })).Iban() });
        }
    }, [url, isTestnet, isLedger, address, toggleAppMode])

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateX: withTiming(isToggleInWalletMode ? 0 : toggleWidth - TOGGLE_BORDER_WIDTH * 2, {}, (finished) => {
                    if (finished) {
                        runOnJS(onSwitchAppMode)(isToggleInWalletMode)
                    }
                })
            }],
        };
    }, [isToggleInWalletMode, toggleWidth]);

    const leftTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(isToggleInWalletMode ? theme.black : theme.textUnchangeable),
        };
    });

    const rightTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(isToggleInWalletMode ? theme.textUnchangeable : theme.black),
        };
    });

    const walletIconStyle = useAnimatedStyle(() => {
        return {
            tintColor: withTiming(isToggleInWalletMode ? theme.black : theme.iconUnchangeable),
            width: ICON_SIZE,
            height: ICON_SIZE,
        };
    });

    const cardsIconStyle = useAnimatedStyle(() => {
        return {
            tintColor: withTiming(isToggleInWalletMode ? theme.iconUnchangeable : theme.black),
            width: ICON_SIZE,
            height: ICON_SIZE,
        };
    });

    const positionStyle = useAnimatedStyle(() => {
        const headerHeight = walletHeaderHeight - headerTopPadding
        const y = Math.max(walletHeaderHeight - scrollOffsetSv.value + 8, walletHeaderHeight - (headerHeight / 2 + APP_MODE_TOGGLE_HEIGHT / 2));
        return {
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            zIndex: 10,
            alignItems: 'center',
        };
    });

    return (
        <Animated.View style={positionStyle} pointerEvents="box-none">
            <View style={styles.container}>
                <Pressable onPress={handleToggle} style={[styles.toggleContainer, { width: toggleWidth * 2, backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }]}>
                    <Animated.View style={[styles.toggle, animatedStyle, { width: toggleWidth, backgroundColor: theme.white }]} />
                    <View style={styles.button}>
                        <Animated.Image
                            source={require('@assets/ic-filter-wallet.png')}
                            style={walletIconStyle}
                        />
                        <Animated.Text style={[styles.text, leftTextStyle]}>{leftLabel}</Animated.Text>
                    </View>
                    <View style={styles.button}>
                        <Animated.Image
                            source={require('@assets/ic-filter-card.png')}
                            style={cardsIconStyle}
                        />
                        <Animated.Text style={[styles.text, rightTextStyle]}>{rightLabel}</Animated.Text>
                    </View>
                </Pressable>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 20,
        height: APP_MODE_TOGGLE_HEIGHT,
    },
    toggle: {
        position: 'absolute',
        height: APP_MODE_TOGGLE_HEIGHT - TOGGLE_BORDER_WIDTH * 2,
        borderRadius: 15,
        top: 2,
        left: TOGGLE_BORDER_WIDTH,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        flexDirection: 'row',
        gap: GAP_BETWEEN_ICON_AND_TEXT,
    },
    text: {
        fontSize: 16,
    },
});

