import React, { memo, useMemo, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { t } from "../../i18n/t";
import { HoldersAccountItem } from "./HoldersAccountItem";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";

import Show from '@assets/ic-show.svg';

export const holdersCardImageMap: { [key: string]: any } = {
    'classic': require('@assets/holders/classic.png'),
    'black-pro': require('@assets/holders/black-pro.png'),
    'whales': require('@assets/holders/whales.png'),
}

export const HoldersHiddenAccounts = memo(() => {
    const theme = useTheme();
    const network = useNetwork();
    const selected = useSelectedAccount();
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const [hiddenAccounts, markCard] = useHoldersHiddenAccounts(selected!.address);
    const hiddenList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return hiddenAccounts.includes(item.id);
        });
    }, [hiddenAccounts, accounts]);

    const [collapsed, setCollapsed] = useState(true);

    if (!network.isTestnet) {
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
                    color: theme.textPrimary,
                    lineHeight: 24,
                }}>
                    {t('products.holders.hiddenCards')}
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
                        color: theme.accent,
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
                        <HoldersAccountItem
                            key={`card-${index}`}
                            account={item}
                            first={index === 0}
                            hidden={true}
                            last={index === hiddenList.length - 1}
                            rightAction={() => markCard(item.id, false)}
                            rightActionIcon={<Show height={36} width={36} style={{ width: 36, height: 36 }} />}
                            single={hiddenList.length === 1}
                        />
                    )
                }}
            />
        </View>
    );
})