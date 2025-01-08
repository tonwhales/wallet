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

export enum HoldersItemContentType {
    BALANCE = 'balance',
    SELECT = 'select',
    NAVIGATION = 'navigation'
}

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
    const {
        owner, account, holdersAccStatus,
        rightAction, rightActionIcon, content,
        style, itemStyle,
        onBeforeOpen, onOpen,
        hideCardsIfEmpty,
        isTestnet
    } = props;
    const [price] = usePrice();
    const { isTestnet } = useNetwork();
    const master = props?.account?.cryptoCurrency?.tokenContract || undefined;
    const owner = props.owner;
    const jettonMasterContent = useJetton({ owner, master });
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const name = getAccountName(account.accountIndex, account.name);

    const priceAmount = useMemo(() => {
        const cryptoCurrency = account.cryptoCurrency;

        if (!account || !account.cryptoCurrency || !account.balance) return 0n;

        if (cryptoCurrency.ticker === 'TON') {
            return BigInt(account.balance);
        }

        const amount = toBnWithDecimals(account.balance, cryptoCurrency.decimals) / toNano(price?.price?.usd || 1n);
        return toBnWithDecimals(amount, cryptoCurrency.decimals);
    }, [account.balance, account.cryptoCurrency, price?.price?.usd]);

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

        if (onOpen) {
            onOpen();
            return;
        }

        if (needsEnrollment) {
            const onEnrollType: HoldersAppParams = { type: HoldersAppParamsType.Account, id: account.id };
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType }, isTestnet);
            return;
        }

        navigation.navigateHolders({ type: HoldersAppParamsType.Account, id: account.id }, isTestnet);
    }, [account, needsEnrollment, isTestnet, onOpen]);

    const subtitle = t('products.holders.accounts.basicAccount');

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
                            rightAction(account);
                        }
                    }}
                >
                    {rightActionIcon}
                </Pressable>
            )
        }
        : undefined;

    const contentView = useMemo(() => {
        switch (content?.type) {
            case HoldersItemContentType.SELECT:
                return (
                    <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: 24, width: 24,
                            backgroundColor: content.isSelected ? theme.accent : theme.divider,
                            borderRadius: 12,
                        }}>
                            {content.isSelected && (
                                <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                            )}
                        </View>
                    </View>
                );
            case HoldersItemContentType.BALANCE:
                return (
                    <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            <ValueComponent
                                value={account.balance}
                                precision={account.cryptoCurrency?.decimals === 9 ? 3 : 2}
                                centFontStyle={{ color: theme.textSecondary }}
                                decimals={account.cryptoCurrency?.decimals}
                                forcePrecision
                            />
                            <PerfText style={{ color: theme.textSecondary }}>
                                {` ${account.cryptoCurrency?.ticker}`}
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
                );
            case HoldersItemContentType.NAVIGATION:
                return (
                    <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                        <Image
                            source={require('@assets/ic-chevron-right.png')}
                            style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                        />
                    </View>
                );
            default:
                return null;
        }
    }, [content, account.balance, account.cryptoCurrency, priceAmount, theme]);

    return (
        <Swipeable
            ref={swipableRef}
            containerStyle={[{ flex: 1 }, style]}
            useNativeAnimations={true}
            renderRightActions={renderRightAction}
        >
            <View>
                <View style={[{ borderRadius: 20, overflow: 'hidden', flexGrow: 1, paddingTop: 20, backgroundColor: theme.surfaceOnBg }, itemStyle]}>
                    <TouchableOpacity
                        onPress={onPress}
                        activeOpacity={0.5}
                    >
                        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 }}>
                            {resolveHoldersIcon(
                                { image: jettonMasterContent?.icon, ticker: account.cryptoCurrency?.ticker },
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
                            {contentView}
                        </View>
                        {!(hideCardsIfEmpty && account.cards.length === 0) ? (
                            <ScrollView
                                horizontal={true}
                                style={[{ height: 46, marginTop: 10 }, Platform.select({ android: { marginLeft: 78 } })]}
                                contentContainerStyle={{ gap: 8 }}
                                contentInset={Platform.select({ ios: { left: 78 } })}
                                contentOffset={Platform.select({ ios: { x: -78, y: 0 } })}
                                showsHorizontalScrollIndicator={false}
                                alwaysBounceHorizontal={account.cards.length > 0}
                            >
                                {account.cards.map((card, index) => {
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