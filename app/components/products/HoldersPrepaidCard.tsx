import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle, Text } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useIsConnectAppReady, useTheme } from "../../engine/hooks";
import { HoldersUserState, holdersUrl } from "../../engine/api/holders/fetchUserState";
import { GeneralHoldersCard, PrePaidHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { Address, toNano } from "@ton/core";
import { CurrencySymbols } from "../../utils/formatCurrency";
import { HoldersAccountCard } from "./HoldersAccountCard";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { useLockAppWithAuthState } from "../../engine/hooks/settings";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";

export const HoldersPrepaidCard = memo((props: {
    owner: Address,
    card: PrePaidHoldersCard,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean,
    style?: StyleProp<ViewStyle>,
    itemStyle?: StyleProp<ViewStyle>,
    isTestnet: boolean,
    holdersAccStatus?: HoldersAccountStatus,
    onBeforeOpen?: () => void,
    isLedger?: boolean
}) => {
    const [lockAppWithAuth] = useLockAppWithAuthState();
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { isLedger, holdersAccStatus, isTestnet, card, onBeforeOpen, rightAction, rightActionIcon, style, itemStyle, owner } = props;
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url, owner.toString({ testOnly: isTestnet }));
    const ledgerContext = useLedgerTransport();

    const needsEnrollment = useMemo(() => {
        if (!isHoldersReady) {
            return true;
        }

        if (!holdersAccStatus) {
            return true;
        }

        if (holdersAccStatus.state === HoldersUserState.NeedEnrollment) {
            return true;
        }

        return false;
    }, [holdersAccStatus, isHoldersReady]);

    const onPress = useCallback(() => {
        // Close full list modal (holders navigations is below it in the other nav stack)
        onBeforeOpen?.();


        if (needsEnrollment) {
            if (isLedger && (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport)) {
                ledgerContext.onShowLedgerConnectionError();
                return;
            }
            const onEnrollType: HoldersAppParams = { type: HoldersAppParamsType.Prepaid, id: card.id };
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType, isLedger }, isTestnet);
            return;
        }

        navigation.navigateHolders({ type: HoldersAppParamsType.Prepaid, id: card.id }, isTestnet, isLedger);
    }, [card, needsEnrollment, onBeforeOpen, isTestnet, isLedger, ledgerContext]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const title = t('products.holders.accounts.prepaidCard', { lastFourDigits: lockAppWithAuth ? card.lastFourDigits : '****' });
    const subtitle = t('products.holders.accounts.prepaidCardDescription');

    const renderRightAction = (!!rightActionIcon && !!rightAction)
        ? () => {
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
                        if (rightAction) {
                            rightAction();
                        }
                    }}
                >
                    {rightActionIcon}
                </Pressable>
            )
        }
        : undefined;

    return (
        <Swipeable
            ref={swipableRef}
            containerStyle={[{ flex: 1 }, style]}
            useNativeAnimations={true}
            renderRightActions={renderRightAction}
        >
            <Animated.View style={animatedStyle}>
                <TouchableOpacity
                    style={{ borderRadius: 20, overflow: 'hidden' }}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <View style={[{ flexGrow: 1, paddingVertical: 20, backgroundColor: theme.surfaceOnBg }, itemStyle]}>
                        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 }}>
                            <HoldersAccountCard
                                key={'card-item-prepaid'}
                                card={{ ...card, personalizationCode: 'black-pro' } as GeneralHoldersCard}
                                theme={theme}
                            />
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>

                                <PerfText
                                    style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                    // to avoid clipping card number
                                    ellipsizeMode={'middle'}
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
                            <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    {lockAppWithAuth ? (
                                        <ValueComponent
                                            value={toNano(card.fiatBalance)}
                                            precision={2}
                                            centFontStyle={{ color: theme.textSecondary }}
                                        />
                                    ) : (
                                        <PerfText>
                                            {'****'}
                                        </PerfText>
                                    )}
                                    <PerfText style={{ color: theme.textSecondary }}>
                                        {` ${CurrencySymbols[card.fiatCurrency].symbol}`}
                                    </PerfText>
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Swipeable>
    );
});