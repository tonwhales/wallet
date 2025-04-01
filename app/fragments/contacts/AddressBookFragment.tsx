import { Platform, ScrollView, View } from "react-native";
import { fragment } from "../../fragment";
import { AddressSearch, AddressSearchItem } from "../../components/address/AddressSearch";
import { useAppState, useBounceableWalletFormat, useLastTwoTxs, useNetwork, useTheme } from "../../engine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address } from "@ton/core";
import { useParams } from "../../utils/useParams";
import { KnownWallets } from "../../secure/KnownWallets";
import { useHoldersAccountTrargets } from "../../engine/hooks/holders/useHoldersAccountTrargets";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Ionicons } from '@expo/vector-icons';
import { ATextInput } from "../../components/ATextInput";
import { t } from "../../i18n/t";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { TonStoredTransaction } from "../../engine/types";

export type AddressBookParams = {
    account: string,
    solanaAddress?: string,
    onSelected: (item: AddressSearchItem) => void
}

export const AddressBookFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const appState = useAppState();
    const ledgerTransport = useLedgerTransport();
    const { isTestnet } = useNetwork();
    const { account, solanaAddress, onSelected } = useParams<AddressBookParams>();
    const [bounceableFormat] = useBounceableWalletFormat();
    const knownWallets = KnownWallets(isTestnet);
    const lastTwoTxs = (useLastTwoTxs(account) as TonStoredTransaction[]).map((t) => t.data);
    const accAddress = useMemo(() => Address.parse(account), [account]);
    const holdersAccounts = useHoldersAccountTrargets(accAddress, solanaAddress);
    const [search, setSearch] = useState('');

    const myWallets = useMemo(() => {
        return appState.addresses
            .map((acc, index) => ({
                address: acc.address,
                addressString: acc.address.toString({ testOnly: isTestnet }),
                index: index
            }))
            .concat(ledgerTransport.wallets.map((w) => ({
                address: Address.parse(w.address),
                addressString: Address.parse(w.address).toString({ testOnly: isTestnet }),
                index: -2
            })))
            .filter((acc) => !acc.address.equals(accAddress))
    }, [appState.addresses, ledgerTransport.wallets, isTestnet]);

    const selectedItemRef = useRef<AddressSearchItem | null>(null);

    const onSelect = useCallback((item: AddressSearchItem) => {
        selectedItemRef.current = item;
        navigation.goBack();
    }, []);

    useEffect(() => {
        return () => {
            if (selectedItemRef.current) {
                onSelected(selectedItemRef.current);
            }
        }
    }, []);

    return (
        <View>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                title={t('common.addressBook')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <ScrollView
                stickyHeaderIndices={[0]}
                contentInset={{ bottom: safeArea.bottom + 56 + 44 }}
                contentContainerStyle={[
                    { paddingHorizontal: 16, paddingTop: 0, paddingBottom: safeArea.bottom },
                    Platform.select({ android: { paddingBottom: safeArea.bottom + 180 } }),
                ]}
                style={{ flexGrow: 1, paddingTop: 16 }}
                keyboardDismissMode={'on-drag'}
                keyboardShouldPersistTaps={'handled'}
            >
                <View>
                    <View style={[{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderRadius: 20,
                        backgroundColor: theme.border,
                        shadowColor: theme.textPrimary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4
                    }]}>
                        <Ionicons style={{ width: 24, height: 24 }} name={'search'} size={24} color={theme.iconNav} />
                        <ATextInput
                            index={0}
                            style={{ marginHorizontal: 16, flex: 1 }}
                            onValueChange={(text) => setSearch(text)}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                            keyboardType={'default'}
                            returnKeyType={'next'}
                            autoComplete={'off'}
                            inputMode={'search'}
                            placeholder={t('browser.search.placeholder')}
                            value={search}
                            cursorColor={theme.accent}
                        />
                    </View>
                </View>
                <AddressSearch
                    theme={theme}
                    onSelect={onSelect}
                    query={search}
                    transfer
                    myWallets={myWallets}
                    bounceableFormat={bounceableFormat}
                    knownWallets={knownWallets}
                    lastTwoTxs={lastTwoTxs}
                    holdersAccounts={holdersAccounts}
                />
            </ ScrollView>
        </View>
    );
});