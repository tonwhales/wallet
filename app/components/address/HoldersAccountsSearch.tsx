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
import Animated from "react-native-reanimated";

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
    const debouncedQuery = useDebouncedValue(query?.toLowerCase(), 30);
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

    const isEmpty = !filtered || filtered.length === 0;

    return (
        <View style={{ marginTop: 16 }}>
            {!isEmpty && (
                <Animated.View
                    style={{ gap: 16 }}
                // entering={FadeInDown}
                // exiting={FadeOutDown}
                >
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold17_24]}>
                        {t('products.holders.accounts.title')}
                    </Text>
                    <View style={{ borderRadius: 20, gap: 16 }}>
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
                </Animated.View>
            )}
            {Platform.OS === 'android' && (<View style={{ height: 56 }} />)}
        </View>
    );
});

HoldersAccountsSearch.displayName = 'HoldersAccountsSearch';