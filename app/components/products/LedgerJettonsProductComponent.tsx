import React, { memo } from "react";
import { View, Text, Image } from "react-native";
import { JettonProductItem } from "./JettonProductItem";
import { t } from "../../i18n/t";
import { useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { useSortedHints } from "../../engine/hooks/jettons/useSortedHints";

export const LedgerJettonsProductComponent = memo(({ address, testOnly }: { address: Address, testOnly: boolean }) => {
    const theme = useTheme();
    const hints = useSortedHints(address.toString({ testOnly }));
    const jettons = hints
        .map((s) => {
            try {
                let wallet = Address.parse(s);
                return wallet;
            } catch {
                return null;
            }
        })
        .filter((j) => !!j) as Address[];

    if (jettons.length === 0) {
        return null;
    }

    if (jettons.length < 3) {
        return (
            <View style={{ marginBottom: jettons.length > 0 ? 16 : 0 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        marginBottom: 4
                    }}
                >
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('jetton.productButtonTitle')}
                    </Text>
                </View>
                {jettons.map((j, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + j.toString({ testOnly })}
                            wallet={j}
                            first={index === 0}
                            last={index === jettons.length - 1}
                            single={jettons.length === 1}
                            ledger
                            owner={address}
                        />
                    )
                })}
            </View>
        )
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <CollapsibleCards
                title={t('jetton.productButtonTitle')}
                items={jettons}
                renderItem={(j) => {
                    return !j ? null : (
                        <JettonProductItem
                            key={'jt' + j.toString({ testOnly })}
                            wallet={j}
                            card
                            ledger
                            owner={address}
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
                                    source={require('@assets/ic-coins.png')}
                                    style={{ width: 46, height: 46, borderRadius: 23 }}
                                />
                            </View>
                            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                                <PerfText
                                    style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {t('jetton.productButtonTitle')}
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
                        </View>
                    )
                }}
                itemHeight={86}
                theme={theme}
                limitConfig={{
                    maxItems: 4,
                    fullList: { type: 'jettons', isLedger: true }
                }}
            />
        </View>
    );
});