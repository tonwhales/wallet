import { memo, useCallback, useMemo } from "react";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { View, Text } from "react-native";
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

const hideIcon = <Image source={require('@assets/ic-hide.png')} style={{ width: 36, height: 36 }} />;

export const HoldersAccounts = memo(({
    owner,
    accs,
    theme,
    markAccount,
    isTestnet,
    holdersAccStatus
}: {
    owner: Address,
    accs: GeneralHoldersAccount[],
    theme: ThemeType,
    markAccount: (cardId: string, hidden: boolean) => void,
    isTestnet: boolean,
    holdersAccStatus?: HoldersAccountStatus
}) => {
    const [price] = usePrice();

    const totalBalance = useMemo(() => {
        return reduceHoldersBalances(accs, price?.price?.usd ?? 0);
    }, [accs, price?.price?.usd]);

    const rightAction = useCallback((item: GeneralHoldersAccount) => {
        markAccount(item.id, true);
    }, []);

    if (accs.length === 0) {
        return null;
    }

    if (accs.length < 3) {
        return (
            <View style={{ paddingHorizontal: 16 }}>
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
                <View style={{ gap: 16, marginTop: 8 }}>
                    {accs.map((item, index) => {
                        return (
                            <HoldersAccountItem
                                owner={owner}
                                key={`card-${index}`}
                                account={item}
                                rightActionIcon={hideIcon}
                                rightAction={rightAction}
                                style={{ paddingVertical: 0 }}
                                isTestnet={isTestnet}
                                hideCardsIfEmpty
                                holdersAccStatus={holdersAccStatus}
                                content={{ type: HoldersItemContentType.BALANCE }}
                            />
                        )
                    })}
                </View>
            </View>
        );
    }

    return (
        <CollapsibleCards
            title={t('products.holders.accounts.title')}
            // re-map to add height correction for accounts with no cards
            items={accs.map((item) => {
                return { ...item, height: item.cards.length > 0 ? 122 : 86 }
            })}
            renderItem={(item, index) => {
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
                )
            }}
            itemHeight={122}
            theme={theme}
            limitConfig={{
                maxItems: 4,
                fullList: { type: 'holders-accounts' }
            }}
        />
    );
});