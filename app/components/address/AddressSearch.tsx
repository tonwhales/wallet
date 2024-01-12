import React from "react";
import { memo, useMemo } from "react";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { Platform, Text, View } from "react-native";
import { Address } from "@ton/core";
import { useAccountTransactions, useAppState, useClient4, useNetwork, useTheme, useWalletsSettings } from "../../engine/hooks";
import { KnownWallets } from "../../secure/KnownWallets";
import { t } from "../../i18n/t";
import { WalletSettings } from "../../engine/state/walletSettings";
import { useAddressBookContext } from "../../engine/AddressBookContext";

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
    transfer,myWallets
}: {
    account: Address,
    query?: string,
    onSelect?: (item: AddressSearchItem) => void,
    transfer?: boolean,

    myWallets: {
        address: Address;
        addressString: string;
        index: number;
    }[]
}) => {
    const theme = useTheme();
    const network = useNetwork();
    const addressBook = useAddressBookContext().state;
    const contacts = addressBook.contacts;
    const client = useClient4(network.isTestnet);
    const knownWallets = KnownWallets(network.isTestnet);
    const [walletsSettings,] = useWalletsSettings();

    const txs = useAccountTransactions(client, account.toString({ testOnly: network.isTestnet })).data;

    const lastTxs = useMemo(() => {
        // first two txs
        const two = txs?.slice(0, 2);

        let addresses: Address[] = [];
        if (!!two && two.length > 1) {
            const firstAddr = two[0].base.operation.items[0].kind === 'token' ? two[0].base.operation.address : two[0].base.parsed.resolvedAddress;
            const secondAddr = two[1].base.operation.items[0].kind === 'token' ? two[1].base.operation.address : two[1].base.parsed.resolvedAddress;

            const first = Address.parse(firstAddr);
            const second = Address.parse(secondAddr);

            if (!!first && !!second && first.equals(second)) {
                addresses = [first];
            } else if (!!first && !!second && !first.equals(second)) {
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
                        {filtered.recent.map((address, index) => {
                            const contact = contacts[address.toString({ testOnly: network.isTestnet })];
                            const known = knownWallets[address.toString({ testOnly: network.isTestnet })];
                            const own = myWallets.find((acc) => acc.address.equals(address));
                            const settings = walletsSettings[address.toString({ testOnly: network.isTestnet })];
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
                                        address: address,
                                        title: title,
                                        searchable: address.toString({ testOnly: network.isTestnet }),
                                        type: type,
                                        walletSettings: settings
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