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
import { useSelectedAccount, useSetAppState, useTheme } from '../../engine/hooks';
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
import { Address, fromNano } from '@ton/core';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { SOLANA_USDC_MINT_DEVNET, SOLANA_USDC_MINT_MAINNET, solanaAddressFromPublicKey } from '../../utils/solana/address';
import { useScreenProtectorState } from '../../engine/hooks/settings/useScreenProtector';
import { rpcEndpoint } from '../../engine/hooks/solana/useSolanaClient';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { toBnWithDecimals } from '../../utils/withDecimals';

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
                    </View>
                    <View style={{
                        backgroundColor: theme.border,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 4
                    }}>
                        <ItemButton title='Fetch Solana token balance' onPress={async () => {
                            try {
                                const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
                                const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

                                const rpc = rpcEndpoint(isTestnet);
                                const connection = new Connection(rpc);

                                const walletAddress = keyPair.publicKey.toString();
                                console.log('walletAddress', { walletAddress, solanaAddress });
                                const walletPublicKey = new PublicKey(walletAddress);
                                const usdcMintAddress = new PublicKey(isTestnet ? SOLANA_USDC_MINT_DEVNET : SOLANA_USDC_MINT_MAINNET);

                                //all token accounts owned by this wallet
                                console.log('Fetching token accounts...');
                                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                                    walletPublicKey,
                                    { programId: TOKEN_PROGRAM_ID }
                                );

                                console.log(`Found ${tokenAccounts.value.length} token accounts`);

                                //find the USDC token account
                                let usdcTokenAccount = null;
                                let usdcBalance = 0;

                                const tokenAcc = tokenAccounts.value.find(tokenAccount => tokenAccount.account.data.parsed.info.mint === usdcMintAddress.toString());
                                console.log('tokenAcc', tokenAcc);

                                if (!tokenAcc) {
                                    Alert.alert('No USDC Found', 'This wallet does not have any USDC tokens.');
                                    return;
                                }

                                usdcTokenAccount = tokenAcc;
                                usdcBalance = tokenAcc.account.data.parsed.info.tokenAmount.uiAmount;
                                console.log('usdcTokenAccount', usdcTokenAccount);
                                console.log('usdcBalance', usdcBalance);

                                //sender
                                const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                                    connection,
                                    keyPair,
                                    usdcMintAddress,
                                    walletPublicKey
                                );

                                //recipient
                                const recipientAddress = new PublicKey('5CjWPNKMdWGipUX7LfRGAZ78qP85xfKpXp8iRkEfqYcb');
                                const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
                                    connection,
                                    keyPair, // Signer to pay for account creation if needed
                                    usdcMintAddress,
                                    recipientAddress
                                );

                                //transfer instruction
                                const transferAmount = '1'; // Transfer 0.1 USDC
                                const decimals = 6; // USDC has 6 decimal places
                                const tokenAmount = toBnWithDecimals(transferAmount, decimals);

                                const transferInstruction = createTransferInstruction(
                                    senderTokenAccount.address, // from 
                                    recipientTokenAccount.address, // to
                                    walletPublicKey,
                                    tokenAmount
                                );

                                //create transaction
                                const recentBlockhash = await connection.getLatestBlockhash();
                                const transaction = new Transaction().add(transferInstruction);
                                transaction.recentBlockhash = recentBlockhash.blockhash;
                                transaction.feePayer = walletPublicKey;

                                transaction.sign(keyPair);

                                const signature = await connection.sendEncodedTransaction(transaction.serialize().toString('base64'));
                                console.log('signature', signature);
                            } catch (error) {
                                console.error('Error transferring USDC:', error);
                            }
                        }} />
                        <ItemButton title='Fetch Solana balance' onPress={async () => {
                            try {
                                const rpc = rpcEndpoint(isTestnet);
                                const connection = new Connection(rpc);
                                const mint = new PublicKey(!isTestnet ? SOLANA_USDC_MINT_MAINNET : SOLANA_USDC_MINT_DEVNET);
                                const metadata = await connection.getParsedAccountInfo(mint);
                                console.log('metadata', JSON.stringify(metadata));
                            } catch (error) {
                                console.error('Error transferring USDC:', error);
                            }
                        }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
});