import { memo, useMemo } from "react";
import { useEngine } from "../../engine/Engine";
import { useAppConfig } from "../../utils/AppConfigContext";
import { KnownWallets } from "../../secure/KnownWallets";
import { Address } from "ton";
import { AddressSearchItemView } from "./AddressSearchItemView";
import { t } from "../../i18n/t";
import { ScrollView, Text } from "react-native";
import { Transaction } from "../../engine/Transaction";

export type AddressSearchItem = { address: Address, title: string, searchable: string, type: 'contact' | 'known', icon?: string };

export const AddressSearch = memo(({ query, onSelect }: { query?: string, onSelect?: (address: Address) => void }) => {
    const { AppConfig, Theme } = useAppConfig();
    const engine = useEngine();
    const main = engine.products.main;
    const settings = engine.products.settings;
    const contacts = settings.useContacts();
    const known = KnownWallets(AppConfig.isTestnet);

    const txs = (main.useAccount()?.transactions ?? []);

    const lastTxs = useMemo(() => {
        const two = txs.slice(0, Math.min(txs.length - 1, 2));
        const filtered = two.map((t, i) => {
            const tx = main.getTransaction(t.id);
            if (tx) {
                return tx;
            }
        }).filter((t) => !!t) as Transaction[];

        let addresses: Address[] = [];
        if (filtered.length > 1) {
            const first = filtered[0].address;
            const second = filtered[1].address;
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
    }, [txs, main]);

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
            return searchItems.slice(0, 5);
        }
        return searchItems.filter((i) => i.searchable.toLowerCase().includes(query.toLowerCase()));
    }, [searchItems, query]);


    if ((!filtered || filtered.length === 0) && lastTxs.length === 0) {
        return null;
    }

    return (
        <ScrollView
            style={{ flexGrow: 1 }}
            keyboardShouldPersistTaps={'always'}
            keyboardDismissMode={'none'}
        >
            <>
                {lastTxs.length > 0 && (
                    <>
                        <Text style={{
                            fontSize: 17, fontWeight: '600',
                            lineHeight: 24,
                            color: Theme.textColor,
                            marginBottom: 8
                        }}>
                            {t('common.recent')}
                        </Text>
                        {lastTxs.map((address, index) => {
                            return (
                                <AddressSearchItemView
                                    key={index}
                                    item={{
                                        address: address,
                                        title: t('contacts.unknown'),
                                        searchable: address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                        type: 'contact'
                                    }}
                                    onPress={onSelect}
                                />
                            )
                        })}
                    </>
                )}
                {filtered.length > 0 && (
                    <Text style={{
                        fontSize: 17, fontWeight: '600',
                        lineHeight: 24,
                        color: Theme.textColor,
                        marginBottom: 8,
                        marginTop: lastTxs.length > 0 ? 24 : 0
                    }}>
                        {t('contacts.contacts')}
                    </Text>
                )}
                {filtered.map((item, index) => {
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