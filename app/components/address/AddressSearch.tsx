import React from "react";
import { memo, useMemo } from "react";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { Platform, Text, View } from "react-native";
import { Address } from "@ton/core";
import { useAccountTransactions, useNetwork, useTheme, useWalletsSettings } from "../../engine/hooks";
import { KnownWallet } from "../../secure/KnownWallets";
import { t } from "../../i18n/t";
import { useAddressBookContext } from "../../engine/AddressBookContext";

export type AddressSearchItem = {
    addr: {
        isBounceable: boolean;
        isTestOnly: boolean;
        address: Address;
    },
    title: string,
    searchable: string,
    type: 'contact' | 'known' | 'unknown' | 'my-wallets',
    icon?: string,
    isLedger?: boolean
};

export const AddressSearch = memo(({
    account,
    query,
    onSelect,
    transfer,
    myWallets,
    bounceableFormat,
    knownWallets
}: {
    account: Address,
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    transfer?: boolean,
    myWallets: {
        address: Address;
        addressString: string;
        index: number;
    }[],
    bounceableFormat: boolean,
    knownWallets: { [key: string]: KnownWallet }
}) => {
    const theme = useTheme();
    const network = useNetwork();
    const addressBook = useAddressBookContext().state;
    const contacts = addressBook.contacts;
    const [walletsSettings,] = useWalletsSettings();

    const txs = useAccountTransactions(account.toString({ testOnly: network.isTestnet })).data;

    const lastTxs = useMemo(() => {
        // first two txs
        const two = txs?.slice(0, 2);

        let addresses: { isBounceable: boolean; isTestOnly: boolean; address: Address; }[] = [];
        if (!!two && two.length > 1) {
            const firstAddr = two[0].base.operation.items[0].kind === 'token' ? two[0].base.operation.address : two[0].base.parsed.resolvedAddress;
            const secondAddr = two[1].base.operation.items[0].kind === 'token' ? two[1].base.operation.address : two[1].base.parsed.resolvedAddress;

            const first = Address.parseFriendly(firstAddr);
            const second = Address.parseFriendly(secondAddr);

            if (!!first && !!second && first.address.equals(second.address)) {
                addresses = [first];
            } else if (!!first && !!second && !first.address.equals(second.address)) {
                addresses = [first, second];
            } else if (first) {
                addresses = [first];
            } else if (second) {
                addresses = [second];
            }
        }

        return addresses;
    }, [txs, contacts]);

    const searchItems = useMemo(() => {
        return [
            ...Object.entries(contacts).map(([key, contact]) => {
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
            }),
            ...Object.entries(knownWallets).map(([key, known]) => {
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
            }),
            ...myWallets.map((acc) => {
                const walletSettings = walletsSettings[acc.addressString];
                let title = `${t('common.wallet')} ${acc.index + 1}`;

                if (walletSettings?.name) {
                    title = walletSettings.name;
                }

                if (acc.index === -2) {
                    title = 'Ledger';
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
                    type: 'my-wallets',
                    addr, title, searchable, walletSettings,
                    isLedger: acc.index === -2 ? true : undefined
                }
            })
        ].filter((i) => !!i) as AddressSearchItem[];
    }, [contacts, knownWallets, bounceableFormat, network]);

    const filtered = useMemo(() => {
        if (!query || query.length === 0) {
            return {
                recent: lastTxs,
                searchRes: searchItems.filter((i) => i.type === 'contact' || i.type === 'unknown'),
                myWallets: searchItems.filter((i) => i.type === 'my-wallets')
            };
        }

        const searchRes = searchItems.filter((i) => i.searchable.includes(query));

        return {
            recent: lastTxs.filter((a) => a.address.toString({ testOnly: network.isTestnet, bounceable: a.isBounceable }).includes(query)),
            searchRes: searchRes.filter((i) => i.type !== 'my-wallets'),
            myWallets: searchRes.filter((i) => i.type === 'my-wallets')
        };
    }, [searchItems, lastTxs, query, bounceableFormat, network]);

    if ((filtered.searchRes.length === 0) && filtered.recent.length === 0 && filtered.myWallets.length === 0) {
        return null;
    }

    return (
        <View style={{ marginTop: 16 }}>
            {filtered.recent.length > 0 && (
                <View style={transfer ? {
                    borderRadius: 20,
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 2
                } : undefined}>
                    <Text style={{
                        fontSize: 17, fontWeight: '600',
                        lineHeight: 24,
                        color: theme.textPrimary,
                        marginBottom: 12,
                        marginLeft: transfer ? 16 : 0,
                        marginTop: transfer ? 16 : 0
                    }}>
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

                            let type: "known" | "unknown" | "contact" | "my-wallets" = 'unknown';
                            let title = t('contacts.unknown');
                            if (contact) {
                                type = 'contact';
                                title = contact.name;
                            } else if (known) {
                                type = 'known';
                                title = known.name;
                            } else if (!!own) {
                                type = 'my-wallets';
                                if (settings?.name) {
                                    title = settings.name;
                                } else {
                                    title = `${t('common.wallet')} ${own.index + 1}`;
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
                    marginTop: filtered.recent.length > 0 ? 24 : 0
                } : undefined}>
                    <Text style={{
                        fontSize: 17, fontWeight: '600',
                        lineHeight: 24,
                        color: theme.textPrimary,
                        marginBottom: 12,
                        marginLeft: transfer ? 16 : 0,
                        marginTop: transfer ? 16 : 0
                    }}>
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
                    marginTop: filtered.recent.length > 0 || filtered.searchRes.length > 0 ? 24 : 0
                } : undefined}>
                    <Text style={{
                        fontSize: 17, fontWeight: '600',
                        lineHeight: 24,
                        color: theme.textPrimary,
                        marginBottom: 12,
                        marginLeft: transfer ? 16 : 0,
                        marginTop: transfer ? 16 : 0
                    }}>
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