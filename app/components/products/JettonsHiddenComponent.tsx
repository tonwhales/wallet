import React, { memo, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { JettonProductItem } from "./JettonProductItem";
import { useCloudValue, useHints, useNetwork, useTheme } from "../../engine/hooks";
import { useMarkJettonActive } from "../../engine/hooks/jettons/useMarkJettonActive";
import { Typography } from "../styles";
import { Address } from "@ton/core";

import Show from '@assets/ic-show.svg';

export const JettonsHiddenComponent = memo(({ owner }: { owner: Address }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const markJettonActive = useMarkJettonActive();
    const hints = useHints(owner.toString({ testOnly }))
    let [disabledState,] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const hiddenList = hints
        .filter((s) => !!disabledState.disabled[s])
        .map((s) => {
            try {
                let wallet = Address.parse(s);
                return wallet;
            } catch {
                return null;
            }
        })
        .filter((j) => !!j) as Address[];

    const [collapsed, setCollapsed] = useState(true);

    if (hiddenList.length === 0) {
        return null;
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 12,
                marginBottom: 4,
                paddingHorizontal: 16,
            }}>
                <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                    {t('jetton.hidden')}
                </Text>
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1
                        }
                    }}
                    onPress={() => setCollapsed(!collapsed)}
                >
                    <Text style={[{ color: theme.accent }, Typography.medium17_24]}>
                        {collapsed ? t('common.show') : t('common.hide')}
                    </Text>
                </Pressable>
            </View>
            <AnimatedChildrenCollapsible
                showDivider={false}
                collapsed={collapsed}
                items={hiddenList}
                renderItem={(j, index) => {
                    const length = hiddenList.length >= 4 ? 4 : hiddenList.length;
                    const isLast = index === length - 1;
                    return (
                        <JettonProductItem
                            key={'hidden-jt' + j.toString({ testOnly })}
                            wallet={j}
                            first={index === 0}
                            last={isLast}
                            rightAction={() => markJettonActive(j)}
                            rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                            single={hiddenList.length === 1}
                            owner={owner}
                        />
                    )
                }}
                limitConfig={{
                    maxItems: 4,
                    fullList: { type: 'jettons' }
                }}
            />
        </View>
    );
});
JettonsHiddenComponent.displayName = 'JettonsHiddenComponent';