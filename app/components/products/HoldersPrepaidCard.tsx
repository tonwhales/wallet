import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useHoldersAccountStatus, useIsConnectAppReady, useSelectedAccount, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { PrePaidHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { toNano } from "@ton/core";
import { CurrencySymbols } from "../../utils/formatCurrency";

export const HoldersPrepaidCard = memo((props: {
    card: PrePaidHoldersCard,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean,
    style?: StyleProp<ViewStyle>,
    isTestnet: boolean
}) => {
    const card = props.card;
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const url = holdersUrl(props.isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);

    const needsEnrollment = useMemo(() => {
        if (!isHoldersReady) {
            return true;
        }

        if (!holdersAccStatus) {
            return true;
        }

        if (holdersAccStatus.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }

        return false;
    }, [holdersAccStatus, isHoldersReady]);

    const onPress = useCallback(() => {

        if (needsEnrollment) {
            const onEnrollType = { type: 'prepaid', id: card.id }
            navigation.navigate(
                'HoldersLanding',
                { endpoint: url, onEnrollType: onEnrollType }
            );
            return;
        }

        navigation.navigateHolders({ type: 'prepaid', id: card.id });
    }, [card, needsEnrollment]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const title = t('products.holders.accounts.prepaidCard', { lastFourDigits: card.lastFourDigits });
    const subtitle = t('products.holders.accounts.prepaidCardDescription');

    return (
        <Swipeable
            ref={swipableRef}
            containerStyle={[{ flex: 1 }, props.style]}
            useNativeAnimations={true}
            renderRightActions={() => {
                return (
                    <Pressable
                        style={[
                            {
                                padding: 20,
                                justifyContent: 'center', alignItems: 'center',
                                borderRadius: 20,
                                backgroundColor: theme.accent,
                                marginLeft: 10
                            }
                        ]}
                        onPress={() => {
                            swipableRef.current?.close();
                            if (props.rightAction) {
                                props.rightAction();
                            }
                        }}
                    >
                        {props.rightActionIcon}
                    </Pressable>
                )
            }}
        >
            <Animated.View style={animatedStyle}>
                <TouchableOpacity
                    style={{ borderRadius: 20, overflow: 'hidden' }}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <View style={{ flexDirection: 'row', flexGrow: 1, padding: 20, backgroundColor: theme.surfaceOnBg, alignItems: 'center' }}>
                        <View style={{flexShrink: 1 }}>
                            <PerfText
                                style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {title}
                            </PerfText>
                            <PerfText
                                style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                <PerfText style={{ flexShrink: 1 }}>
                                    {subtitle}
                                </PerfText>
                            </PerfText>
                        </View>
                        <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                <ValueComponent value={toNano(card.fiatBalance)} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                                <PerfText style={{ color: theme.textSecondary }}>
                                    {` ${CurrencySymbols[card.fiatCurrency].symbol}`}
                                </PerfText>
                            </PerfText>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Swipeable>
    );
});