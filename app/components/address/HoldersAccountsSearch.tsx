import React from "react";
import { memo, useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { useHoldersAccountStatus, useNetwork } from "../../engine/hooks";
import { t } from "../../i18n/t";
import { useDebouncedValue } from "../../utils/useDebouncedValue";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../styles";
import { getAccountName } from "../../utils/holders/getAccountName";
import { AddressSearchItem } from "./AddressSearch";
import { HoldersAccountItem } from "../products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { Address } from "@ton/core";

type HoldersSearchItem = AddressSearchItem & { acc: GeneralHoldersAccount };

export const HoldersAccountsSearch = memo(({
    query,
    onSelect,
    theme,
    holdersAccounts,
    owner,
}: {
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    theme: ThemeType,
    holdersAccounts?: GeneralHoldersAccount[],
    owner: Address,
}) => {
    const { isTestnet } = useNetwork();
    const debouncedQuery = useDebouncedValue(query?.toLowerCase(), 500);
    const holdersAccStatus = useHoldersAccountStatus(owner).data;

    const searchItems: HoldersSearchItem[] = useMemo(() => {
        return (holdersAccounts || [])
            .filter((a) => !!a.address)
            .map((acc) => {
                const title = getAccountName(acc.accountIndex, acc.name);
                const address = Address.parse(acc.address!!);
                const searchable = `${title.toLowerCase()} ${acc.address!.toLowerCase()}`;
                let memo: string | undefined = undefined;

                if (acc.cryptoCurrency.ticker === 'TON') {
                    memo = 'Top Up';
                }

                return {
                    type: 'holders',
                    addr: {
                        isBounceable: true,
                        isTestOnly: isTestnet,
                        address
                    },
                    title,
                    searchable,
                    memo,
                    acc
                }
            });
    }, [isTestnet, holdersAccounts]);

    const filtered = useMemo(() => {
        if (!debouncedQuery || debouncedQuery.length === 0) {
            return searchItems;
        }

        return searchItems.filter((i) => i.searchable.includes(debouncedQuery))
    }, [searchItems, debouncedQuery]);

    if (!filtered || filtered.length === 0) {
        return null;
    }

    return (
        <View style={{ marginTop: 16 }}>
            <View style={{
                borderRadius: 20,
                padding: 2
            }}>
                <Text style={[{
                    color: theme.textPrimary,
                    marginBottom: 12,
                    marginTop: 8
                }, Typography.semiBold17_24]}>
                    {t('products.holders.accounts.title')}
                </Text>
                <View style={{
                    borderRadius: 18,
                    gap: 4
                }}>
                    {filtered.map((item, index) => {
                        const onOpen = () => onSelect?.(item);
                        return (
                            <HoldersAccountItem
                                key={`holders-${index}`}
                                owner={owner}
                                account={item.acc}
                                itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                                style={{ paddingVertical: 0 }}
                                isTestnet={isTestnet}
                                hideCardsIfEmpty
                                holdersAccStatus={holdersAccStatus}
                                onOpen={onOpen}
                                addressDescription
                            />
                        );
                    })}
                </View>
            </View>
            {Platform.OS === 'android' && (<View style={{ height: 56 }} />)}
        </View>
    );
});

HoldersAccountsSearch.displayName = 'HoldersAccountsSearch';