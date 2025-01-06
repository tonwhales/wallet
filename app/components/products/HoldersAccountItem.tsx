import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle, Text } from "react-native";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useIsConnectAppReady, useJetton, useNetwork, usePrice, useTheme } from "../../engine/hooks";
import { HoldersUserState, holdersUrl } from "../../engine/api/holders/fetchUserState";
import { GeneralHoldersAccount, GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { ScrollView, Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { HoldersAccountCard } from "./HoldersAccountCard";
import { Platform } from "react-native";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { toBnWithDecimals } from "../../utils/withDecimals";
import { Address, toNano } from "@ton/core";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { getAccountName } from "../../utils/holders/getAccountName";
import { resolveHoldersIcon } from "../../utils/holders/resolveHoldersIcon";
import { AddressComponent } from "../address/AddressComponent";

import IcCheck from "@assets/ic-check.svg";

export const HoldersAccountItem = memo((props: {
    owner: Address,
    account: GeneralHoldersAccount,
    last?: boolean,
    first?: boolean,
    rightAction?: (acc: GeneralHoldersAccount) => void
    rightActionIcon?: any,
    single?: boolean,
    hidden?: boolean,
    style?: StyleProp<ViewStyle>,
    itemStyle?: StyleProp<ViewStyle>,
    isTestnet: boolean,
    hideCardsIfEmpty?: boolean,
    holdersAccStatus?: HoldersAccountStatus,
    onBeforeOpen?: () => void
    onOpen?: () => void,
    selectable?: boolean,
    isSelected?: boolean,
    addressDescription?: boolean
}) => {
    const [price] = usePrice();
    const { isTestnet } = useNetwork();
    const master = props?.account?.cryptoCurrency?.tokenContract || undefined;
    const owner = props.owner;
    const jettonMasterContent = useJetton({ owner, master });
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const holdersAccStatus = props.holdersAccStatus;
    const url = holdersUrl(props.isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const name = getAccountName(props.account.accountIndex, props.account.name);

    const priceAmount = useMemo(() => {
        const cryptoCurrency = props.account.cryptoCurrency;

        if (!props.account || !props.account.cryptoCurrency || !props.account.balance) return 0n;

        if (cryptoCurrency.ticker === 'TON') {
            return BigInt(props.account.balance);
        }

        const amount = toBnWithDecimals(props.account.balance, cryptoCurrency.decimals) / toNano(price?.price?.usd || 1n);
        return toBnWithDecimals(amount, cryptoCurrency.decimals);
    }, [props.account.balance, props.account.cryptoCurrency, price?.price?.usd]);

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
        props.onBeforeOpen?.();

        if (props.onOpen) {
            props.onOpen();
            return;
        }

        if (needsEnrollment) {
            const onEnrollType: HoldersAppParams = { type: HoldersAppParamsType.Account, id: props.account.id };
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType }, props.isTestnet);
            return;
        }

        navigation.navigateHolders({ type: HoldersAppParamsType.Account, id: props.account.id }, props.isTestnet);
    }, [props.account, needsEnrollment, props.isTestnet, props.onOpen]);

    const subtitle = t('products.holders.accounts.basicAccount');

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
                            props.rightAction(props.account);
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
            <View>
                <View style={[{ borderRadius: 20, overflow: 'hidden', flexGrow: 1, paddingTop: 20, backgroundColor: theme.surfaceOnBg }, props.itemStyle]}>
                    <TouchableOpacity
                        onPress={onPress}
                        activeOpacity={0.5}
                    >
                        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 }}>
                            {resolveHoldersIcon(
                                { image: jettonMasterContent?.icon, ticker: props.account.cryptoCurrency?.ticker },
                                theme
                            )}
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                <PerfText
                                    style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {name}
                                </PerfText>
                                <PerfText
                                    style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {props.addressDescription && !!props.account.address ? (
                                            <AddressComponent
                                                bounceable={true}
                                                address={props.account.address}
                                                testOnly={isTestnet}
                                            />
                                        ) : (subtitle)}
                                    </PerfText>
                                </PerfText>
                            </View>
                            {!!props.selectable ? (
                                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 24, width: 24,
                                        backgroundColor: props.isSelected ? theme.accent : theme.divider,
                                        borderRadius: 12,
                                    }}>
                                        {props.isSelected && (
                                            <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                                        )}
                                    </View>
                                </View>
                            ) : (
                                !!props.account.balance && (
                                    <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                            <ValueComponent
                                                value={props.account.balance}
                                                precision={props.account.cryptoCurrency?.decimals === 9 ? 3 : 2}
                                                centFontStyle={{ color: theme.textSecondary }}
                                                decimals={props.account.cryptoCurrency?.decimals}
                                                forcePrecision
                                            />
                                            <PerfText style={{ color: theme.textSecondary }}>
                                                {` ${props.account.cryptoCurrency?.ticker}`}
                                            </PerfText>
                                        </Text>
                                        <PriceComponent
                                            amount={priceAmount}
                                            style={{
                                                backgroundColor: 'transparent',
                                                paddingHorizontal: 0, paddingVertical: 0,
                                                alignSelf: 'flex-end',
                                                height: undefined
                                            }}
                                            textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                            theme={theme}
                                        />
                                    </View>
                                )
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
                            </ScrollView>
                        ) : (
                            <View style={{ height: 20 }} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Swipeable>
    );
});
HoldersAccountItem.displayName = 'HoldersAccountItem';