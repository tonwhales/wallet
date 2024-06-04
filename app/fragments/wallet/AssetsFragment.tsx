import { useCallback, useMemo } from "react";
import { View, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { SelectableButton } from "../../components/SelectableButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useCloudValue, useHints, useKnownJettons, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Jetton } from "../../engine/types";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { AssetsListItem } from "../../components/jettons/AssetsListItem";
import { WImage } from "../../components/WImage";

import TonIcon from '@assets/ic-ton-acc.svg';

// TODO: refactor this fragment with FlashList (for large jettons list)
export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const selected = useSelectedAccount();
    const knownJettons = useKnownJettons(network.isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton ? Address.parse(knownJettons.specialJetton) : null;
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
    const hints = (useHints(owner.toString({ testOnly: network.isTestnet })) ?? [])
        .map((s) => {
            try {
                let wallet = Address.parse(s);
                return wallet;
            } catch {
                return null;
            }
        })
        .filter((j) => !!j) as Address[];
    const hasSpecialJetton = !!hints.find((j) => j.toString({ testOnly: network.isTestnet }) === knownJettons?.specialJetton);
    const visibleList = hints.filter((j) => !disabledState.disabled[j.toString({ testOnly: network.isTestnet })] || isLedgerScreen);

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

    const onSpecialJettonSelected = useCallback(() => {
        if (callback && specialJettonMaster) {
            onCallback({ master: specialJettonMaster });
        }
    }, []);

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
                    {!hasSpecialJetton && knownJettons?.specialJetton && (
                        <SelectableButton
                            key={'assets-special'}
                            title={'TetherUSD₮'}
                            subtitle={'Tether Token for Tether USD'}
                            onSelect={onSpecialJettonSelected}
                            selected={!!selectedJetton && specialJettonMaster?.equals(selectedJetton)}
                            hideSelection={!callback}
                            icon={
                                <View style={{ width: 46, height: 46 }}>
                                    <WImage
                                        requireSource={require('@assets/known/ic-usdt.png')}
                                        width={46}
                                        heigh={46}
                                        borderRadius={23}
                                    />
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
                        />
                    )}
                    <View style={{ gap: 16 }}>
                        {visibleList.map((j) => {
                            return (
                                <AssetsListItem
                                    key={'asset-jt' + j.toString({ testOnly: network.isTestnet })}
                                    wallet={j}
                                    owner={owner}
                                    onSelect={onSelected}
                                    hideSelection={!callback}
                                    selected={selectedJetton}
                                    isTestnet={network.isTestnet}
                                    theme={theme}
                                />
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
});