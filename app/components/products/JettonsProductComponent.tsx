import React, { memo } from "react";
import { View, Image, Text } from "react-native";
import { JettonProductItem } from "./JettonProductItem";
import { useMarkJettonDisabled } from "../../engine/hooks/jettons/useMarkJettonDisabled";
import { useTheme } from "../../engine/hooks";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { t } from "../../i18n/t";
import { Typography } from "../styles";
import { Jetton } from "../../engine/types";

import IcHide from '@assets/ic-hide.svg';

export const JettonsProductComponent = memo(({ jettons }: { jettons: Jetton[] }) => {
    const theme = useTheme();
    const markJettonDisabled = useMarkJettonDisabled();
    const visibleList = jettons.filter((j) => !j.disabled).filter((j) => j.balance > 0);

    if (visibleList.length === 0) {
        return null;
    }

    if (visibleList.length < 3) {
        return (
            <View style={{ marginBottom: visibleList.length > 0 ? 16 : 0 }}>
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
                {visibleList.map((j, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toString()}
                            jetton={j}
                            first={index === 0}
                            last={index === visibleList.length - 1}
                            rightAction={() => markJettonDisabled(j.master)}
                            rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                            single={visibleList.length === 1}
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
                items={visibleList}
                renderItem={(j) => {
                    if (!j) {
                        return null;
                    }
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toString()}
                            jetton={j}
                            rightAction={() => markJettonDisabled(j.master)}
                            rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                            card
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
                    maxItems: 10,
                    fullList: { type: 'jettons' }
                }}
            />
        </View>
    );
});
JettonsProductComponent.displayName = 'JettonsProductComponent';