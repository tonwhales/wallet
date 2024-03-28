import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, Alert, Keyboard, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../components/ATextInput";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { RoundButton } from "../components/RoundButton";
import { contractFromPublicKey } from "../engine/contractFromPublicKey";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { WalletKeys } from "../storage/walletKeys";
import { backoff } from "../utils/time";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { fetchNfts } from "../engine/api/fetchNfts";
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { fetchSeqno } from "../engine/api/fetchSeqno";
import { ScreenHeader } from "../components/ScreenHeader";
import { ItemButton } from "../components/ItemButton";
import { openWithInApp } from "../utils/openWithInApp";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAccountLite, useClient4, useNetwork, useSelectedAccount, useTheme } from "../engine/hooks";
import { beginCell, internal, storeMessage, external, Address, SendMode, toNano } from "@ton/core";
import { getLastBlock } from "../engine/accountWatcher";
import { useDeleteCurrentAccount } from "../engine/hooks/appstate/useDeleteCurrentAccount";
import { StatusBar } from "expo-status-bar";

import IcDelete from '@assets/ic-delete-red.svg';
import IcCheckAddress from '@assets/ic-check-recipient.svg';
import IcSupport from '@assets/ic-support.svg';

export const DeleteAccountFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    const { showActionSheetWithOptions } = useActionSheet();
    const tresuresAddress = Address.parse(
        network.isTestnet
            ? 'kQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqB8S1'
            : 'EQCt2mgAsbnGFKRhlLjiJvScCYbe4lqEHRMvIs-IR7T-1J6p'
    );
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected?.address);

    const onAccountDeleted = useDeleteCurrentAccount();

    const [status, setStatus] = useState<'loading' | 'deleted'>();
    const [recipientString, setRecipientString] = useState(tresuresAddress.toString({ testOnly: network.isTestnet }));

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
        Keyboard.dismiss();

        backoff('delete_account', async () => {
            if (ended) {
                return;
            }

            setStatus('loading');

            // Check if has nfts
            try {
                const nftsConnection = await fetchNfts(selected!.address.toString({ testOnly: network.isTestnet }), network.isTestnet);
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


            let targetAddress: {
                isBounceable: boolean;
                isTestOnly: boolean;
                address: Address;
            };
            try {
                targetAddress = Address.parseFriendly(recipientString);
            } catch (error) {
                Alert.alert(t('transfer.error.invalidAddress'));
                ended = true;
                setStatus(undefined);
                return;
            }

            // Check target
            const targetState = await backoff('transfer', async () => {
                let block = await backoff('transfer', () => client.getLastBlock());
                return backoff('transfer', () => client.getAccount(block.last.seqno, targetAddress.address))
            });

            const target = {
                isTestOnly: targetAddress.isTestOnly,
                address: targetAddress.address,
                balance: BigInt(targetState.account.balance.coins),
                active: targetState.account.state.type === 'active'
            };

            // Check if trying to send to testnet
            if (!network.isTestnet && target.isTestOnly) {
                let cont = await confirm('transfer.error.addressIsForTestnet');
                if (!cont) {
                    ended = true;
                    setStatus(undefined);
                    return;
                }
            }

            // Check if target is not active
            if (target.balance <= BigInt(0)) {
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
                key = await await authContext.authenticate({ cancelable: true });
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
            if (account && account.balance || BigInt(0) > toNano('0.1')) {
                const contract = await contractFromPublicKey(selected!.publicKey);

                // Check if same address
                if (target.address.equals(contract.address)) {
                    Alert.alert(t('transfer.error.sendingToYourself'));
                    setStatus(undefined);
                    return;
                }

                let seqno = await fetchSeqno(client, await getLastBlock(), selected!.address);

                // Create transfer all & dstr transfer
                let transfer = contract.createTransfer({
                    seqno: seqno,
                    secretKey: key.keyPair.secretKey,
                    sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.DESTROY_ACCOUNT_IF_ZERO, // Transfer full balance & dstr
                    messages: [internal({
                        to: target.address,
                        value: 0n,
                        bounce: false,
                    })]
                });

                // Create external message
                let extMessage = external({
                    to: contract.address,
                    body: transfer,
                    init: seqno === 0 ? contract.init : undefined,
                });

                let msg = beginCell().store(storeMessage(extMessage)).endCell();

                // Sending transaction
                await backoff('delete_account', () => client.sendMessage(msg.toBoc({ idx: false })));

                while (!ended) {
                    let s = await backoff('seqno', async () => fetchSeqno(client, await getLastBlock(), selected!.address));
                    // Check if wallet has been cleared
                    if (s === 0) {
                        setStatus('deleted');
                        ended = true;
                        setTimeout(() => {
                            onAccountDeleted();
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
    }, [recipientString, account, onAccountDeleted]);

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
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('settings.deleteAccount')}
                onBackPressed={navigation.goBack}
                style={{ paddingLeft: 16 }}
            />
            <View style={{ flexGrow: 1, paddingHorizontal: 16, marginTop: 16 }}>
                <View style={{
                    backgroundColor: 'rgba(255, 65, 92, 0.10)',
                    borderRadius: 20, padding: 20,
                    marginBottom: 16
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IcDelete width={24} height={24} color={theme.accentRed} />
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            marginLeft: 12,
                            fontWeight: '600',
                            color: theme.accentRed,
                        }}>
                            {t('common.attention')}
                        </Text>
                    </View>
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: theme.accentRed,
                    }}>
                        {t('logout.logoutDescription')}
                    </Text>
                </View>

                <View style={{
                    marginBottom: 16,
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20,
                }}>
                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                        <IcCheckAddress width={24} height={24} color={theme.accentRed} />
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17, lineHeight: 24,
                            color: theme.textPrimary,
                            marginLeft: 12,
                        }}>
                            {`${t('deleteAccount.checkRecipient')}`}
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: theme.backgroundPrimary,
                        paddingVertical: 20,
                        width: '100%', borderRadius: 20,
                        flexGrow: 1,
                    }}>
                        <View style={{ paddingHorizontal: 6 }}>
                            <ATextInput
                                value={recipientString}
                                onValueChange={(newVal) => setRecipientString(newVal.trim())}
                                keyboardType={'ascii-capable'}
                                multiline
                                autoCorrect={false}
                                autoComplete={'off'}
                                textContentType={'none'}
                                style={{
                                    paddingHorizontal: 10,
                                }}
                                inputStyle={{
                                    fontSize: 17,
                                    fontWeight: '400', color: theme.textPrimary,
                                }}
                                label={t('common.recipientAddress')}
                                blurOnSubmit={true}
                            />
                        </View>
                    </View>
                    {!!invalidAddress && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Text style={{
                                color: theme.accentRed,
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
                        color: theme.textSecondary, marginTop: 4, marginLeft: 16
                    }}>
                        {t('deleteAccount.checkRecipientDescription')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{ marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 0}
            >
                <RoundButton
                    title={t('settings.deleteAccount')}
                    onPress={onContinue}
                    display={'default'}
                    style={{ marginBottom: 16 }}
                />
            </KeyboardAvoidingView>
            {!!status && (status === 'deleted' || status === 'loading') && (
                <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <View style={{ backgroundColor: theme.surfaceOnBg, padding: 16, borderRadius: 16 }}>
                        <LoadingIndicator simple />
                        {status === 'deleted' && (
                            <Text style={{ color: theme.textPrimary }}>
                                {t('deleteAccount.complete')}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
});
