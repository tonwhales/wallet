import React from "react";
import { memo, useMemo } from "react";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { Platform, Text, View } from "react-native";
import { Address } from "@ton/core";
import { useAccountTransactions, useAppState, useClient4, useContacts, useNetwork, useTheme, useWalletsSettings } from "../../engine/hooks";
import { KnownWallets } from "../../secure/KnownWallets";
import { t } from "../../i18n/t";
import { WalletSettings } from "../../engine/state/walletSettings";

export type AddressSearchItem = {
    address: Address,
    title: string,
    searchable: string,
    type: 'contact' | 'known' | 'unknown' | 'my-wallets',
    icon?: string,
    walletSettings?: WalletSettings
};

export const AddressSearch = memo(({
    account,
    query,
    onSelect,
    transfer
}: {
    account: Address,
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    transfer?: boolean
}) => {
    const theme = useTheme();
    const network = useNetwork();
    const contacts = useContacts();
    const appState = useAppState();
    const selectedIndex = appState.selected;
    const myWallets = appState.addresses.map((acc, index) => ({
        address: acc.address,
        addressString: acc.address.toString({ testOnly: network.isTestnet }),
        index: index
    })).filter((acc) => acc.index !== selectedIndex);
    const client = useClient4(network.isTestnet);
    const knownWallets = KnownWallets(network.isTestnet);
    const [walletsSettings,] = useWalletsSettings();

    const txs = useAccountTransactions(client, account.toString({ testOnly: network.isTestnet })).data;

    const lastTxs = useMemo(() => {
        // first two txs
        const two = txs?.slice(0, 2);

        let addresses: Address[] = [];
        if (!!two && two.length > 1) {
            const first = Address.parse(two[0].base.parsed.resolvedAddress);
            const second = Address.parse(two[1].base.parsed.resolvedAddress);
            if (first && second && first.equals(second)) {
                addresses = [first];
            } else if (first && second && !first.equals(second)) {
                addresses = [first, second];
            } else if (first) {
                addresses = [first];
            } else if (second) {
                addresses = [second];
            }
        }

        // filter contacts
        addresses = addresses.filter((a) => {
            return !Object.keys(contacts).find((key) => {
                try {
                    const address = Address.parse(key);
                    return address.equals(a);
                } catch {
                    return false;
                }
            });
        });

        return addresses;
    }, [txs, contacts]);

    const searchItems = useMemo(() => {
        return [
            ...Object.entries(contacts).map(([key, contact]) => {
                let address;
                try {
                    address = Address.parse(key);
                } catch {
                    return null
                }
                const name = contact.name;
                const lastName = contact.fields?.find((f) => f.key === 'lastName')?.value
                const title = `${name}${lastName ? ` ${lastName}` : ''}`;
                return {
                    address: address,
                    title,
                    searchable: `${title} ${key}`.toLowerCase(),
                    type: 'contact'
                }
            }),
            ...Object.entries(knownWallets).map(([key, known]) => {
                let address;
                try {
                    address = Address.parse(key);
                } catch (error) {
                    return null
                }
                const title = known.name;

                return {
                    address: address,
                    title,
                    searchable: `${title} ${key}`.toLowerCase(),
                    type: 'known',
                    icon: known.ic
                }
            }),
            ...myWallets.map((acc) => {
                const settings = walletsSettings[acc.addressString];
                let title = `${t('common.wallet')} ${acc.index + 1}`;

                if (settings?.name) {
                    title = settings.name;
                }

                return {
                    address: acc.address,
                    title: title,
                    searchable: `${title} ${acc.addressString}`.toLowerCase(),
                    type: 'my-wallets',
                    walletSettings: settings
                }
            })
        ].filter((i) => !!i) as AddressSearchItem[];
    }, [contacts, knownWallets]);

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
            recent: lastTxs.filter((a) => a.toString({ testOnly: network.isTestnet }).includes(query)),
            searchRes: searchRes.filter((i) => i.type !== 'my-wallets'),
            myWallets: searchRes.filter((i) => i.type === 'my-wallets')
        };
    }, [searchItems, lastTxs, query]);

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
                        marginBottom: 8,
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
                        {filtered.recent.map((address, index) => {
                            const contact = contacts[address.toString({ testOnly: network.isTestnet })];
                            const known = knownWallets[address.toString({ testOnly: network.isTestnet })];
                            const type = contact ? 'contact' : known ? 'known' : 'unknown';
                            const title = contact ? contact.name : known ? known.name : t('contacts.unknown');

                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={{
                                        address: address,
                                        title: title,
                                        searchable: address.toString({ testOnly: network.isTestnet }),
                                        type: type
                                    }}
                                    onPress={onSelect}
                                />
                            )
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
                        marginBottom: 8,
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
                        marginBottom: 8,
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