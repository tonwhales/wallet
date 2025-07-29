import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Pressable, StyleProp, ViewStyle, Text, ScrollView as RNScrollView, TouchableOpacity } from "react-native";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useIsConnectAppReady, useJetton, usePrice, useTheme } from "../../engine/hooks";
import { HoldersUserState, holdersUrl } from "../../engine/api/holders/fetchUserState";
import { GeneralHoldersAccount, GeneralHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { Swipeable, ScrollView } from "react-native-gesture-handler";
import { HoldersAccountCard } from "./HoldersAccountCard";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { toBnWithDecimals } from "../../utils/withDecimals";
import { Address, toNano } from "@ton/core";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { getAccountName } from "../../utils/holders/getAccountName";
import { resolveHoldersIcon } from "../../utils/holders/resolveHoldersIcon";
import { Image } from "expo-image";
import { AddressComponent } from "../address/AddressComponent";
import { LinearGradient } from "expo-linear-gradient";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { t } from "../../i18n/t";
import { hasDirectSolanaDeposit, hasDirectTonDeposit } from "../../utils/holders/hasDirectDeposit";

import IcCheck from "@assets/ic-check.svg";
import Warning from '@assets/ic-exclamation-mark.svg';
import FavoriteIcon from '@assets/ic-favorite.svg';

export enum HoldersItemContentType {
    BALANCE = 'balance',
    SELECT = 'select',
    NAVIGATION = 'navigation'
}

const CardItem = memo(({
    card,
    theme,
    interactive,
    onCardPress
}: {
    card: GeneralHoldersCard,
    theme: any,
    interactive: boolean,
    onCardPress: (id: string) => void
}) => {
    const cardComponent = (
        <HoldersAccountCard
            key={`card-item-${card.id}`}
            card={card}
            theme={theme}
            style={{ height: 46, width: 72, borderRadius: 12 }}
            coverImageStyle={{ height: 46, width: 72, borderRadius: 8 }}
        />
    );

    if (!interactive) return cardComponent;

    return (
        <TouchableOpacity
            key={`card-wrapper-${card.id}`}
            activeOpacity={0.5}
            onPress={() => onCardPress(card.id)}
        >
            {cardComponent}
        </TouchableOpacity>
    );
});

const AddCardButton = memo(({
    interactive,
    theme,
    onCreateCardPress
}: {
    interactive: boolean,
    theme: any,
    onCreateCardPress: () => void
}) => {
    const content = (
        <Image
            style={{ height: 24, width: 24, tintColor: theme.textSecondary }}
            source={require('@assets/ic-plus.png')}
        />
    );

    if (!interactive) {
        return <View style={{
            height: 46,
            width: 72,
            borderRadius: 12,
            backgroundColor: theme.divider,
            justifyContent: 'center',
            alignItems: 'center'
        }}>{content}</View>;
    }

    return (
        <TouchableOpacity
            activeOpacity={0.5}
            onPress={onCreateCardPress}
            style={{
                height: 46,
                width: 72,
                borderRadius: 12,
                backgroundColor: theme.divider,
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            {content}
        </TouchableOpacity>
    );
});

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
    onWarningClick?: () => void,
    content?: { type: HoldersItemContentType.SELECT, isSelected: boolean } | { type: HoldersItemContentType.BALANCE } | { type: HoldersItemContentType.NAVIGATION },
    addressDescription?: boolean,
    isLedger?: boolean,
    cardsClickable?: boolean,
    isFavorite?: boolean
}) => {
    const {
        owner, account, holdersAccStatus,
        rightAction, rightActionIcon, content,
        style, itemStyle,
        onBeforeOpen, onOpen,
        onWarningClick,
        hideCardsIfEmpty,
        isTestnet, isLedger, cardsClickable, isFavorite
    } = props;
    const [price] = usePrice();
    const master = (account.network === 'ton-mainnet' || account.network === 'ton-testnet')
        ? (account?.cryptoCurrency?.tokenContract || undefined)
        : undefined;
    const jettonMasterContent = useJetton({ owner, master });
    const swipableRef = useRef<Swipeable>(null);
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url, owner.toString({ testOnly: isTestnet }));
    const name = getAccountName(account.accountIndex, account.name);
    const ledgerContext = useLedgerTransport();
    const hasDirectDeposit = hasDirectTonDeposit(account) || hasDirectSolanaDeposit(account);

    const priceAmount = useMemo(() => {
        try {
            const cryptoCurrency = account.cryptoCurrency;

            if (!account || !account.cryptoCurrency || !account.balance) return 0n;

            if (cryptoCurrency.ticker === 'TON') {
                return BigInt(account.balance);
            }

            const amount = toBnWithDecimals(account.balance, cryptoCurrency.decimals) / toNano(price?.price?.usd || 1n);
            return toBnWithDecimals(amount, cryptoCurrency.decimals);
        } catch (error) {
            return 0n;
        }
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

    const checkEnrollmentAndPrepareNavigation = useCallback(() => {
        onBeforeOpen?.();

        if (onOpen) {
            onOpen();
            return { shouldReturn: true };
        }

        if (needsEnrollment) {
            if (isLedger && (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport)) {
                ledgerContext.onShowLedgerConnectionError();
                return { shouldReturn: true };
            }

            const onEnrollType: HoldersAppParams = {
                type: HoldersAppParamsType.Account,
                id: account.id
            };

            navigation.navigateHoldersLanding({
                endpoint: url,
                onEnrollType,
                isLedger
            }, isTestnet);

            return { shouldReturn: true };
        }

        return { shouldReturn: false };
    }, [needsEnrollment, isLedger, ledgerContext, account.id, navigation, url, isTestnet, onBeforeOpen, onOpen]);

    const onPress = useCallback(() => {
        const { shouldReturn } = checkEnrollmentAndPrepareNavigation();
        if (shouldReturn) return;

        navigation.navigateHolders({
            type: HoldersAppParamsType.Account,
            id: account.id
        }, isTestnet, isLedger);
    }, [checkEnrollmentAndPrepareNavigation, account.id, isTestnet, isLedger, navigation]);

    const onCardPress = useCallback((id: string) => {
        const { shouldReturn } = checkEnrollmentAndPrepareNavigation();
        if (shouldReturn) return;

        navigation.navigateHolders({
            type: HoldersAppParamsType.Card,
            id
        }, isTestnet, isLedger);
    }, [checkEnrollmentAndPrepareNavigation, isTestnet, isLedger, navigation]);

    const onCreateCardPress = useCallback(() => {
        const { shouldReturn } = checkEnrollmentAndPrepareNavigation();
        if (shouldReturn) return;

        navigation.navigateHolders({
            type: HoldersAppParamsType.CreateCard,
            id: account.id
        }, isTestnet, isLedger);
    }, [checkEnrollmentAndPrepareNavigation, isTestnet, isLedger, navigation, account.id]);

    const showAddCardButton = useMemo(() => {
        if (account.cards.length === 0) return true;
        if (account.cards.some((card) => card.provider !== 'elysphere-kauri')) return true;
        return false;
    }, [account.cards]);

    const renderRightAction = useCallback(() => {
        if (!rightActionIcon || !rightAction) return undefined;

        return () => (
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
                    rightAction(account);
                }}
            >
                {rightActionIcon}
            </Pressable>
        );
    }, [rightActionIcon, rightAction, theme.accent, account]);

    const contentView = useMemo(() => {
        switch (content?.type) {
            case HoldersItemContentType.SELECT:
                return (
                    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
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
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
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
            default:
                return null;
        }
    }, [content, account.balance, account.cryptoCurrency, priceAmount, theme]);

    const cardsList = useMemo(() => {
        const ScrollViewComponent = !cardsClickable ? RNScrollView : ScrollView;

        return (
            <View style={{ flex: 1 }}>
                <ScrollViewComponent
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        height: 66,
                        gap: 8,
                        paddingRight: 20
                    }}
                >
                    {account.cards.map((card) => (
                        <CardItem
                            key={card.id}
                            card={card as GeneralHoldersCard}
                            theme={theme}
                            interactive={!!cardsClickable}
                            onCardPress={onCardPress}
                        />
                    ))}
                    {showAddCardButton && (
                        <AddCardButton
                            interactive={!!cardsClickable}
                            theme={theme}
                            onCreateCardPress={onCreateCardPress}
                        />
                    )}
                </ScrollViewComponent>
                <LinearGradient
                    style={{
                        height: 66,
                        width: 40,
                        position: 'absolute',
                        right: 0,
                        top: 0
                    }}
                    colors={[
                        ((itemStyle as any)?.backgroundColor || theme.surfaceOnBg) + '00',
                        (itemStyle as any)?.backgroundColor || theme.surfaceOnBg
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.7, y: 0 }}
                />
            </View>
        );
    }, [cardsClickable, theme, onCreateCardPress, account.cards]);

    const accountInfo = useMemo(() => (
        <View style={{ marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {resolveHoldersIcon(
                    { ticker: account.cryptoCurrency?.ticker }
                )}
                <View style={{ flexShrink: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <PerfText
                            style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {name}
                        </PerfText>
                    </View>
                    {props.addressDescription && !!props.account.address && (
                        <PerfText
                            style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            <PerfText style={{ flexShrink: 1 }}>
                                <AddressComponent
                                    bounceable={true}
                                    address={props.account.address}
                                    testOnly={isTestnet}
                                />
                            </PerfText>
                        </PerfText>
                    )}
                </View>
            </View>
            {isFavorite && (
                <FavoriteIcon
                    color={theme.iconPrimary}
                    style={{ height: 24, width: 24 }}
                />
            )}
        </View>
    ), [jettonMasterContent?.icon, account.cryptoCurrency?.ticker, theme.textPrimary, theme.textSecondary, name, props.addressDescription, props.account.address, isTestnet, isFavorite]);

    const navigationIcon = useMemo(() => (
        content?.type === HoldersItemContentType.NAVIGATION ? (
            <View style={{
                justifyContent: 'center', alignItems: 'flex-end',
                position: 'absolute', right: 20,
                top: 0, bottom: 0
            }}>
                <Image
                    source={require('@assets/ic-chevron-right.png')}
                    style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                />
            </View>
        ) : null
    ), [content?.type, theme.iconPrimary]);

    const cardsAndBalanceSection = useMemo(() => (
        <View style={{ flexDirection: 'row', flexGrow: 1, paddingHorizontal: 20 }}>
            {cardsList}
            {cardsClickable ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
                    {contentView}
                </TouchableOpacity>
            ) : contentView}
        </View>
    ), [cardsList, cardsClickable, contentView, onPress]);

    const shouldWarningBeShown = useMemo(() => {
        return !hasDirectDeposit && !!onWarningClick;
    }, [hasDirectDeposit, onWarningClick]);

    const warningSection = useMemo(() => {
        if (!shouldWarningBeShown) return null;

        return (
            <>
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 }} onPress={() => {
                    navigation.navigateAlert({
                        title: t('products.holders.noDirectDeposit.alertTitle'),
                        message: t('products.holders.noDirectDeposit.alertDescription'),
                        buttonTitle: t('products.holders.noDirectDeposit.buttonTitle'),
                        callback: onWarningClick
                    });
                }}>
                    <Warning width={24} height={24} color={theme.warning} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.warning, ...Typography.regular15_20 }} numberOfLines={1} ellipsizeMode={'tail'}>
                            {t('products.holders.noDirectDeposit.warningTitle')}
                        </Text>
                    </View>
                    <Image
                        source={require('@assets/ic-chevron-right.png')}
                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                    />
                </TouchableOpacity>
            </>
        );
    }, [theme.warning, navigation, onWarningClick]);


    const holdersAccountCard = useMemo(() => {
        if (!cardsClickable) {
            return (
                <TouchableOpacity onPress={onPress} activeOpacity={0.5} style={{ flexGrow: 1 }} disabled={shouldWarningBeShown}>
                    <View style={[{
                        borderRadius: 20,
                        overflow: 'hidden',
                        flexGrow: 1,
                        paddingVertical: 20,
                        backgroundColor: theme.surfaceOnBg
                    },
                        itemStyle]}>
                        <View style={{ opacity: shouldWarningBeShown ? 0.5 : 1 }}>
                            {cardsAndBalanceSection}
                            {accountInfo}
                            {navigationIcon}
                        </View>
                        {warningSection}
                    </View>
                </TouchableOpacity>
            );
        } else {
            return (
                <View style={[{
                    borderRadius: 20,
                    overflow: 'hidden',
                    flexGrow: 1,
                    paddingVertical: 20,
                    backgroundColor: theme.surfaceOnBg
                }, itemStyle]}>
                    {cardsAndBalanceSection}
                    <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
                        {accountInfo}
                        {navigationIcon}
                    </TouchableOpacity>
                </View>
            );
        }
    }, [cardsClickable, onPress, cardsAndBalanceSection, accountInfo, navigationIcon, hasDirectDeposit]);

    return (
        <Swipeable
            ref={swipableRef}
            containerStyle={[{ flex: 1 }, style]}
            useNativeAnimations={true}
            renderRightActions={renderRightAction()}
        >
            {holdersAccountCard}
        </Swipeable >
    );
});
HoldersAccountItem.displayName = 'HoldersAccountItem';