import { useCallback, useMemo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { SelectableButton } from "../../components/SelectableButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRoute } from "@react-navigation/native";
import { useCloudValue, useHintsFull, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { AssetsListItem } from "../../components/jettons/AssetsListItem";
import { FlashList } from "@shopify/flash-list";
import { Typography } from "../../components/styles";
import { Image } from "expo-image";
import { JettonFull } from "../../engine/api/fetchHintsFull";

type ListItem = { type: 'jetton', hint: JettonFull } | { type: 'ton' };

export const AssetsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const selected = useSelectedAccount();
    const [disabledState] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

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

    const hints = useHintsFull(owner.toString({ testOnly: network.isTestnet })).data?.hints ?? [];

    const visibleList = useMemo(() => {
        const filtered = hints
            .filter((j) => !disabledState.disabled[j.jetton.address] || isLedgerScreen)
            .map((h) => ({
                type: 'jetton',
                hint: h
            }));

        return [{ type: 'ton' }, ...filtered] as ListItem[];
    }, [disabledState, network, isLedgerScreen, hints]);

    const onSelected = useCallback((hint: JettonFull) => {
        if (callback) {
            onCallback({
                wallet: Address.parse(hint.walletAddress.address),
                master: Address.parse(hint.jetton.address)
            });
            return;
        }
        if (isLedgerScreen) {
            navigation.replace('LedgerSimpleTransfer', {
                amount: null,
                target: target,
                comment: null,
                jetton: Address.parse(hint.walletAddress.address),
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
            jetton: Address.parse(hint.walletAddress.address),
            stateInit: null,
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
                        return (
                            <AssetsListItem
                                hint={item.hint}
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
                                    <Image
                                        source={require('@assets/ic-ton-acc.png')}
                                        style={{ height: 46, width: 46 }}
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