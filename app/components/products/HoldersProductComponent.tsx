import React, { memo, useMemo } from "react"
import { HoldersAccountItem } from "./HoldersAccountItem";
import { View, Text, Image } from "react-native";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Typography } from "../styles";
import { useHoldersHiddenPrepaidCards } from "../../engine/hooks/holders/useHoldersHiddenPrepaidCards";

import IcHide from '@assets/ic-hide.svg';
import IcHolders from '@assets/ic-holders-white.svg';

export const HoldersProductComponent = memo(() => {
    const network = useNetwork();
    const theme = useTheme();
    const selected = useSelectedAccount();
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const prePaid = useHoldersAccounts(selected!.address).data?.prepaidCards;

    const [hiddenCards, markCard] = useHoldersHiddenAccounts(selected!.address);
    const [hiddenPrepaidCards, markPrepaidCard] = useHoldersHiddenPrepaidCards(selected!.address);

    const visibleAccountsList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenCards.includes(item.id);
        }).map((item) => ({ ...item, type: 'account' }));
    }, [hiddenCards, accounts]);

    const visiblePrepaidList = useMemo(() => {
        return (prePaid ?? []).filter((item) => {
            return !hiddenPrepaidCards.includes(item.id);
        }).map((item) => ({ card: item, type: 'prepaid' }));
    }, [hiddenPrepaidCards, prePaid]);

    const totalBalance = useMemo(() => {
        return visibleAccountsList?.reduce((acc, item) => {
            return acc + BigInt(item.balance);
        }, BigInt(0));
    }, [visibleAccountsList]);

    if (!visibleAccountsList || visibleAccountsList?.length === 0) {
        return null;
    }

    if ((visibleAccountsList.length + visiblePrepaidList.length) <= 3) {
        return (
            <View style={{ marginBottom: 16, paddingHorizontal: 16, gap: 16 }}>
                <View
                    style={[{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                    }]}
                >
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('products.holders.accounts.title')}
                    </Text>
                </View>
                {visibleAccountsList.map((item, index) => {
                    return (
                        <HoldersAccountItem
                            key={`card-${index}`}
                            account={{ ...item, type: 'account' }}
                            rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                            rightAction={() => markCard(item.id, true)}
                            style={{ paddingVertical: 0 }}
                            isTestnet={network.isTestnet}
                        />
                    )
                })}
                {visiblePrepaidList.map((item, index) => {
                    return (
                        <HoldersAccountItem
                            key={`card-${index}`}
                            account={{ ...item, type: 'prepaid' }}
                            rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                            rightAction={() => markPrepaidCard(item.card.id, true)}
                            style={{ paddingVertical: 0 }}
                            isTestnet={network.isTestnet}
                        />
                    )
                })}
            </View>
        )
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <CollapsibleCards
                title={t('products.holders.accounts.title')}
                items={[...visibleAccountsList, ...visiblePrepaidList]}
                renderItem={(item, index) => {
                    const rightAction = item.type === 'account'
                        ? () => markCard(item.id, true)
                        : () => markPrepaidCard(item.card.id, true);
                    return (
                        <HoldersAccountItem
                            key={`card-${index}`}
                            account={item}
                            rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                            rightAction={rightAction}
                            isTestnet={network.isTestnet}
                        />
                    )
                }}
                renderFace={() => {
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
                                <View
                                    style={{
                                        position: 'absolute', bottom: -2, right: -2,
                                        width: 20, height: 20,
                                        borderRadius: 10,
                                        backgroundColor: theme.surfaceOnBg,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <View style={{
                                        backgroundColor: theme.accent,
                                        width: 17, height: 17,
                                        borderRadius: 9,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <IcHolders
                                            height={12}
                                            width={12}
                                            color={theme.white}
                                        />
                                    </View>
                                </View>
                            </View>
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                <PerfText
                                    style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
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
                                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                        <ValueComponent value={totalBalance} precision={2} />
                                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                            {' TON'}
                                        </Text>
                                    </Text>
                                    <PriceComponent
                                        amount={totalBalance}
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
                    )
                }}
                itemHeight={122}
                theme={theme}
            />
        </View>
    );
})