import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, InternalMessage, SendMode, StateInit, toNano } from "ton";
import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../analytics/mixpanel";
import { ATextInput } from "../components/ATextInput";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { RoundButton } from "../components/RoundButton";
import { contractFromPublicKey } from "../engine/contractFromPublicKey";
import { useEngine } from "../engine/Engine";
import { useItem } from "../engine/persistence/PersistedItem";
import { fragment } from "../fragment";
import { LocalizedResources } from "../i18n/schema";
import { t } from "../i18n/t";
import { getAppState, getCurrentAddress } from "../storage/appState";
import { sharedStoragePersistence, storage, storagePersistence } from "../storage/storage";
import { WalletKeys } from "../storage/walletKeys";
import { useReboot } from "../utils/RebootContext";
import { backoff } from "../utils/time";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { fetchNfts } from "../engine/api/fetchNfts";
import { clearHolders } from "./LogoutFragment";
import { useAppConfig } from "../utils/AppConfigContext";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { useAppStateManager } from "../engine/AppStateManager";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { fetchSeqno } from "../engine/api/fetchSeqno";
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemButton } from "../components/ItemButton";
import { openWithInApp } from "../utils/openWithInApp";

import IcDelete from '@assets/ic-delete-red.svg';
import IcCheckAddress from '@assets/ic-check-recipient.svg';
import IcSupport from '@assets/ic-support.svg';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

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

    const invalidAddress = useMemo(() => {
        if (!recipientString) {
            return true;
        }
        if (recipientString.length >= 48) {
            try {
                Address.parse(recipientString);
            } catch {
                return true;
            }
        }
        return false;
    }, [recipientString]);

    const onDeleteAccount = useCallback(() => {
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

    const onContinue = useCallback(() => {
        const options = [t('common.cancel'), t('deleteAccount.action')];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('deleteAccount.confirm.title'),
            message: t('deleteAccount.confirm.message'),
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
    }, [onDeleteAccount]);

    const onSupport = useCallback(() => {
        const options = [t('common.cancel'), t('settings.support.telegram'), t('settings.support.form')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
            title: t('settings.support.title'),
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    openWithInApp('https://t.me/WhalesSupportBot');
                    break;
                case 2:
                    openWithInApp('https://airtable.com/appWErwfR8x0o7vmz/shr81d2H644BNUtPN');
                    break;
                default:
                    break;
            }
        });
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('settings.deleteAccount')}
                onBackPressed={navigation.goBack}
            />
            <View style={{ flexGrow: 1, paddingHorizontal: 16, marginTop: 16 }}>
                <View style={{
                    backgroundColor: 'rgba(255, 65, 92, 0.10)',
                    borderRadius: 20, padding: 20,
                    marginBottom: 16
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IcDelete width={24} height={24} color={Theme.accentRed} />
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            marginLeft: 12,
                            fontWeight: '600',
                            color: Theme.accentRed,
                        }}>
                            {t('common.attention')}
                        </Text>
                    </View>
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: Theme.accentRed,
                    }}>
                        {t('logout.logoutDescription')}
                    </Text>
                </View>

                <View style={{
                    marginBottom: 16,
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                    padding: 20,
                }}>
                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                        <IcCheckAddress width={24} height={24} color={Theme.accentRed} />
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textPrimary,
                            marginLeft: 12,
                        }}>
                            {`${t('deleteAccount.checkRecipient')}`}
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: Theme.background,
                        paddingVertical: 20,
                        width: '100%', borderRadius: 20,
                        flexGrow: 1,
                    }}>
                        <View style={{ paddingHorizontal: 6 }}>
                            <ATextInput
                                value={recipientString}
                                onValueChange={setRecipientString}
                                keyboardType={'ascii-capable'}
                                multiline
                                autoCorrect={false}
                                autoComplete={'off'}
                                textContentType={'none'}
                                maxLength={48}
                                style={{
                                    paddingHorizontal: 10,
                                }}
                                inputStyle={{
                                    fontSize: 17,
                                    fontWeight: '400', color: Theme.textPrimary,
                                }}
                                label={t('common.recipientAddress')}
                            />
                        </View>
                    </View>
                    {!!invalidAddress && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Text style={{
                                color: Theme.accentRed,
                                fontSize: 13,
                                lineHeight: 18,
                                marginTop: 4,
                                marginLeft: 16,
                                fontWeight: '400'
                            }}>
                                {t('transfer.error.invalidAddress')}
                            </Text>
                        </Animated.View>
                    )}
                    <Text style={{
                        fontSize: 13, lineHeight: 18,
                        fontWeight: '400',
                        color: Theme.textSecondary, marginTop: 4, marginLeft: 16
                    }}>
                        {t('deleteAccount.checkRecipientDescription')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<IcSupport width={24} height={24} />}
                        title={t('settings.support.title')}
                        onPress={onSupport}
                    />
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                <RoundButton
                    title={t('settings.deleteAccount')}
                    onPress={onContinue}
                    display={'default'}
                    style={{ marginBottom: 16 }}
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