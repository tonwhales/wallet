import React, { memo, useCallback, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { JettonProductItem } from "./JettonProductItem";
import { useHintsFull, useLedgerHiddenJettons, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { Address } from "@ton/core";
import { Image } from "expo-image";
import { AssetViewType } from "../../fragments/wallet/AssetsFragment";
import { JettonFull } from "../../engine/api/fetchHintsFull";
import { ASSET_ITEM_HEIGHT } from "../../utils/constants";

const showIcon = <Image source={require('@assets/ic-show.png')} style={{ width: 36, height: 36 }} />;

export const LedgerJettonsHiddenComponent = memo(({ address, testOnly }: { address: Address, testOnly: boolean }) => {
    const theme = useTheme();
    const [hiddenLedgerJettons, markLedgerJettonHidden] = useLedgerHiddenJettons();

    const hints = useHintsFull(address.toString({ testOnly })).data?.hints ?? [];

    const hiddenList = hints
        .filter((s) => !!hiddenLedgerJettons[s.jetton.address])

    const [collapsed, setCollapsed] = useState(true);

    const toggle = () => setCollapsed((prev) => !prev);

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
                rightAction={() => markLedgerJettonHidden(h.jetton.address, false)}
                rightActionIcon={showIcon}
                single={hiddenList.length === 1}
                owner={address}
                card
                jettonViewType={AssetViewType.Default}
            />
        )
    }, [showIcon, hiddenList, markLedgerJettonHidden, address]);

    if (hiddenList.length === 0) {
        return null;
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <Pressable
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingVertical: 12,
                    marginBottom: 4,
                    paddingHorizontal: 16,
                    opacity: pressed ? 0.5 : 1
                })}
                onPress={toggle}
            >
                <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                    {t('jetton.hidden')}
                </Text>
                <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                    {collapsed ? t('common.show') : t('common.hide')}
                </Text>
            </Pressable>
            <AnimatedChildrenCollapsible
                showDivider={false}
                collapsed={collapsed}
                items={hiddenList}
                itemHeight={ASSET_ITEM_HEIGHT}
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
LedgerJettonsHiddenComponent.displayName = 'LedgerJettonsHiddenComponent';