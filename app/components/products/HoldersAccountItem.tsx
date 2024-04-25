import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Animated from "react-native-reanimated";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useHoldersAccountStatus, useIsConnectAppReady, useSelectedAccount, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { GeneralHoldersAccount, GeneralHoldersCard, PrePaidHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ScrollView, Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { HoldersAccountCard } from "./HoldersAccountCard";
import { Platform } from "react-native";
import { toNano } from "@ton/core";

import IcTonIcon from '@assets/ic-ton-acc.svg';

export const HoldersAccountItem = memo((props: {
    account: { type: 'account' } & GeneralHoldersAccount | { type: 'prepaid', card: PrePaidHoldersCard },
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean,
    style?: StyleProp<ViewStyle>,
    isTestnet: boolean
}) => {
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

    const isPro = useMemo(() => {
        if (props.account.type === 'prepaid') {
            return false;
        }
        return props.account.cards.find((card) => card.personalizationCode === 'black-pro') !== undefined;
    }, [props.account]);

    const onPress = useCallback(() => {

        if (needsEnrollment) {
            const onEnrollType = props.account.type === 'prepaid'
                ? { type: 'prepaid', id: props.account.card.id }
                : { type: 'account', id: props.account.id };
            navigation.navigate(
                'HoldersLanding',
                { endpoint: url, onEnrollType: onEnrollType }
            );
            return;
        }

        navigation.navigateHolders(props.account.type === 'prepaid'
            ? { type: 'prepaid', id: props.account.card.id }
            : { type: 'account', id: props.account.id }
        );
    }, [props.account, needsEnrollment]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    let title = t('products.holders.accounts.account');

    if (props.account.type === 'account' && props.account?.name) {
        title = props.account.name;
    } else if (props.account.type === 'prepaid') {
        title = t('products.holders.accounts.prepaidCard');
    }

    let subtitle = isPro ? t('products.holders.accounts.proAccount') : t('products.holders.accounts.basicAccount');
    if (props.account.type === 'prepaid') {
        subtitle = t('products.holders.accounts.prepaidCardDescription');
    }

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
                    <View style={{ flexGrow: 1, paddingTop: 20, backgroundColor: theme.surfaceOnBg }}>
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
                            {props.account.type === 'prepaid' ? (
                                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                    <PerfText style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                        <ValueComponent value={toNano(props.account.card.fiatBalance)} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                                        <PerfText style={{ color: theme.textSecondary }}>
                                            {` ${props.account.card.fiatCurrency}`}
                                        </PerfText>
                                    </PerfText>
                                </View>
                            ) : props.account.balance && (
                                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                                    <PerfText style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                        <ValueComponent value={props.account.balance} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                                        <PerfText style={{ color: theme.textSecondary }}>
                                            {' TON'}
                                        </PerfText>
                                    </PerfText>
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
                        <ScrollView
                            horizontal={true}
                            style={[{ height: 46, marginTop: 10 }, Platform.select({ android: { marginLeft: 78 } })]}
                            contentContainerStyle={{ gap: 8 }}
                            contentInset={Platform.select({ ios: { left: 78 } })}
                            contentOffset={Platform.select({ ios: { x: -78, y: 0 } })}
                            showsHorizontalScrollIndicator={false}
                            alwaysBounceHorizontal={props.account.type === 'prepaid' ? false : props.account.cards.length > 0}
                        >
                            {props.account.type === 'prepaid' ? (
                                <HoldersAccountCard
                                    key={'card-item-prepaid'}
                                    card={{ ...props.account.card, personalizationCode: 'black-pro' } as GeneralHoldersCard}
                                    theme={theme}
                                />
                            ) : (
                                props.account.cards.map((card, index) => {
                                    return (
                                        <HoldersAccountCard
                                            key={`card-item-${index}`}
                                            card={card as GeneralHoldersCard}
                                            theme={theme}
                                        />
                                    )
                                })
                            )}
                            {props.account.type === 'account' && props.account.cards.length === 0 && (
                                <PerfText style={[{ color: theme.textSecondary }, Typography.medium17_24]}>
                                    {t('products.holders.accounts.noCards')}
                                </PerfText>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Swipeable >
    );
});