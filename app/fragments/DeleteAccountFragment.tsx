import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, ActionSheetIOS, Alert } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, Cell, SendMode, beginCell, external, internal, storeMessage, toNano } from "@ton/core";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInput } from "../components/ATextInput";
import { CloseButton } from "../components/CloseButton";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { RoundButton } from "../components/RoundButton";
import { contractFromPublicKey } from "../engine/contractFromPublicKey";
import { fragment } from "../fragment";
import { LocalizedResources } from "../i18n/schema";
import { t } from "../i18n/t";
import { KnownWallets } from "../secure/KnownWallets";
import { getCurrentAddress } from "../storage/appState";
import { storage } from "../storage/storage";
import { WalletKeys } from "../storage/walletKeys";
import { useReboot } from "../utils/RebootContext";
import { backoff } from "../utils/time";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import VerifiedIcon from '../../assets/ic_verified.svg';
import { fetchNfts } from "../engine/api/fetchNfts";
import { useTheme } from '../engine/hooks/useTheme';
import { useKeysAuth } from "../components/secure/AuthWalletKeys";
import { useClient4 } from '../engine/hooks/useClient4';
import { onAccountDeleted } from '../engine/effects/onAccountDeleted';
import { useNetwork } from '../engine/hooks/useNetwork';
import { useSelectedAccount } from '../engine/hooks/useSelectedAccount';
import { useAccountLite } from '../engine/hooks/useAccountLite';
import { fetchSeqno } from '../engine/api/fetchSeqno';
import { getLastBlock } from '../engine/accountWatcher';

export const DeleteAccountFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const tresuresAddress = Address.parse(
        isTestnet
            ? 'kQBicYUqh1j9Lnqv9ZhECm0XNPaB7_HcwoBb3AJnYYfqB8S1'
            : 'EQCt2mgAsbnGFKRhlLjiJvScCYbe4lqEHRMvIs-IR7T-1J6p'
    );
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const reboot = useReboot();
    const addr = useSelectedAccount();
    const account = useAccountLite(addr.addressString);
    const client = useClient4(isTestnet);
    const [status, setStatus] = useState<'loading' | 'deleted'>();
    const [targetAddressInput, setTansferAddressInput] = useState(tresuresAddress.toString({ testOnly: isTestnet }));
    const isKnown: boolean = !!KnownWallets(isTestnet)[targetAddressInput];

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
                const nftsConnection = await fetchNfts(addr.address.toString({ testOnly: isTestnet }), isTestnet);
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
                targetAddress = Address.parse(targetAddressInput);
            } catch (error) {
                Alert.alert(t('transfer.error.invalidAddress'));
                ended = true;
                setStatus(undefined);
                return;
            }

            const targetParsed = Address.parseFriendly(targetAddress.toString({ testOnly: isTestnet }));

            // Check target
            const targetState = await backoff('transfer', async () => {
                let block = await backoff('transfer', () => client.getLastBlock());
                return backoff('transfer', () => client.getAccount(block.last.seqno, targetParsed.address))
            });

            const target = {
                isTestOnly: targetParsed.isTestOnly,
                address: targetParsed.address,
                balance: BigInt(targetState.account.balance.coins),
                active: targetState.account.state.type === 'active'
            };

            // Check if trying to send to testnet
            if (!isTestnet && target.isTestOnly) {
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
                const contract = await contractFromPublicKey(addr.publicKey);

                // Check if same address
                if (target.address.equals(contract.address)) {
                    Alert.alert(t('transfer.error.sendingToYourself'));
                    setStatus(undefined);
                    return;
                }

                let seqno = await fetchSeqno(client, await getLastBlock(), addr.address);

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
                    let s = await backoff('seqno', async () => fetchSeqno(client, await getLastBlock(), addr.address));
                    // Check if wallet has been cleared
                    if (s === 0) {
                        setStatus('deleted');
                        ended = true;
                        setTimeout(() => {
                           onAccountDeleted(isTestnet);
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
    }, [targetAddressInput]);

    const onContinue = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: t('deleteAccount.confirm.title'),
                    message: t('deleteAccount.confirm.message'),
                    options: [t('common.cancel'), t('deleteAccount.action')],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0
                },
                (buttonIndex) => { if (buttonIndex === 1) onDeleteAccount(); }
            );
        } else {
            Alert.alert(
                t('deleteAccount.confirm.title'),
                t('deleteAccount.confirm.message'),
                [{
                    text: t('deleteAccount.action'), style: 'destructive', onPress: () => { onDeleteAccount() }
                }, { text: t('common.cancel') }])
        }
    }, [onDeleteAccount]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('deleteAccount.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('deleteAccount.title')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    paddingHorizontal: 16
                }}>
                    <View style={{ marginRight: 10, marginLeft: 10, marginTop: 8 }}>
                        <Text style={{ color: theme.textColor, fontSize: 14 }}>
                            {t('deleteAccount.description', { amount: '0.1' })}
                        </Text>
                    </View>

                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ATextInput
                            value={targetAddressInput}
                            onValueChange={setTansferAddressInput}
                            placeholder={t('common.walletAddress')}
                            keyboardType="ascii-capable"
                            preventDefaultHeight
                            label={
                                <View style={{
                                    flexDirection: 'row',
                                    width: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    overflow: 'hidden',
                                }}>
                                    <Text style={{
                                        fontWeight: '500',
                                        fontSize: 12,
                                        color: theme.label,
                                        alignSelf: 'flex-start',
                                    }}>
                                        {t('transfer.sendTo')}
                                    </Text>
                                    {isKnown && (
                                        <Animated.View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            entering={FadeIn.duration(150)}
                                            exiting={FadeOut.duration(150)}
                                        >
                                            <VerifiedIcon
                                                width={14}
                                                height={14}
                                                style={{ alignSelf: 'center', marginRight: 4 }}
                                            />
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 12,
                                                color: theme.labelSecondary,
                                                alignSelf: 'flex-start',
                                            }}>
                                                {KnownWallets(isTestnet)[targetAddressInput].name}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </View>
                            }
                            multiline
                            autoCorrect={false}
                            autoComplete={'off'}
                            style={{
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                <RoundButton
                    title={t('deleteAccount.action')}
                    onPress={onContinue}
                    display={'danger_zone'}
                />
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
            {!!status && (status === 'deleted' || status === 'loading') && (
                <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <View style={{ backgroundColor: theme.item, padding: 16, borderRadius: 16 }}>
                        <LoadingIndicator simple />
                        {status === 'deleted' && (
                            <Text style={{ color: theme.textColor }}>
                                {t('deleteAccount.complete')}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
});