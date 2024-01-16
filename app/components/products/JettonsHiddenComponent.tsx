import React, { memo, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { JettonProductItem } from "./JettonProductItem";
import { useJettons, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useMarkJettonActive } from "../../engine/hooks/jettons/useMarkJettonActive";
import { Typography } from "../styles";

import Show from '@assets/ic-show.svg';

export const JettonsHiddenComponent = memo(() => {
    const theme = useTheme();
    const markJettonActive = useMarkJettonActive();
    const selected = useSelectedAccount();
    const jettons = useJettons(selected!.addressString);
    const hiddenList = jettons.filter((j: any) => j.disabled);
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
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toString()}
                            jetton={j}
                            first={index === 0}
                            last={index === hiddenList.length - 1}
                            rightAction={() => markJettonActive(j.master)}
                            rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                            single={hiddenList.length === 1}
                        />
                    )
                }}
            />
        </View>
    );
})