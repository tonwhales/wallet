import * as React from 'react';
import { Alert, Platform, ScrollView, ToastAndroid, View, Text } from "react-native";
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
import { useSelectedAccount, useSetAppState, useSolanaAccount, useSolanaClient, useSolanaTransactions, useTheme } from '../../engine/hooks';
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
import { Address, toNano } from '@ton/core';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { solanaAddressFromPublicKey } from '../../utils/solana/core';
import {
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransaction,
    getComputeUnitEstimateForTransactionMessageFactory,
    prependTransactionMessageInstruction,
    compileTransaction,
    createKeyPairFromBytes,
    createSignerFromKeyPair,
    getBase64EncodedWireTransaction,
    pipe,
    appendTransactionMessageInstructions,
} from '@solana/kit';
import { getAddMemoInstruction } from '@solana-program/memo';
import { getTransferSolInstruction } from '@solana-program/system';
import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget'

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
    const solanaAddress = solanaAddressFromPublicKey(acc.publicKey);
    const solanaClient = useSolanaClient();
    const solanaAccount = useSolanaAccount(solanaAddress);
    const setAppState = useSetAppState();

    const solanaTransactions = useSolanaTransactions(solanaAddress);

    console.log(JSON.stringify(solanaTransactions.data));

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
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 4
                    }}>
                        <View>
                            <Text>
                                {JSON.stringify(solanaAccount.data ?? 'No data')}
                            </Text>
                            <Text>
                                { }
                            </Text>
                        </View>
                        <ItemButton title='CHECK BALANCE' onPress={async () => {
                            try {
                                const balance = await solanaClient.getBalance(solanaAddress).send();
                                console.log('balance', balance);
                                const minBalance = await solanaClient.getMinimumBalanceForRentExemption(0n).send();
                                console.log('minBalance', minBalance);
                            } catch (error) {
                                console.error('error', error);
                            }
                        }} />
                        <ItemButton title='Send to Self' onPress={async () => {
                            try {
                                const lastBlockHash = await solanaClient.getLatestBlockhash().send();

                                const recentBlockhash = {
                                    blockhash: lastBlockHash.value.blockhash,
                                    lastValidBlockHeight: lastBlockHash.value.lastValidBlockHeight,
                                };
                                console.log({ recentBlockhash });

                                const getComputeUnitEstimateForTransactionMessage = getComputeUnitEstimateForTransactionMessageFactory({ rpc: solanaClient });

                                const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
                                console.log('privateKey length', walletKeys.keyPair.secretKey.length);
                                const privateKey = new Uint8Array(walletKeys.keyPair.secretKey);
                                const keyPair = await createKeyPairFromBytes(privateKey);
                                const signer = await createSignerFromKeyPair(keyPair);

                                console.log('signer', signer);
                                console.log('solanaAddress', solanaAddress);

                                const comment = 'test solana comment';

                                const instructions = [
                                    getTransferSolInstruction({
                                        source: signer,
                                        destination: solanaAddress,
                                        amount: toNano(1),
                                    }),
                                    getAddMemoInstruction({ memo: comment }),
                                ];

                                const transactionMessage = pipe(
                                    createTransactionMessage({ version: 0 }),
                                    tx => setTransactionMessageFeePayer(solanaAddress, tx),
                                    tx => appendTransactionMessageInstructions(instructions, tx),
                                    tx => setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
                                );

                                const computeUnitEstimate = await getComputeUnitEstimateForTransactionMessage(transactionMessage);
                                console.log('computeUnitEstimate', computeUnitEstimate);

                                const transactionMessageWithComputeUnitLimit = prependTransactionMessageInstruction(
                                    getSetComputeUnitLimitInstruction({ units: computeUnitEstimate }),
                                    transactionMessage,
                                );

                                const transaction = compileTransaction(transactionMessageWithComputeUnitLimit);
                                console.log('transaction', transaction);

                                // const signedTransaction = await signer.signTransactions([transaction]);
                                const signedTransaction = await signTransaction([keyPair], transaction);
                                console.log('signedTransaction', signedTransaction);

                                const base64Transaction = getBase64EncodedWireTransaction(signedTransaction);

                                // const sent = await solanaClient.sendTransaction(signedTransaction, { commitment: 'confirmed' }).send();
                                const sent = await solanaClient.sendTransaction(base64Transaction, { encoding: 'base64' }).send();
                                console.log('sent', sent);

                            } catch (error) {
                                console.error('error', error);
                            }
                        }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});