import React from "react";
import { memo, useMemo } from "react";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { Platform, Text, View } from "react-native";
import { Address } from "@ton/core";
import { useNetwork, usePeparedMessages, useWalletsSettings } from "../../engine/hooks";
import { KnownWallet } from "../../secure/KnownWallets";
import { t } from "../../i18n/t";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { useDebouncedValue } from "../../utils/useDebouncedValue";
import { TonTransaction } from "../../engine/types";
import { ThemeType } from "../../engine/state/theme";
import { useGaslessConfig } from "../../engine/hooks/jettons/useGaslessConfig";
import { HoldersAccountTarget } from "../../engine/hooks/holders/useHoldersAccountTrargets";
import { Typography } from "../styles";
import { getAccountName } from "../../utils/holders/getAccountName";

export type AddressSearchItem = {
    addr: {
        isBounceable: boolean;
        isTestOnly: boolean;
        address: Address;
    },
    title: string,
    searchable: string,
    type: 'contact' | 'known' | 'unknown' | 'own' | 'holders',
    icon?: string,
    isLedger?: boolean,
    known?: boolean,
    memo?: string
};

export const AddressSearch = memo(({
    query,
    onSelect,
    transfer,
    myWallets,
    bounceableFormat,
    knownWallets,
    lastTwoTxs,
    theme,
    holdersAccounts
}: {
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    transfer?: boolean,
    myWallets: {
        address: Address;
        addressString: string;
        index: number;
    }[],
    bounceableFormat: boolean,
    knownWallets: { [key: string]: KnownWallet },
    lastTwoTxs: TonTransaction[],
    theme: ThemeType,
    holdersAccounts?: HoldersAccountTarget[]
}) => {
    const network = useNetwork();
    const addressBook = useAddressBookContext().state;
    const contacts = addressBook.contacts;
    const gaslessConfig = useGaslessConfig();
    const [walletsSettings] = useWalletsSettings();
    const debouncedQuery = useDebouncedValue(query?.toLowerCase(), 500);
    const preparedMessages = usePeparedMessages(lastTwoTxs.flatMap((t) => t.base.outMessages), network.isTestnet)

    const lastTxs = useMemo(() => {
        const addresses = new Set<string>();

        preparedMessages.forEach((msg) => {
            try {
                addresses.add(msg.friendlyTarget);
            } catch { }
        });

        const parsed = Array.from(addresses).map((a) => {
            try {
                const parsed = Address.parseFriendly(a);

                const isGasProxy = parsed.address.equals(Address.parse('UQBGOzawW2QtzY54knlrS_Plqmfxxz7sdtS-b8LgvN2zkR4_'));
                let isRelay = false;

                if (!!gaslessConfig.data?.relay_address) {
                    isRelay = parsed.address.equals(Address.parse(gaslessConfig.data.relay_address));
                }

                if (isGasProxy || isRelay) {
                    return null;
                }

                return parsed;
            } catch {
                return null;
            }
        }).filter((a) => !!a) as { isBounceable: boolean; isTestOnly: boolean; address: Address; }[];

        return parsed;
    }, [preparedMessages, gaslessConfig]);

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
            own: myWallets.map((acc) => {
                const walletSettings = walletsSettings[acc.addressString];
                let title = `${t('common.wallet')} ${acc.index + 1}`;

                if (acc.index === -2) {
                    title = 'Ledger';
                }
                
                if (walletSettings?.name) {
                    title = walletSettings.name;
                }

                let addr: {
                    isBounceable: boolean;
                    isTestOnly: boolean;
                    address: Address;
                };
                try {
                    addr = Address.parseFriendly(acc.address.toString({ testOnly: network.isTestnet, bounceable: bounceableFormat }));
                } catch (error) {
                    return null
                }

                const searchable = `${title} ${acc.address.toString({ testOnly: network.isTestnet, bounceable: bounceableFormat })}`.toLowerCase();

                return {
                    type: 'own',
                    addr, title, searchable, walletSettings,
                    isLedger: acc.index === -2 ? true : undefined
                }
            }).filter((i) => !!i) as AddressSearchItem[],
            contact: Object.entries(contacts).map(([key, contact]) => {
                let addr: {
                    isBounceable: boolean;
                    isTestOnly: boolean;
                    address: Address;
                };
                try {
                    addr = Address.parseFriendly(key);
                } catch {
                    return null
                }
                const name = contact.name;
                const lastName = contact.fields?.find((f) => f.key === 'lastName')?.value
                const title = `${name}${lastName ? ` ${lastName}` : ''}`;
                const searchable = `${title} ${key}`.toLowerCase();
                return { type: 'contact', addr, title, searchable };
            }).filter((i) => !!i) as AddressSearchItem[],
            known: Object.entries(knownWallets).map(([key, known]) => {
                let addr: {
                    isBounceable: boolean;
                    isTestOnly: boolean;
                    address: Address;
                };
                try {
                    addr = Address.parseFriendly(key);
                } catch (error) {
                    return null
                }
                const title = known.name;
                const searchable = `${title} ${addr.address.toString({ testOnly: network.isTestnet, bounceable: addr.isBounceable })}`.toLowerCase();

                return { type: 'known', addr, title, searchable, icon: known.ic };
            }).filter((i) => !!i) as AddressSearchItem[]
        };
    }, [contacts, knownWallets, bounceableFormat, network]);

    const filtered = useMemo(() => {
        if (!debouncedQuery || debouncedQuery.length === 0) {
            return {
                recent: lastTxs,
                searchRes: searchItems.contact,
                myWallets: searchItems.own,
                holders: searchItems.holders
            };
        }

        const searchRes = [...searchItems.contact, ...searchItems.known].filter((i) => i.searchable.includes(debouncedQuery));

        return {
            recent: lastTxs.filter((a) => a.address.toString({ testOnly: network.isTestnet, bounceable: a.isBounceable }).includes(debouncedQuery)),
            searchRes: searchRes,
            myWallets: searchItems.own.filter((i) => i.searchable.includes(debouncedQuery)),
            holders: searchItems.holders.filter((i) => i.searchable.includes(debouncedQuery))
        };
    }, [searchItems, lastTxs, debouncedQuery, bounceableFormat, network]);

    if (
        (filtered.searchRes.length === 0)
        && filtered.recent.length === 0
        && filtered.myWallets.length === 0
        && filtered.holders.length === 0
    ) {
        return null;
    }

    return (
        <View style={{ marginTop: 16 }}>
            {filtered.holders.length > 0 && (
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
                        {filtered.holders.map((item, index) => {
                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={item}
                                    onPress={onSelect}
                                    walletsSettings={walletsSettings}
                                    testOnly={network.isTestnet}
                                    theme={theme}
                                    bounceableFormat={bounceableFormat}
                                    knownWallets={knownWallets}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
            {filtered.recent.length > 0 && (
                <View style={transfer ? {
                    borderRadius: 20,
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 2,
                    marginTop: filtered.holders.length > 0 ? 24 : 0
                } : undefined}>
                    <Text style={[{
                        color: theme.textPrimary,
                        marginBottom: 12,
                        marginLeft: transfer ? 16 : 0,
                        marginTop: transfer ? 16 : 0
                    }, Typography.semiBold17_24]}>
                        {t('common.recent')}
                    </Text>
                    <View style={transfer ? {
                        backgroundColor: theme.elevation,
                        borderRadius: 18,
                        paddingHorizontal: 16,
                        paddingVertical: 8
                    } : undefined}>
                        {filtered.recent.map((addr, index) => {
                            const friendly = addr.address.toString({ testOnly: network.isTestnet, bounceable: addr.isBounceable });
                            const contact = contacts[addr.address.toString({ testOnly: network.isTestnet })];
                            const known = knownWallets[addr.address.toString({ testOnly: network.isTestnet })];
                            const own = myWallets.find((acc) => acc.address.equals(addr.address));
                            const settings = walletsSettings[addr.address.toString({ testOnly: network.isTestnet })];

                            let type: "known" | "unknown" | "contact" | "own" = 'unknown';
                            let title = t('contacts.unknown');
                            if (contact) {
                                type = 'contact';
                                title = contact.name;
                            } else if (known) {
                                type = 'known';
                                title = known.name;
                            } else if (!!own) {
                                type = 'own';
                                if (settings?.name) {
                                    title = settings.name;
                                } else {
                                    if (own.index === -2) {
                                        title = 'Ledger';
                                    } else {
                                        title = `${t('common.wallet')} ${own.index + 1}`;
                                    }
                                }
                            }

                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={{
                                        addr: addr,
                                        title: title,
                                        searchable: friendly,
                                        type: type,
                                        isLedger: own?.index === -2
                                    }}
                                    walletsSettings={walletsSettings}
                                    onPress={onSelect}
                                    testOnly={network.isTestnet}
                                    theme={theme}
                                    bounceableFormat={bounceableFormat}
                                    knownWallets={knownWallets}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
            {filtered.searchRes.length > 0 && (
                <View style={transfer ? {
                    borderRadius: 20,
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 2,
                    marginTop: (
                        filtered.recent.length > 0
                        || filtered.holders.length > 0
                    ) ? 24 : 0
                } : undefined}>
                    <Text style={[{
                        color: theme.textPrimary,
                        marginBottom: 12,
                        marginLeft: transfer ? 16 : 0,
                        marginTop: transfer ? 16 : 0
                    }, Typography.semiBold17_24]}>
                        {t('contacts.contacts')}
                    </Text>
                    <View style={transfer ? {
                        backgroundColor: theme.elevation,
                        borderRadius: 18,
                        paddingHorizontal: 16,
                        paddingVertical: 8
                    } : undefined}>
                        {filtered.searchRes.map((item, index) => {
                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={item}
                                    onPress={onSelect}
                                    walletsSettings={walletsSettings}
                                    testOnly={network.isTestnet}
                                    theme={theme}
                                    bounceableFormat={bounceableFormat}
                                    knownWallets={knownWallets}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
            {filtered.myWallets.length > 0 && (
                <View style={transfer ? {
                    borderRadius: 20,
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 2,
                    marginTop:
                        (
                            filtered.recent.length > 0
                            || filtered.searchRes.length > 0
                            || filtered.holders.length > 0
                        )
                            ? 24 : 0
                } : undefined}>
                    <Text style={[{
                        color: theme.textPrimary,
                        marginBottom: 12,
                        marginLeft: transfer ? 16 : 0,
                        marginTop: transfer ? 16 : 0
                    }, Typography.semiBold17_24]}>
                        {t('common.myWallets')}
                    </Text>
                    <View style={transfer ? {
                        backgroundColor: theme.elevation,
                        borderRadius: 18,
                        paddingHorizontal: 16,
                        paddingVertical: 8
                    } : undefined}>
                        {filtered.myWallets.map((item, index) => {
                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={item}
                                    onPress={onSelect}
                                    walletsSettings={walletsSettings}
                                    testOnly={network.isTestnet}
                                    theme={theme}
                                    bounceableFormat={bounceableFormat}
                                    knownWallets={knownWallets}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
            {Platform.OS === 'android' && (
                <View style={{ height: 56 }} />
            )}
        </View>
    );
});

AddressSearch.displayName = 'AddressSearch';