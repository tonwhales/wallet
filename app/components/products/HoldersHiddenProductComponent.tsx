import React, { memo, useMemo, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { t } from "../../i18n/t";
import { HoldersAccountItem } from "./HoldersAccountItem";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { useHoldersHiddenPrepaidCards } from "../../engine/hooks/holders/useHoldersHiddenPrepaidCards";
import { HoldersPrepaidCard } from "./HoldersPrepaidCard";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";

import Show from '@assets/ic-show.svg';

export const holdersCardImageMap: { [key: string]: any } = {
    'classic': require('@assets/holders/classic.png'),
    'black-pro': require('@assets/holders/black-pro.png'),
    'whales': require('@assets/holders/whales.png'),
}

export const HoldersHiddenProductComponent = memo(({ holdersAccStatus }: { holdersAccStatus?: HoldersAccountStatus }) => {
    const theme = useTheme();
    const network = useNetwork();
    const selected = useSelectedAccount();
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const prePaid = useHoldersAccounts(selected!.address).data?.prepaidCards;

    const [hiddenAccounts, markAccount] = useHoldersHiddenAccounts(selected!.address);
    const [hiddenPrepaidCards, markPrepaidCard] = useHoldersHiddenPrepaidCards(selected!.address);

    let hiddenAccountsList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return hiddenAccounts.includes(item.id);
        });
    }, [hiddenAccounts, accounts]);

    const hiddenPrepaidList = useMemo(() => {
        return (prePaid ?? []).filter((item) => {
            return hiddenPrepaidCards.includes(item.id);
        });
    }, [hiddenPrepaidCards, prePaid]);

    const [collapsedAccounts, setCollapsedAccounts] = useState(true);
    const [collapsedPrepaid, setCollapsedPrepaid] = useState(true);

    if (hiddenAccountsList.length === 0 && hiddenPrepaidList.length === 0) {
        return null;
    }

    return (
        <View>
            {hiddenAccountsList.length > 0 && (
                <>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingVertical: 12,
                        marginBottom: 4,
                        paddingHorizontal: 16
                    }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                            {t('products.holders.accounts.hiddenAccounts')}
                        </Text>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => setCollapsedAccounts(!collapsedAccounts)}
                        >
                            <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                                {collapsedAccounts ? t('common.show') : t('common.hide')}
                            </Text>
                        </Pressable>
                    </View>
                    <AnimatedChildrenCollapsible
                        showDivider={false}
                        collapsed={collapsedAccounts}
                        // re-map to add height correction for accounts with no cards
                        items={hiddenAccountsList.map((item) => {
                            return { ...item, height: item.cards.length > 0 ? 122 : 86 }
                        })}
                        itemHeight={122}
                        style={{ gap: 16, paddingHorizontal: 16 }}
                        renderItem={(item, index) => {
                            return (
                                <HoldersAccountItem
                                    key={`card-${index}`}
                                    account={item}
                                    first={index === 0}
                                    hidden={true}
                                    last={index === hiddenAccountsList.length - 1}
                                    rightAction={() => markAccount(item.id, false)}
                                    rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                                    single={hiddenAccountsList.length === 1}
                                    style={{ flex: undefined }}
                                    isTestnet={network.isTestnet}
                                    holdersAccStatus={holdersAccStatus}
                                    hideCardsIfEmpty
                                />
                            )
                        }}
                    />
                </>
            )}
            {hiddenPrepaidList.length > 0 && (
                <>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingVertical: 12,
                        marginBottom: 4,
                        paddingHorizontal: 16
                    }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                            {t('products.holders.accounts.hiddenCards')}
                        </Text>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => setCollapsedPrepaid(!collapsedPrepaid)}
                        >
                            <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                                {collapsedPrepaid ? t('common.show') : t('common.hide')}
                            </Text>
                        </Pressable>
                    </View>
                    <AnimatedChildrenCollapsible
                        showDivider={false}
                        collapsed={collapsedPrepaid}
                        items={hiddenPrepaidList}
                        itemHeight={84}
                        style={{ gap: 16, paddingHorizontal: 16 }}
                        renderItem={(item, index) => {
                            return (
                                <HoldersPrepaidCard
                                    key={`card-${index}`}
                                    card={item}
                                    first={index === 0}
                                    hidden={true}
                                    last={index === hiddenPrepaidList.length - 1}
                                    rightAction={() => markPrepaidCard(item.id, false)}
                                    rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                                    single={hiddenPrepaidList.length === 1}
                                    style={{ paddingVertical: 0 }}
                                    isTestnet={network.isTestnet}
                                    holdersAccStatus={holdersAccStatus}
                                />
                            )
                        }}
                        limitConfig={{
                            maxItems: 4,
                            fullList: { type: 'holders-cards' }
                        }}
                    />
                </>
            )}
        </View>
    );
})