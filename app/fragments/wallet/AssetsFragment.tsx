import { useCallback, useMemo } from "react";
import { View, Image, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { SelectableButton } from "../../components/SelectableButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useCloudValue, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Jetton } from "../../engine/types";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { AssetsListItem } from "../../components/jettons/AssetsListItem";
import { useSortedHints } from "../../engine/hooks/jettons/useSortedHints";
import { FlashList } from "@shopify/flash-list";
import { Typography } from "../../components/styles";

import TonIcon from '@assets/ic-ton-acc.svg';

type ListItem = { type: 'jetton', address: Address } | { type: 'ton' };

export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const selected = useSelectedAccount();
    let [disabledState,] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const { target, callback, selectedJetton } = useParams<{
        target: string,
        callback?: (selected?: { wallet?: Address, master: Address }) => void,
        selectedJetton?: Address
    }>();

    const route = useRoute();
    const isLedgerScreen = route.name === 'LedgerAssets';

    const ledgerTransport = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (isLedgerScreen && !!ledgerTransport?.addr) {
            return Address.parse(ledgerTransport.addr.address);
        }
    }, [ledgerTransport, isLedgerScreen]);

    const owner = isLedgerScreen ? ledgerAddress! : selected!.address;

    const sortedHints = useSortedHints(owner.toString({ testOnly: network.isTestnet }));

    const hints = useMemo(() => {
        return sortedHints.map((s) => {
            try {
                let wallet = Address.parse(s);
                return wallet;
            } catch {
                return null;
            }
        }).filter((j) => !!j) as Address[];
    }, [sortedHints]);

    const visibleList = useMemo(() => {
        const filtered = hints
            .filter((j) => !disabledState.disabled[j.toString({ testOnly: network.isTestnet })] || isLedgerScreen)
            .map((j) => ({
                type: 'jetton',
                address: j
            }));

        return [{ type: 'ton' }, ...filtered] as ListItem[];
    }, [disabledState, network, isLedgerScreen, hints]);

    const onSelected = useCallback((jetton: Jetton) => {
        if (callback) {
            onCallback({ wallet: jetton.wallet, master: jetton.master });
            return;
        }
        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                comment: null,
                jetton: jetton.wallet,
                stateInit: null,
                job: null,
                callback: null
            });
            return;
        }
        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            comment: null,
            jetton: jetton.wallet,
            stateInit: null,
            job: null,
            callback: null
        });
    }, []);

    const onTonSelected = useCallback(() => {
        if (callback) {
            onCallback();
            return;
        }
        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                stateInit: null,
                job: null,
                comment: null,
                jetton: null,
                callback: null
            });
            return;
        }
        navigation.navigateSimpleTransfer({
            amount: null,
            target: target,
            stateInit: null,
            job: null,
            comment: null,
            jetton: null,
            callback: null
        });
    }, [isLedgerScreen, callback]);

    const onCallback = useCallback((selected?: { wallet?: Address, master: Address }) => {
        if (callback) {
            setTimeout(() => {
                navigation.goBack();
                callback(selected);
            }, 10);
        }
    }, [callback]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onBackPressed={navigation.goBack}
                title={t('products.accounts')}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
            />
            <FlashList
                data={visibleList}
                renderItem={({ item }: { item: ListItem }) => {
                    if (item.type !== 'ton') {
                        const wallet = item.address;
                        return (
                            <AssetsListItem
                                wallet={wallet}
                                owner={owner}
                                onSelect={onSelected}
                                hideSelection={!callback}
                                selected={selectedJetton}
                                isTestnet={network.isTestnet}
                                theme={theme}
                            />
                        )
                    }

                    return (
                        <SelectableButton
                            title={'TON'}
                            subtitle={t('common.balance')}
                            onSelect={onTonSelected}
                            icon={
                                <View style={{ width: 46, height: 46 }}>
                                    <TonIcon width={46} height={46} />
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 20, width: 20, borderRadius: 10,
                                        position: 'absolute', right: -2, bottom: -2,
                                        backgroundColor: theme.surfaceOnBg
                                    }}>
                                        <Image
                                            source={require('@assets/ic-verified.png')}
                                            style={{ height: 20, width: 20 }}
                                        />
                                    </View>
                                </View>
                            }
                            style={{ height: 86 }}
                            selected={!selectedJetton}
                            hideSelection={!callback}
                        />
                    )
                }}
                // to see less blank space
                estimatedItemSize={80}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                keyExtractor={(item, index) => `jetton-i-${index}`}
                ListEmptyComponent={(
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: dimentions.height - (safeArea.bottom + safeArea.top + 44 + 32 + 32),
                        width: '100%',
                    }}>
                        <Text style={[Typography.semiBold27_32, { color: theme.textSecondary }]}>
                            {t('jetton.jettonsNotFound')}
                        </Text>
                    </View>
                )}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
        </View>
    );
});