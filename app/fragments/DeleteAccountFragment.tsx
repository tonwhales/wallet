import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert, TextInput } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, InternalMessage, SendMode, StateInit, toNano } from "ton";
import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../analytics/mixpanel";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CloseButton } from "../components/CloseButton";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { RoundButton } from "../components/RoundButton";
import { contractFromPublicKey } from "../engine/contractFromPublicKey";
import { useEngine } from "../engine/Engine";
import { useItem } from "../engine/persistence/PersistedItem";
import { fragment } from "../fragment";
import { LocalizedResources } from "../i18n/schema";
import { t } from "../i18n/t";
import { KnownWallets } from "../secure/KnownWallets";
import { getAppState, getCurrentAddress } from "../storage/appState";
import { sharedStoragePersistence, storage, storagePersistence } from "../storage/storage";
import { WalletKeys } from "../storage/walletKeys";
import { useReboot } from "../utils/RebootContext";
import { backoff } from "../utils/time";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import VerifiedIcon from '../../assets/ic_verified.svg';
import { fetchNfts } from "../engine/api/fetchNfts";
import { clearHolders } from "./LogoutFragment";
import { useAppConfig } from "../utils/AppConfigContext";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { useAppStateManager } from "../engine/AppStateManager";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { fetchSeqno } from "../engine/api/fetchSeqno";

export const DeleteAccountFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const { showActionSheetWithOptions } = useActionSheet();
    const tresuresAddress = Address.parse(
        AppConfig.isTestnet
            ? 'kQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqB8S1'
            : 'EQCt2mgAsbnGFKRhlLjiJvScCYbe4lqEHRMvIs-IR7T-1J6p'
    );
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const reboot = useReboot();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const addr = useMemo(() => getCurrentAddress(), []);
    const [status, setStatus] = useState<'loading' | 'deleted'>();
    const [recipientString, setRecipientString] = useState(tresuresAddress.toFriendly({ testOnly: AppConfig.isTestnet }));

    const onDeleteAccount = React.useCallback(() => {
        let ended = false;

        async function confirm(title: LocalizedResources) {
            return await new Promise<boolean>(resolve => {
                Alert.alert(t(title), t('transfer.confirm'), [{
                    text: t('common.yes'),
                    style: 'destructive',
                    onPress: () => {
                        resolve(true)
                    }
                }, {
                    text: t('common.no'),
                    onPress: () => {
                        resolve(false);
                    }
                }])
            });
        }

        backoff('delete_account', async () => {
            if (ended) {
                return;
            }

            setStatus('loading');

            // Check if has nfts
            try {
                const nftsConnection = await fetchNfts(addr.address.toFriendly({ testOnly: AppConfig.isTestnet }), AppConfig.isTestnet);
                if (nftsConnection.items && nftsConnection.items.length > 0) {
                    Alert.alert(t('deleteAccount.error.hasNfts'));
                    ended = true;
                    setStatus(undefined);
                    return;
                }
            } catch (error) {
                Alert.alert(t('deleteAccount.error.fetchingNfts'));
                ended = true;
                setStatus(undefined);
                return;
            }


            let targetAddress: Address;
            try {
                targetAddress = Address.parse(recipientString);
            } catch (error) {
                Alert.alert(t('transfer.error.invalidAddress'));
                ended = true;
                setStatus(undefined);
                return;
            }

            const targetParsed = Address.parseFriendly(targetAddress.toFriendly({ testOnly: AppConfig.isTestnet }));

            // Check target
            const targetState = await backoff('transfer', async () => {
                let block = await backoff('transfer', () => engine.client4.getLastBlock());
                return backoff('transfer', () => engine.client4.getAccount(block.last.seqno, targetParsed.address))
            });

            const target = {
                isTestOnly: targetParsed.isTestOnly,
                address: targetParsed.address,
                balance: new BN(targetState.account.balance.coins, 10),
                active: targetState.account.state.type === 'active'
            };

            // Check if trying to send to testnet
            if (!AppConfig.isTestnet && target.isTestOnly) {
                let cont = await confirm('transfer.error.addressIsForTestnet');
                if (!cont) {
                    ended = true;
                    setStatus(undefined);
                    return;
                }
            }

            // Check if target is not active
            if (target.balance.lte(new BN(0))) {
                let cont = await confirm('transfer.error.addressIsNotActive');
                if (!cont) {
                    ended = true;
                    setStatus(undefined);
                    return;
                }
            }

            // Read key
            let key: WalletKeys
            try {
                key = await authContext.authenticate({ cancelable: true });
            } catch (e) {
                setStatus(undefined);
                navigation.goBack();
                return;
            }

            if (ended) {
                setStatus(undefined);
                return;
            }

            // Check if has at least 0.1 TON 
            if (account.balance.gt(toNano('0.1'))) {
                const contract = await contractFromPublicKey(addr.publicKey);

                // Check if same address
                if (target.address.equals(contract.address)) {
                    Alert.alert(t('transfer.error.sendingToYourself'));
                    setStatus(undefined);
                    return;
                }

                // Create transfer all & dstr transfer
                let transfer = await contract.createTransfer({
                    seqno: account.seqno,
                    walletId: contract.source.walletId,
                    secretKey: key.keyPair.secretKey,
                    sendMode: SendMode.CARRRY_ALL_REMAINING_BALANCE + SendMode.DESTROY_ACCOUNT_IF_ZERO, // Transfer full balance & dstr
                    order: new InternalMessage({
                        to: target.address,
                        value: new BN(0),
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: null,
                            body: null
                        })
                    })
                });

                // Create external message
                let extMessage = new ExternalMessage({
                    to: contract.address,
                    body: new CommonMessageInfo({
                        stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                        body: new CellMessage(transfer)
                    })
                });
                let msg = new Cell();
                extMessage.writeTo(msg);

                // Sending transaction
                await backoff('delete_account_transfer', () => engine.client4.sendMessage(msg.toBoc({ idx: false })));

                while (!ended) {
                    const block = await engine.client4.getLastBlock();
                    const s = await fetchSeqno(engine.client4, block.last.seqno, addr.address);
                    const isActive = (await engine.client4.getAccount(block.last.seqno, addr.address)).account.state.type === 'active';

                    // Check if wallet has been cleared
                    if (s === 0 || isActive) {
                        setStatus('deleted');
                        ended = true;
                        setTimeout(async () => {
                            const appState = getAppState();
                            const acc = getCurrentAddress();
                            const currentAddress = acc.address;

                            mixpanelReset(AppConfig.isTestnet) // Clear super properties and generates a new random distinctId
                            trackEvent(MixpanelEvent.Reset, undefined, AppConfig.isTestnet);
                            mixpanelFlush(AppConfig.isTestnet);

                            if (appState.addresses.length === 1) {
                                storage.clearAll();
                                sharedStoragePersistence.clearAll();
                                storagePersistence.clearAll();
                                clearHolders(engine);
                                reboot();
                                return;
                            }

                            clearHolders(engine, currentAddress);

                            const newAddresses = appState.addresses.filter((address) => !address.address.equals(currentAddress));

                            appStateManager.updateAppState({
                                addresses: newAddresses,
                                selected: 0,
                            });

                        }, 2000);
                        break;
                    }
                }
            } else {
                Alert.alert(t('transfer.error.notEnoughCoins'));
                ended = true;
                setStatus(undefined);
                return;
            }
        });
    }, [recipientString, account]);

    const onContinue = React.useCallback(() => {
        const options = [t('common.cancel'), t('deleteAccount.action')];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('deleteAccount.confirm.title'),
            message: t('deleteAccount.confirm.message', { address: recipientString }),
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    // Create new wallet
                    onDeleteAccount();
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [onDeleteAccount, recipientString]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            padding: 16
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <Text style={{
                marginTop: 24,
                fontSize: 32, lineHeight: 38,
                fontWeight: '600',
                color: Theme.textPrimary,
            }}
            >
                {t('deleteAccount.title')}
            </Text>
            <Text style={{ color: Theme.textSecondary, fontSize: 17, lineHeight: 24, fontWeight: '400', marginTop: 12 }}>
                {t('deleteAccount.description', { amount: '0.1' })}
            </Text>
            <View style={{
                backgroundColor: Theme.border,
                paddingHorizontal: 20, marginTop: 20,
                paddingVertical: 10,
                width: '100%', borderRadius: 20
            }}>
                <View style={{
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: 2
                }}>
                    <Text style={{ color: Theme.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                        {t('common.recipientAddress')}
                    </Text>
                </View>
                <TextInput
                    style={[
                        {
                            paddingHorizontal: 0,
                            textAlignVertical: 'top',
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400', color: Theme.textPrimary
                        }
                    ]}
                    maxLength={48}
                    placeholder={t('common.walletAddress')}
                    placeholderTextColor={Theme.textSecondary}
                    multiline={true}
                    blurOnSubmit={true}
                    editable={true}
                    value={recipientString}
                    onChangeText={setRecipientString}
                />
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ marginBottom: safeArea.bottom }}>
                <RoundButton
                    title={t('settings.deleteAccount')}
                    onPress={onContinue}
                    display={'default'}
                    style={{ marginBottom: 16 }}
                />
                <RoundButton
                    title={t('common.cancel')}
                    onPress={navigation.goBack}
                    display={'secondary'}
                />
            </View>
            {!!status && (status === 'deleted' || status === 'loading') && (
                <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <View style={{ backgroundColor: Theme.surfacePimary, padding: 16, borderRadius: 16 }}>
                        <LoadingIndicator simple />
                        {status === 'deleted' && (
                            <Text style={{ color: Theme.textPrimary }}>
                                {t('deleteAccount.complete')}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
});