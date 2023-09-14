import React, { memo, useMemo, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import { HoldersCardItem } from "./HoldersCardItem";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";

import Show from '../../../assets/ic-show.svg';

export const holdersCardImageMap: { [key: string]: any } = {
    'classic': require('../../../assets/classic.png'),
    'black-pro': require('../../../assets/black-pro.png'),
    'whales': require('../../../assets/whales.png'),
}

export const HoldersHiddenCards = memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const accounts = engine.products.holders.useCards();
    const hiddenCards = engine.products.holders.useHiddenCards();
    const hiddenList = useMemo(() => {
        return accounts.filter((item) => {
            return hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    const [collapsed, setCollapsed] = useState(true);

    if (!AppConfig.isTestnet) {
        return null;
    }

    if (hiddenList.length === 0) {
        return null;
    }

    return (
        <View>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                marginTop: 20,
                paddingVertical: 12,
                marginBottom: 4,
                paddingHorizontal: 16
            }}>
                <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: Theme.textPrimary,
                    lineHeight: 24,
                }}>
                    {t('products.zenPay.hiddenCards')}
                </Text>
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1
                        }
                    }}
                    onPress={() => setCollapsed(!collapsed)}
                >
                    <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        lineHeight: 20,
                        color: Theme.accent,
                    }}>
                        {collapsed ? 'Show' : 'Hide'}
                    </Text>
                </Pressable>
            </View>
            <AnimatedChildrenCollapsible
                showDivider={false}
                collapsed={collapsed}
                items={hiddenList}
                renderItem={(item, index) => {
                    return (
                        <HoldersCardItem
                            key={`card-${index}`}
                            account={item}
                            first={index === 0}
                            last={index === hiddenList.length - 1}
                            rightAction={() => engine.products.holders.showCard(item.id)}
                            rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                            single={hiddenList.length === 1}
                        />
                    )
                }}
            />
        </View>
    );
})