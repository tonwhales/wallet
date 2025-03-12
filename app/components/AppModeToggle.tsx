import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../engine/hooks';
import { useTranslation } from 'react-i18next';

const ICON_SIZE = 16;
const GAP_BETWEEN_ICON_AND_TEXT = 4;
const TOGGLE_BORDER_WIDTH = 2

export const AppModeToggle = () => {
    const { t } = useTranslation();
    const leftLabel = t('common.wallet')
    const rightLabel = t('common.cards')
    const theme = useTheme();
    const [isWalletMode, setWalletMode] = useState(true);
    const [toggleWidth, setToggleWidth] = useState(0);

    useEffect(() => {
        const leftLabelWidth = leftLabel.length * 10;
        const rightLabelWidth = rightLabel.length * 10;
        setToggleWidth(Math.max(leftLabelWidth, rightLabelWidth) + ICON_SIZE + GAP_BETWEEN_ICON_AND_TEXT + 16);
    }, [leftLabel, rightLabel]);

    const handleToggle = useCallback(() => {
        setWalletMode(value => !value)
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateX: withTiming(isWalletMode ? toggleWidth - TOGGLE_BORDER_WIDTH * 2 : 0, {}, () => {
                    // TODO: switch mode
                })
            }],
        };
    });

    const leftTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(isWalletMode ? theme.textOnsurfaceOnDark : theme.black),
        };
    });

    const rightTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(isWalletMode ? theme.black : theme.textOnsurfaceOnDark),
        };
    });

    const walletIconStyle = useAnimatedStyle(() => {
        return {
            tintColor: withTiming(isWalletMode ? theme.textOnsurfaceOnDark : theme.black),
            width: ICON_SIZE,
            height: ICON_SIZE,
        };
    });

    const cardsIconStyle = useAnimatedStyle(() => {
        return {
            tintColor: withTiming(isWalletMode ? theme.black : theme.textOnsurfaceOnDark),
            width: ICON_SIZE,
            height: ICON_SIZE,
        };
    });

    return (
        <View style={styles.container}>
            <Pressable onPress={handleToggle} style={[styles.toggleContainer, { width: toggleWidth * 2, backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg }]}>
            <Animated.View style={[styles.toggle, animatedStyle, { width: toggleWidth }]} />
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
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 20,
        height: 36,
    },
    toggle: {
        position: 'absolute',
        height: 32,
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

