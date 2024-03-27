import { useCallback, useMemo } from "react";
import { View, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { SelectableButton } from "../../components/SelectableButton";
import { WImage } from "../../components/WImage";
import { KnownJettonMasters } from "../../secure/KnownWallets";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useJettons, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Jetton } from "../../engine/types";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import TonIcon from '@assets/ic-ton-acc.svg';
import { JettonIcon } from "../../components/products/JettonIcon";

export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const selected = useSelectedAccount();

    const { target, callback, selectedJetton } = useParams<{
        target: string,
        callback?: (selected?: { wallet: Address, master: Address }) => void,
        selectedJetton?: Address
    }>();

    const route = useRoute();
    const isLedgerScreen = route.name === 'LedgerAssets';

    const ledgerTransport = useLedgerTransport();
    const address = useMemo(() => {
        if (isLedgerScreen && !!ledgerTransport?.addr) {
            return Address.parse(ledgerTransport.addr.address);
        }
    }, [ledgerTransport, isLedgerScreen]);

    const ledgerJettons = useJettons(address?.toString({ testOnly: network.isTestnet }) || '') ?? [];
    const jettons = useJettons(selected!.address.toString({ testOnly: network.isTestnet })) ?? [];
    const visibleList = jettons.filter((j) => !j.disabled);

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

    const onCallback = useCallback((selected?: { wallet: Address, master: Address }) => {
        if (callback) {
            setTimeout(() => {
                navigation.goBack();
                callback(selected);
            }, 10);
        }
    }, [callback]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark' })} />
            <ScreenHeader
                onBackPressed={navigation.goBack}
                title={t('products.accounts')}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
            />
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
            >
                <View style={{
                    borderRadius: 14,
                }}>
                    <SelectableButton
                        key={'assets-ton'}
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
                        selected={!selectedJetton}
                        hideSelection={!callback}
                    />
                    {(isLedgerScreen ? ledgerJettons : visibleList).map((j) => {
                        const verified = KnownJettonMasters(network.isTestnet)[j.master.toString()];
                        const selected = !!selectedJetton && j.master.equals(selectedJetton);
                        return (
                            <SelectableButton
                                key={'jt' + j.wallet.toString()}
                                title={j.name}
                                subtitle={j.description}
                                onSelect={() => onSelected(j)}
                                icon={
                                    <JettonIcon
                                        size={46}
                                        jetton={j}
                                        theme={theme}
                                        isTestnet={network.isTestnet}
                                        backgroundColor={theme.elevation}
                                    />
                                }
                                hideSelection={!callback}
                                selected={selected}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
});