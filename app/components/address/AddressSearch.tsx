import React from "react";
import { memo, useMemo } from "react";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { ScrollView, Text } from "react-native";
import { Address } from "@ton/core";
import { useAccountTransactions, useClient4, useContacts, useNetwork, useTheme } from "../../engine/hooks";
import { KnownWallets } from "../../secure/KnownWallets";
import { t } from "../../i18n/t";

export type AddressSearchItem = { address: Address, title: string, searchable: string, type: 'contact' | 'known', icon?: string };

export const AddressSearch = memo(({
    account,
    query,
    onSelect
}: {
    account: Address,
    query?: string,
    onSelect?: (address: Address) => void
}) => {
    const theme = useTheme();
    const network = useNetwork();
    const contacts = useContacts();
    const client = useClient4(network.isTestnet);
    const known = KnownWallets(network.isTestnet);

    const txs = useAccountTransactions(client, account.toString({ testOnly: network.isTestnet }))?.data;

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
                    searchable: `${title} ${key}`,
                    type: 'contact'
                }
            }),
            ...Object.entries(known).map(([key, known]) => {
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
                    searchable: `${title} ${key}`,
                    type: 'known',
                    icon: known.ic
                }
            })
        ].filter((i) => !!i) as AddressSearchItem[];
    }, [contacts, known]);

    const filtered = useMemo(() => {
        if (!query || query.length === 0) {
            return {
                recent: lastTxs,
                searchRes: searchItems.slice(0, 5).filter((i) => i.type !== 'known')
            };
        }
        return {
            recent: lastTxs.filter((a) => a.toString({ testOnly: network.isTestnet }).toLowerCase().includes(query.toLowerCase())),
            searchRes: searchItems.filter((i) => i.searchable.toLowerCase().includes(query.toLowerCase()))
        };
    }, [searchItems, lastTxs, query]);

    if ((filtered.searchRes.length === 0) && filtered.recent.length === 0) {
        return null;
    }

    return (
        <ScrollView
            style={{ flexGrow: 1 }}
            keyboardShouldPersistTaps={'always'}
            keyboardDismissMode={'none'}
        >
            <>
                {filtered.recent.length > 0 && (
                    <>
                        <Text style={{
                            fontSize: 17, fontWeight: '600',
                            lineHeight: 24,
                            color: theme.textPrimary,
                            marginBottom: 8
                        }}>
                            {t('common.recent')}
                        </Text>
                        {filtered.recent.map((address, index) => {
                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={{
                                        address: address,
                                        title: t('contacts.unknown'),
                                        searchable: address.toString({ testOnly: network.isTestnet }),
                                        type: 'contact'
                                    }}
                                    onPress={onSelect}
                                />
                            )
                        })}
                    </>
                )}
                {filtered.searchRes.length > 0 && (
                    <Text style={{
                        fontSize: 17, fontWeight: '600',
                        lineHeight: 24,
                        color: theme.textPrimary,
                        marginBottom: 8,
                        marginTop: filtered.recent.length > 0 ? 24 : 0
                    }}>
                        {t('contacts.contacts')}
                    </Text>
                )}
                {filtered.searchRes.map((item, index) => {
                    return (
                        <AddressSearchItemView
                            key={index}
                            item={item}
                            onPress={onSelect}
                        />
                    );
                })}
            </>
        </ScrollView>
    );
});