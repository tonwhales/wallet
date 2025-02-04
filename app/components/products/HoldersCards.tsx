import { memo, useCallback, useMemo } from "react";
import { PrePaidHoldersCard } from "../../engine/api/holders/fetchAccounts";
import { ThemeType } from "../../engine/state/theme";
import { View, Text } from "react-native";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { HoldersPrepaidCard } from "./HoldersPrepaidCard";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { PriceComponent } from "../PriceComponent";
import { toNano } from "@ton/core";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { Image } from "expo-image";

const hideIcon = <Image source={require('@assets/ic-hide.png')} style={{ width: 36, height: 36 }} />;

export const HoldersCards = memo(({
    cards,
    theme,
    isTestnet,
    markPrepaidCard,
    holdersAccStatus,
    isLedger
}: {
    cards?: PrePaidHoldersCard[],
    theme: ThemeType,
    isTestnet: boolean,
    markPrepaidCard: (cardId: string, hidden: boolean) => void,
    holdersAccStatus?: HoldersAccountStatus,
    isLedger?: boolean
}) => {
    const totalBalance = useMemo(() => {
        const float = cards?.reduce((acc, item) => {
            try {
                const cardBalance = parseFloat(item.fiatBalance);
                return acc + cardBalance;
            } catch (error) {
                return acc;
            }
        }, 0);

        return toNano((float ?? 0).toFixed(2));
    }, [cards]);

    const renderItem = useCallback((item: PrePaidHoldersCard, index: number) => {
        return (
            <HoldersPrepaidCard
                key={`card-${index}`}
                card={item}
                rightActionIcon={hideIcon}
                rightAction={() => markPrepaidCard(item.id, true)}
                style={{ paddingVertical: 0 }}
                isTestnet={isTestnet}
                holdersAccStatus={holdersAccStatus}
                isLedger={isLedger}
            />
        );
    }, [isLedger, markPrepaidCard, isTestnet, holdersAccStatus]);

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
                        style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {t('products.holders.accounts.prepaidTitle')}
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
                            priceUSD={1}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined
                            }}
                            textStyle={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                            currencyCode={cards?.[0].fiatCurrency}
                            theme={theme}
                        />
                    </View>
                )}
            </View>
        )
    }, [totalBalance, theme]);

    if (!cards || cards.length === 0) {
        return null;
    }

    if (cards.length < 3) {
        return (
            <View style={{ paddingHorizontal: 16 }}>
                <View
                    style={[{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                    }]}
                >
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('products.holders.accounts.prepaidTitle')}
                    </Text>
                </View>
                <View style={{ gap: 16, marginTop: 8 }}>
                    {cards.map((item, index) => {
                        return (
                            <HoldersPrepaidCard
                                key={`card-${index}`}
                                card={item}
                                rightActionIcon={hideIcon}
                                rightAction={() => markPrepaidCard(item.id, true)}
                                style={{ paddingVertical: 0 }}
                                isTestnet={isTestnet}
                                holdersAccStatus={holdersAccStatus}
                                isLedger={isLedger}
                            />
                        )
                    })}
                </View>
            </View>
        );
    }



    return (
        <CollapsibleCards
            title={t('products.holders.accounts.prepaidTitle')}
            items={cards}
            renderItem={renderItem}
            renderFace={renderFace}
            itemHeight={84}
            theme={theme}
            limitConfig={{
                maxItems: 4,
                fullList: { type: 'holders-cards' }
            }}
        />
    );
});