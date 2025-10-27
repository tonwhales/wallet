import { memo, useCallback, useMemo } from "react";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { View, Text, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { ThemeType } from "../../engine/state/theme";
import { HoldersAccountItem, HoldersItemContentType } from "./HoldersAccountItem";
import { Typography } from "../styles";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { PriceComponent } from "../PriceComponent";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { reduceHoldersBalances } from "../../utils/reduceHoldersBalances";
import { usePrice } from "../../engine/PriceContext";
import { Image } from "expo-image";
import { Address } from "@ton/core";
import { useIsConnectAppReady } from "../../engine/hooks";
import { HoldersUserState, holdersUrl as resolveHoldersUrl } from "../../engine/api/holders/fetchUserState";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { useFavoriteHoldersAccount } from "../../engine/hooks/holders/useFavoriteHoldersAccount";

const hideIcon = <Image source={require('@assets/ic-hide.png')} style={{ width: 36, height: 36 }} />;

export const HoldersAccounts = memo(({
    owner,
    accs,
    theme,
    markAccount,
    isTestnet,
    holdersAccStatus,
    isLedger
}: {
    owner: Address,
    accs: GeneralHoldersAccount[],
    theme: ThemeType,
    markAccount: (cardId: string, hidden: boolean) => void,
    isTestnet: boolean,
    holdersAccStatus?: HoldersAccountStatus,
    isLedger?: boolean
}) => {
    const [price] = usePrice();
    const navigation = useTypedNavigation();
    const holdersUrl = resolveHoldersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(holdersUrl, owner.toString({ testOnly: isTestnet }));
    const ledgerContext = useLedgerTransport();
    const [favoriteHoldersAccount] = useFavoriteHoldersAccount();

    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersUserState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

    const addNew = useCallback(() => {
        if (needsEnrolment || !isHoldersReady) {
            if (isLedger && (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport)) {
                ledgerContext.onShowLedgerConnectionError();
                return;
            }
            navigation.navigateHoldersLanding({ endpoint: holdersUrl, onEnrollType: { type: HoldersAppParamsType.Create }, isLedger }, isTestnet);
            return;
        }

        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, isTestnet, isLedger);
    }, [needsEnrolment, isHoldersReady, isTestnet, isLedger, ledgerContext]);

    const totalBalance = useMemo(() => {
        return reduceHoldersBalances(accs, price?.price?.usd ?? 0);
    }, [accs, price?.price?.usd]);

    const rightAction = (item: GeneralHoldersAccount) => markAccount(item.id, true);

    const renderFace = useCallback(() => {
        return (
            <View style={[
                {
                    flexGrow: 1, flexDirection: 'row',
                    padding: 20,
                    marginHorizontal: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    backgroundColor: theme.surfaceOnBg,
                },
                theme.style === 'dark' ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                } : {}
            ]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                    <Image
                        source={require('@assets/ic-holders-accounts.png')}
                        style={{ width: 46, height: 46, borderRadius: 23 }}
                    />
                </View>
                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                    <PerfText
                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {t('products.holders.accounts.title')}
                    </PerfText>
                    <PerfText
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        <PerfText style={{ flexShrink: 1 }}>
                            {t('common.showMore')}
                        </PerfText>
                    </PerfText>
                </View>
                {(!!totalBalance) && (
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                        <PriceComponent
                            amount={totalBalance}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined
                            }}
                            textStyle={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                            theme={theme}
                        />
                    </View>
                )}
            </View>
        );
    }, [totalBalance, theme]);

    const renderItem = useCallback((item: GeneralHoldersAccount, index: number) => {
        return (
            <HoldersAccountItem
                owner={owner}
                key={`card-${index}`}
                account={item}
                rightActionIcon={hideIcon}
                rightAction={rightAction}
                isTestnet={isTestnet}
                holdersAccStatus={holdersAccStatus}
                hideCardsIfEmpty
                content={{ type: HoldersItemContentType.BALANCE }}
                isLedger={isLedger}
                cardsClickable
                isFavorite={favoriteHoldersAccount === item?.address}
            />
        )
    }, [rightAction, owner, isTestnet, holdersAccStatus, isLedger, favoriteHoldersAccount]);

    if (accs.length === 0) {
        return null;
    }

    return (
        <CollapsibleCards
            title={t('products.holders.accounts.title')}
            // re-map to add height correction for accounts with no cards
            items={accs.map((item) => {
                return { ...item, height: item.type === 'vesting' ? 86 : 126 }
            })}
            renderItem={renderItem}
            renderFace={renderFace}
            itemHeight={126}
            theme={theme}
            alwaysExpanded
            limitConfig={{
                maxItems: 4,
                fullList: { type: 'holders-accounts' }
            }}
            action={
                <Pressable
                    style={({ pressed }) => (
                        {
                            flexDirection: 'row',
                            justifyContent: 'space-between', alignItems: 'center',
                            opacity: pressed ? 0.5 : 1,
                        }
                    )}
                    hitSlop={8}
                    onPress={addNew}
                >
                    <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                        {t('products.holders.accounts.addNew')}
                    </Text>
                </Pressable>
            }
        />
    );
});