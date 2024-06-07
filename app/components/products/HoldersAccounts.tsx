import { memo, useMemo } from "react";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { View, Text, Image } from "react-native";
import { t } from "../../i18n/t";
import { ThemeType } from "../../engine/state/theme";
import { HoldersAccountItem } from "./HoldersAccountItem";
import { Typography } from "../styles";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { PriceComponent } from "../PriceComponent";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { reduceHoldersBalances } from "../../utils/reduceHoldersBalances";
import { usePrice } from "../../engine/PriceContext";

import IcHide from '@assets/ic-hide.svg';
import IcHolders from '@assets/ic-holders-white.svg';

export const HoldersAccounts = memo(({
    accs,
    theme,
    markAccount,
    isTestnet,
    holdersAccStatus
}: {
    accs: GeneralHoldersAccount[],
    theme: ThemeType,
    markAccount: (cardId: string, hidden: boolean) => void,
    isTestnet: boolean,
    holdersAccStatus?: HoldersAccountStatus
}) => {
    const [price,] = usePrice();

    const totalBalance = useMemo(() => {
        return reduceHoldersBalances(accs, price?.price?.usd ?? 0);
    }, [accs, price?.price?.usd]);

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
                                key={`card-${index}`}
                                account={item}
                                rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                                rightAction={() => markAccount(item.id, true)}
                                style={{ paddingVertical: 0 }}
                                isTestnet={isTestnet}
                                hideCardsIfEmpty
                                holdersAccStatus={holdersAccStatus}
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
            items={accs}
            renderItem={(item, index) => {
                return (
                    <HoldersAccountItem
                        key={`card-${index}`}
                        account={item}
                        rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        rightAction={() => markAccount(item.id, true)}
                        isTestnet={isTestnet}
                        holdersAccStatus={holdersAccStatus}
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
                                <PriceComponent
                                    amount={totalBalance}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        height: undefined
                                    }}
                                    textStyle={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
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
            limitConfig={{
                maxItems: 4,
                fullList: { type: 'holders-accounts' }
            }}
        />
    );
});