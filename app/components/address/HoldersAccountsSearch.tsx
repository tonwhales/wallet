import React from "react";
import { memo, useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { useHoldersAccountStatus, useNetwork } from "../../engine/hooks";
import { t } from "../../i18n/t";
import { useDebouncedValue } from "../../utils/useDebouncedValue";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../styles";
import { getAccountName } from "../../utils/holders/getAccountName";
import { AddressSearchItem, SolanaAddressSearchItem } from "./AddressSearch";
import { HoldersAccountItem } from "../products/HoldersAccountItem";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { Address } from "@ton/core";
import { hasDirectSolanaDeposit } from "../../utils/holders/hasDirectDeposit";

type TonHoldersSearchItem = AddressSearchItem & { acc: GeneralHoldersAccount };
type SolanaHoldersSearchItem = { acc: GeneralHoldersAccount, type: 'solana', searchable: string };
type HoldersSearchItem = TonHoldersSearchItem | SolanaHoldersSearchItem;

export const HoldersAccountsSearch = memo(({
    query,
    onSelect,
    onSolanaSelect,
    theme,
    holdersAccounts,
    owner,
    isLedger
}: {
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    onSolanaSelect?: (item: SolanaAddressSearchItem) => void,
    theme: ThemeType,
    holdersAccounts?: GeneralHoldersAccount[],
    owner: Address,
    isLedger?: boolean
}) => {
    const { isTestnet } = useNetwork();
    const debouncedQuery = useDebouncedValue(query?.toLowerCase(), 30);
    const holdersAccStatus = useHoldersAccountStatus(owner).data;

    const searchItems: HoldersSearchItem[] = useMemo(() => {
        return (holdersAccounts || [])
            .filter((a) => !!a.address)
            .map((acc): HoldersSearchItem => {
                const title = getAccountName(acc.type, acc.accountIndex, acc.name);
                const searchable = `${title.toLowerCase()} ${acc.address!.toLowerCase()}`;

                // Check if it's a Solana account
                if (hasDirectSolanaDeposit(acc)) {
                    return {
                        type: 'solana',
                        searchable,
                        acc
                    };
                }

                // TON account logic
                const address = Address.parse(acc.address!!);
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
                <View style={{ gap: 16 }}>
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold17_24]}>
                        {t('products.holders.accounts.title')}
                    </Text>
                    <View style={{ borderRadius: 20, gap: 16 }}>
                        {filtered.map((item, index) => {
                            const onOpen = () => {
                                if ('addr' in item && item.type === 'holders') {
                                    // TON holders account - pass to onSelect
                                    onSelect?.(item);
                                } else if (item.type === 'solana' && item.acc.address) {
                                    // Solana holders account - pass to onSolanaSelect
                                    const title = getAccountName(item.acc.type, item.acc.accountIndex, item.acc.name);
                                    onSolanaSelect?.({
                                        address: item.acc.address,
                                        title,
                                        searchable: item.searchable,
                                        type: 'holders',
                                        memo: item.acc.cryptoCurrency.ticker === 'USDC' ? 'Top Up' : undefined
                                    });
                                }
                            };
                            return (
                                <HoldersAccountItem
                                    key={`holders-${item.acc.id}`}
                                    owner={owner}
                                    account={item.acc}
                                    itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                                    style={{ paddingVertical: 0 }}
                                    isTestnet={isTestnet}
                                    hideCardsIfEmpty
                                    holdersAccStatus={holdersAccStatus}
                                    onOpen={onOpen}
                                    addressDescription
                                    isLedger={isLedger}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
            {Platform.OS === 'android' && (<View style={{ height: 56 }} />)}
        </View>
    );
});

HoldersAccountsSearch.displayName = 'HoldersAccountsSearch';