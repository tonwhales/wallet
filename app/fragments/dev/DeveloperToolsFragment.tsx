import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence, storageQuery } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { WalletKeys } from '../../storage/walletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback } from 'react';
import { useSelectedAccount, useSetAppState, useTheme, useSolanaClient } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useSetNetwork } from '../../engine/hooks';
import { onAccountTouched } from '../../engine/effects/onAccountTouched';
import { AppState, getAppState } from '../../storage/appState';
import { useClearHolders } from '../../engine/hooks';
import { useHoldersAccounts } from '../../engine/hooks';
import { useHoldersAccountStatus } from '../../engine/hooks';
import { KeyboardAvoidingView } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { queryClient } from '../../engine/clients';
import { getCountryCodes } from '../../utils/isNeocryptoAvailable';
import { Item } from '../../components/Item';
import { IosWalletService } from '../../modules/WalletService';
import { useSetHiddenBanners } from '../../engine/hooks/banners/useHiddenBanners';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { Address } from '@ton/core';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { solanaAddressFromPublicKey } from '../../utils/solana/address';
import { useScreenProtectorState } from '../../engine/hooks/settings/useScreenProtector';
import { parseTransactionInstructions } from '../../utils/solana/parseInstructions';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export const DeveloperToolsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const setNetwork = useSetNetwork();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const countryCodes = getCountryCodes();
    const setHiddenBanners = useSetHiddenBanners();
    const ledgerContext = useLedgerTransport();
    const acc = useSelectedAccount()!;
    const accounts = useHoldersAccounts(acc.address);
    const holdersStatus = useHoldersAccountStatus(acc.address);
    const solanaClient = useSolanaClient();
    const solanaAddress = solanaAddressFromPublicKey(acc.publicKey);
    const setAppState = useSetAppState();
    const [isScreenProtectorEnabled, setScreenProtector] = useScreenProtectorState();

    const reboot = useReboot();
    const clearHolders = useClearHolders(isTestnet);

    const resetCache = useCallback(async () => {
        queryClient.clear();
        queryClient.invalidateQueries();
        storageQuery.clearAll();
        storagePersistence.clearAll();
        setHiddenBanners([]);
        await clearHolders(acc.address.toString({ testOnly: isTestnet }));
        await onAccountTouched(acc.address.toString({ testOnly: isTestnet }), isTestnet);
        for (const ledgerWalet of ledgerContext.wallets) {
            const address = Address.parse(ledgerWalet.address);
            await clearHolders(address.toString({ testOnly: isTestnet }));
            await onAccountTouched(address.toString({ testOnly: isTestnet }), isTestnet);
        }
        IosWalletService.setCredentialsInGroupUserDefaults({});
        reboot();
    }, [isTestnet, clearHolders, setHiddenBanners, ledgerContext.wallets]);

    const onSwitchNetwork = async () => {
        const storedAppState = getAppState();
        const newAppState: AppState = {
            ...storedAppState,
            addresses: await Promise.all(
                storedAppState.addresses.map(async (address) => {
                    const publicKey = address.publicKey
                    // to get the contract address for w5 wallet with correct network
                    const contract = await contractFromPublicKey(publicKey, address.version, !isTestnet);

                    return {
                        address: contract.address,
                        publicKey,
                        secretKeyEnc: address.secretKeyEnc,
                        utilityKey: address.utilityKey,
                        addressString: contract.address.toString({ testOnly: !isTestnet }),
                        version: address.version,
                    }
                })
            )
        };
        setAppState(newAppState, !isTestnet);
        setNetwork(isTestnet ? 'mainnet' : 'testnet');
    }

    const switchNetworkAlert = () => {
        Alert.alert(
            t('devTools.switchNetworkAlertTitle', { network: isTestnet ? 'Mainnet' : 'Testnet' }),
            t('devTools.switchNetworkAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.switchNetworkAlertAction'),
                    onPress: onSwitchNetwork,
                }
            ]
        );
    };

    const copySeed = useCallback(async () => {
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
            const body = walletKeys.mnemonics.join(' ');

            if (Platform.OS === 'android') {
                Clipboard.setString(body);
                ToastAndroid.show(t('common.copiedAlert'), ToastAndroid.SHORT);
                return;
            }
            Clipboard.setString(body);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            warn('Failed to load wallet keys');
            Alert.alert(t('common.error'), t('errors.unknown'));
            return;
        }
    }, [])

    const onExportSeedAlert = useCallback(() => {
        Alert.alert(
            t('devTools.copySeedAlertTitle'),
            t('devTools.copySeedAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('devTools.copySeedAlertAction'),
                    onPress: copySeed,
                }
            ]
        )
    }, []);

    return (
        <View style={{ flexGrow: 1, paddingTop: 32 }}>
            <ScreenHeader style={{ paddingHorizontal: 16 }} onBackPressed={navigation.goBack} title={'Dev Tools'} />
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    flexGrow: 1,
                }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={{
                        flexGrow: 1, flexBasis: 0,
                        paddingHorizontal: 16, marginTop: 0
                    }}
                    contentInset={{
                        bottom: safeArea.bottom + 44,
                    }}
                    contentContainerStyle={{ gap: 16 }}
                >
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.copySeed')} onPress={onExportSeedAlert} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                        </View>

                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Storage Status"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={t('devTools.switchNetwork')} onPress={switchNetworkAlert} hint={isTestnet ? 'Testnet' : 'Mainnet'} />
                        </View>
                        {Platform.OS === 'android' && (
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemButton title={'Screen protector'} onPress={() => setScreenProtector(value => !value)} hint={isScreenProtectorEnabled ? 'Enabled' : 'Disabled'} />
                            </View>
                        )}
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Refetch cards'}
                                onPress={() => {
                                    accounts.refetch();
                                }}
                            />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Refetch status'}
                                hint={holdersStatus.data?.state}
                                onPress={() => {
                                    holdersStatus.refetch();
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Dev WebView'}
                                onPress={() => {
                                    navigation.navigate('DevDAppWebView');
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                title={'Open LedgerSignData'}
                                onPress={() => {
                                    navigation.navigate('LedgerSignData');
                                }}
                            />
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 4
                    }}>
                        <Item title={"Store code"} hint={countryCodes.storeFrontCode ?? 'Not availible'} />
                        <Item title={"Country code"} hint={countryCodes.countryCode} />
                        <Item title={"Navigate to Deposit"} onPress={async () => {
                            const transaction = 'AAEABAgV685/4vTk4rVi2drldi18uYOn1cNXrL64Kqe4VwRolMYcRKm/+iq9/s5qs63jL9sEqPhU1QtCfm+AcLamP+tuhrZ1S16unPcK4e/0U2yGpSeoX/dScZSj/9XSfyjMKNKcw4su1tVAm/iIXSHkpydMNsut6fU7jdWp2SnS3CIpcuCBImUwCqN1r3d+std9tzPy9wih0K/B6ar2qFIcq5BAO0Qss5EhV/E6kz0BNCgtAytf/s0Botvxt3kGCN8ALqcG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqS+Yf/1M0SgI0HJ0waCmMI8NiYO+FNlGWRF2o4ZOiFHBNgk+JFSEWBTj1JCAwXhrG98re5/2lr7geWCJp0K4RBkBBwcABAUBAgMGUN2DbzTs13jkWXyTX6VgXIDp0y1s5sz7l4vo/u9Lufu7dxfRfHN3UM7qSXYB0jsJu8PaBCV946MzHlJVsvIhjatilvuw3uYEM6CGAQAAAAAA';
                            navigation.navigateSolanaTransfer({ type: 'transaction', transaction })
                        }} />
                        <Item title={"Navigate to change limits"} onPress={async () => {
                            const transaction = 'AAEABQjDZNTsPQlcKbggl5p4Q6RUlfxU8uY36Ra7LEe7EXHs0wT6GaijxqGW6A6ZmsiolIsZLWyakmW6LsLz3p6YdFHT/PXEC1S8TExac+4uhCIxeFdFO+Q9nyX3ZukDpnfIYsXwyuSU1Z4gm9n5Hn0NCynIRZ+hxfO9unHTaxpdgXQAjTtELLORIVfxOpM9ATQoLQMrX/7NAaLb8bd5BgjfAC6n5Ji0yjLn7AMij+/WhFP9t/F8Wr6dXRB78dcr1IMB9jgG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqS+Yf/1M0SgI0HJ0waCmMI8NiYO+FNlGWRF2o4ZOiFHB7zNPWlujj0hVGY7ZzyXI3PIiAMXsq7LtLxmhdzVKlPQBBwcAAwQFAQIGZIuIYnijENjFTmYRErZwl2ZDCJFe+V6DaRX9d2oF6xAIEuiv1sEct0/5TVDfripmAer7X2hjjEMs1MvaUelbs3Iv7i4OZjMSNoCWmAAAAAAAAOH1BQAAAAAA4fUFAAAAAAEAAAA=AAEABQjDZNTsPQlcKbggl5p4Q6RUlfxU8uY36Ra7LEe7EXHs0wT6GaijxqGW6A6ZmsiolIsZLWyakmW6LsLz3p6YdFHT/PXEC1S8TExac+4uhCIxeFdFO+Q9nyX3ZukDpnfIYsXwyuSU1Z4gm9n5Hn0NCynIRZ+hxfO9unHTaxpdgXQAjTtELLORIVfxOpM9ATQoLQMrX/7NAaLb8bd5BgjfAC6n5Ji0yjLn7AMij+/WhFP9t/F8Wr6dXRB78dcr1IMB9jgG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqS+Yf/1M0SgI0HJ0waCmMI8NiYO+FNlGWRF2o4ZOiFHB7zNPWlujj0hVGY7ZzyXI3PIiAMXsq7LtLxmhdzVKlPQBBwcAAwQFAQIGZIuIYnijENjFTmYRErZwl2ZDCJFe+V6DaRX9d2oF6xAIEuiv1sEct0/5TVDfripmAer7X2hjjEMs1MvaUelbs3Iv7i4OZjMSNoCWmAAAAAAAAOH1BQAAAAAA4fUFAAAAAAEAAAA=';
                            navigation.navigateSolanaTransfer({ type: 'transaction', transaction })
                        }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});