import React, { memo, useCallback, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { JettonProductItem } from "./JettonProductItem";
import { useCloudValue, useHintsFull, useNetwork, useTheme } from "../../engine/hooks";
import { useMarkJettonActive } from "../../engine/hooks/jettons/useMarkJettonActive";
import { Typography } from "../styles";
import { Address } from "@ton/core";
import { Image } from "expo-image";
import { JettonViewType } from "../../fragments/wallet/AssetsFragment";
import { JettonFull } from "../../engine/api/fetchHintsFull";

const showIcon = <Image source={require('@assets/ic-show.png')} style={{ width: 36, height: 36 }} />;

export const JettonsHiddenComponent = memo(({ owner }: { owner: Address }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const markJettonActive = useMarkJettonActive();
    const hints = useHintsFull(owner.toString({ testOnly })).data?.hints ?? [];
    let [disabledState] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const hiddenList = hints
        .filter((s) => !!disabledState.disabled[s.jetton.address])

    const [collapsed, setCollapsed] = useState(true);

    const renderItem = useCallback((h: JettonFull, index: number) => {
        const length = hiddenList.length >= 4 ? 4 : hiddenList.length;
        const isLast = index === length - 1;
        return (
            <JettonProductItem
                key={'hidden-jt' + h.jetton.address}
                hint={h}
                first={index === 0}
                last={isLast}
                itemStyle={{ borderRadius: 20 }}
                rightAction={() => markJettonActive(Address.parse(h.jetton.address))}
                rightActionIcon={showIcon}
                single={hiddenList.length === 1}
                owner={owner}
                card
                jettonViewType={JettonViewType.Default}
            />
        )
    }, [showIcon, hiddenList, markJettonActive, owner]);

    if (hiddenList.length === 0) {
        return null;
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <Pressable style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 12,
                marginBottom: 4,
                paddingHorizontal: 16,
                opacity: pressed ? 0.5 : 1
            })}
                onPress={() => setCollapsed(!collapsed)}
            >
                <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                    {t('jetton.hidden')}
                </Text>
                <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                    {collapsed ? t('common.show') : t('common.hide')}
                </Text>
            </Pressable>
            <AnimatedChildrenCollapsible
                showDivider={false}
                collapsed={collapsed}
                items={hiddenList}
                itemHeight={86}
                style={{ gap: 16, paddingHorizontal: 16 }}
                renderItem={renderItem}
                limitConfig={{
                    maxItems: 4,
                    fullList: { type: 'jettons' }
                }}
            />
        </View>
    );
});
JettonsHiddenComponent.displayName = 'JettonsHiddenComponent';