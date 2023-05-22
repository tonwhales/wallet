import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
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
import { storage } from "../storage/storage";
import { WalletKeys } from "../storage/walletKeys";
import { useReboot } from "../utils/RebootContext";
import { backoff } from "../utils/time";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import VerifiedIcon from '../../assets/ic_verified.svg';
import { fetchNfts } from "../engine/api/fetchNfts";
import { clearZenPay } from "./LogoutFragment";
import { useAppConfig } from "../utils/AppConfigContext";
import { useAppStateManager } from "../engine/AppStateManager";
import { useActionSheet } from "@expo/react-native-action-sheet";

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
    const [targetAddressInput, setTansferAddressInput] = useState(tresuresAddress.toFriendly({ testOnly: AppConfig.isTestnet }));
    const isKnown: boolean = !!KnownWallets(AppConfig.isTestnet)[targetAddressInput];

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
                targetAddress = Address.parse(targetAddressInput);
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
                await backoff('delete_account', () => engine.client4.sendMessage(msg.toBoc({ idx: false })));

                while (!ended) {
                    let s = await backoff('seqno', () => contract.getSeqNo(engine.connector.client));
                    // Check if wallet has been cleared
                    if (s === 0) {
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
                                clearZenPay(engine);
                                reboot();
                                return;
                            }

                            clearZenPay(engine, currentAddress);

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
    }, [targetAddressInput]);

    const onContinue = React.useCallback(() => {
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

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('deleteAccount.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
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
                        <Text style={{ color: Theme.textColor, fontSize: 14 }}>
                            {t('deleteAccount.description', { amount: '0.1' })}
                        </Text>
                    </View>

                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: Theme.item,
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
                                        color: Theme.label,
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
                                                color: Theme.labelSecondary,
                                                alignSelf: 'flex-start',
                                            }}>
                                                {KnownWallets(AppConfig.isTestnet)[targetAddressInput].name}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </View>
                            }
                            multiline
                            autoCorrect={false}
                            autoComplete={'off'}
                            style={{
                                backgroundColor: Theme.transparent,
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
                    <View style={{ backgroundColor: Theme.item, padding: 16, borderRadius: 16 }}>
                        <LoadingIndicator simple />
                        {status === 'deleted' && (
                            <Text style={{ color: Theme.textColor }}>
                                {t('deleteAccount.complete')}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
});