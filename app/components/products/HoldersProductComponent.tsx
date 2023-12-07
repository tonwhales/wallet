import React, { memo, useMemo } from "react"
import { HoldersAccountItem } from "./HoldersAccountItem";
import { View, Text, Image } from "react-native";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";

import Hide from '@assets/ic-hide.svg';
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { t } from "../../i18n/t";
import { PerfText } from "../basic/PerfText";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Typography } from "../styles";

export const HoldersProductComponent = memo(() => {
    const network = useNetwork();
    const theme = useTheme();
    const selected = useSelectedAccount();
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const [hiddenCards, markCard] = useHoldersHiddenAccounts(selected!.address);
    const visibleList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);
    const totalBalance = useMemo(() => {
        return visibleList.reduce((acc, item) => {
            return acc + BigInt(item.balance);
        }, BigInt(0));
    }, [visibleList]);

    if (!network.isTestnet) {
        return null;
    }

    if (!accounts || accounts?.length === 0) {
        return null;
    }

    if (visibleList.length <= 3) {
        return (
            <View style={{ marginBottom: 16 }}>
                {visibleList.map((item, index) => {
                    return (
                        <HoldersAccountItem
                            key={`card-${index}`}
                            account={item}
                        />
                    )
                })}
            </View>
        )
    }

    return (
        <View style={{ marginBottom: visibleList.length > 0 ? 16 : 0 }}>
            <CollapsibleCards
                title={t('products.holders.accounts.title')}
                items={visibleList}
                renderItem={(item, index) => {
                    return (
                        <HoldersAccountItem
                            key={`card-${index}`}
                            account={item}
                        />
                    )
                }}
                renderFace={() => {
                    return (
                        <View style={{
                            flexGrow: 1, flexDirection: 'row',
                            padding: 20,
                            marginHorizontal: 16,
                            borderRadius: 20,
                            alignItems: 'center',
                            backgroundColor: theme.surfaceOnBg,
                        }}>
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
                                    {t('products.holders.accounts.title')}
                                </PerfText>
                                <PerfText
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                    style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {'Show more'}
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
                itemHeight={126}
                theme={theme}
            />
        </View>
    );
})