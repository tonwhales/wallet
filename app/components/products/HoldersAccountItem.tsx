import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle, Text } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useIsConnectAppReady, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { GeneralHoldersAccount, GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ScrollView, Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { HoldersAccountCard } from "./HoldersAccountCard";
import { Platform } from "react-native";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { HoldersAppParams } from "../../fragments/holders/HoldersAppFragment";

import IcTonIcon from '@assets/ic-ton-acc.svg';

export const HoldersAccountItem = memo((props: {
    account: GeneralHoldersAccount,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean,
    style?: StyleProp<ViewStyle>,
    itemStyle?: StyleProp<ViewStyle>,
    isTestnet: boolean,
    hideCardsIfEmpty?: boolean,
    holdersAccStatus?: HoldersAccountStatus,
    onBeforeOpen?: () => void
}) => {
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const holdersAccStatus = props.holdersAccStatus;
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

    const isPro = useMemo(() => {
        return props.account.cards.find((card) => card.personalizationCode === 'black-pro') !== undefined;
    }, [props.account]);

    const onPress = useCallback(() => {
        // Close full list modal (holders navigations is below it in the other nav stack)
        props.onBeforeOpen?.();

        if (needsEnrollment) {
            const onEnrollType: HoldersAppParams = { type: 'account', id: props.account.id };
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType });
            return;
        }

        navigation.navigateHolders({ type: 'account', id: props.account.id });
    }, [props.account, needsEnrollment]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    let title = t('products.holders.accounts.account');

    if (!!props.account.name) {
        title = props.account.name;
    }

    let subtitle = isPro ? t('products.holders.accounts.proAccount') : t('products.holders.accounts.basicAccount');

    const renderRightAction = (!!props.rightActionIcon && !!props.rightAction)
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
                        if (props.rightAction) {
                            props.rightAction();
                        }
                    }}
                >
                    {props.rightActionIcon}
                </Pressable>
            )
        }
        : undefined;

    return (
        <Swipeable
            ref={swipableRef}
            containerStyle={[{ flex: 1 }, props.style]}
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
                    <View style={[{ flexGrow: 1, paddingTop: 20, backgroundColor: theme.surfaceOnBg }, props.itemStyle]}>
                        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 }}>
                            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                <IcTonIcon width={46} height={46} />
                            </View>
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>
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
                            {!!props.account.balance && (
                                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                        <ValueComponent value={props.account.balance} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                                        <PerfText style={{ color: theme.textSecondary }}>
                                            {' TON'}
                                        </PerfText>
                                    </Text>
                                    <PriceComponent
                                        amount={BigInt(props.account.balance)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            alignSelf: 'flex-end',
                                            height: undefined
                                        }}
                                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                        currencyCode={'EUR'}
                                        theme={theme}
                                    />
                                </View>
                            )}
                        </View>
                        {!(props.hideCardsIfEmpty && props.account.cards.length === 0) ? (
                            <ScrollView
                                horizontal={true}
                                style={[{ height: 46, marginTop: 10 }, Platform.select({ android: { marginLeft: 78 } })]}
                                contentContainerStyle={{ gap: 8 }}
                                contentInset={Platform.select({ ios: { left: 78 } })}
                                contentOffset={Platform.select({ ios: { x: -78, y: 0 } })}
                                showsHorizontalScrollIndicator={false}
                                alwaysBounceHorizontal={props.account.cards.length > 0}
                            >
                                {props.account.cards.map((card, index) => {
                                    return (
                                        <HoldersAccountCard
                                            key={`card-item-${index}`}
                                            card={card as GeneralHoldersCard}
                                            theme={theme}
                                        />
                                    )
                                })}
                                {props.account.cards.length === 0 && (
                                    <PerfText style={[{ color: theme.textSecondary }, Typography.medium17_24]}>
                                        {t('products.holders.accounts.noCards')}
                                    </PerfText>
                                )}
                            </ScrollView>
                        ) : (
                            <View style={{ height: 20 }} />
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Swipeable>
    );
});
HoldersAccountItem.displayName = 'HoldersAccountItem';