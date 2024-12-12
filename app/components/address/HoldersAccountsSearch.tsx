import React from "react";
import { memo, useMemo } from "react";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { Platform, Text, View } from "react-native";
import { useNetwork, useWalletsSettings } from "../../engine/hooks";
import { t } from "../../i18n/t";
import { useDebouncedValue } from "../../utils/useDebouncedValue";
import { ThemeType } from "../../engine/state/theme";
import { HoldersAccountTarget } from "../../engine/hooks/holders/useHoldersAccountTrargets";
import { Typography } from "../styles";
import { getAccountName } from "../../utils/holders/getAccountName";
import { AddressSearchItem } from "./AddressSearch";

export const HoldersAccountsSearch = memo(({
    query,
    onSelect,
    transfer,
    theme,
    holdersAccounts
}: {
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    transfer?: boolean,
    theme: ThemeType,
    holdersAccounts?: HoldersAccountTarget[]
}) => {
    const network = useNetwork();
    const [walletsSettings] = useWalletsSettings();
    const debouncedQuery = useDebouncedValue(query?.toLowerCase(), 500);

    const searchItems = useMemo(() => {
        return {
            holders: (holdersAccounts || []).map((acc) => {
                const title = getAccountName(acc.accountIndex, acc.name);
                const searchable = `${title.toLowerCase()} ${acc.address.toString({ testOnly: network.isTestnet }).toLowerCase()}`;

                return {
                    type: 'holders',
                    addr: {
                        isBounceable: true,
                        isTestOnly: network.isTestnet,
                        address: acc.address
                    },
                    title,
                    searchable,
                    memo: acc.memo
                }
            }) as AddressSearchItem[],
        };
    }, [network, holdersAccounts]);

    const filtered = useMemo(() => {
        if (!debouncedQuery || debouncedQuery.length === 0) {
            return searchItems.holders;
        }

        return searchItems.holders.filter((i) => i.searchable.includes(debouncedQuery))
    }, [searchItems, debouncedQuery]);

    if (!filtered || filtered.length === 0) {
        return null;
    }

    return (
        <View style={{ marginTop: 16 }}>
            <View style={transfer ? {
                borderRadius: 20,
                backgroundColor: theme.surfaceOnElevation,
                padding: 2
            } : undefined}>
                <Text style={[{
                    color: theme.textPrimary,
                    marginBottom: 12,
                    marginLeft: transfer ? 16 : 0,
                    marginTop: transfer ? 16 : 0
                }, Typography.semiBold17_24]}>
                    {t('products.holders.accounts.title')}
                </Text>
                <View style={transfer ? {
                    backgroundColor: theme.elevation,
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 8
                } : undefined}>
                    {filtered.map((item, index) => {
                        return (
                            <AddressSearchItemView
                                key={index}
                                item={item}
                                onPress={onSelect}
                                walletsSettings={walletsSettings}
                                testOnly={network.isTestnet}
                                theme={theme}
                                knownWallets={{}}
                            />
                        );
                    })}
                </View>
            </View>
            {Platform.OS === 'android' && (
                <View style={{ height: 56 }} />
            )}
        </View>
    );
});

HoldersAccountsSearch.displayName = 'HoldersAccountsSearch';