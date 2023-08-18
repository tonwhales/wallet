import { memo, useMemo } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { useEngine } from "../../engine/Engine";
import { useAppConfig } from "../../utils/AppConfigContext";
import { KnownWallets } from "../../secure/KnownWallets";
import { Address } from "ton";
import { AddressSearchItemView } from "./AddressSearchItemView";

export type AddressSearchItem = { address: Address, title: string, searchable: string, type: 'contact' | 'known', icon?: string };

export const AddressSearch = memo(({ query, onSelect }: { query?: string, onSelect?: (address: Address) => void }) => {
    const { AppConfig } = useAppConfig();
    const engine = useEngine();
    const contacts = engine.products.settings.useContacts();
    const known = KnownWallets(AppConfig.isTestnet);

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
        if (!query) {
            return [];
        }
        return searchItems.filter((i) => i.searchable.toLowerCase().includes(query.toLowerCase()));
    }, [searchItems, query]);


    if (!filtered || filtered.length === 0) {
        return null;
    }

    return (
        <ScrollView
            style={{ flexGrow: 1 }}
            keyboardShouldPersistTaps={'always'}
            keyboardDismissMode={'none'}
        >
            {filtered.map((item, index) => {
                return (
                    <AddressSearchItemView
                        key={index}
                        item={item}
                        onPress={onSelect}
                    />
                );
            })}
        </ScrollView>
    );
});