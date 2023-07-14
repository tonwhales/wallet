import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Image, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from 'ton';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useEngine } from '../../engine/Engine';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { t } from '../../i18n/t';
import MessageIcon from '../../../assets/ic_message.svg';
import { KnownJettonMasters, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { createJettonOrder, createSimpleOrder } from './ops/Order';
import { useItem } from '../../engine/persistence/PersistedItem';
import { estimateFees } from '../../engine/estimate/estimateFees';
import { useRecoilValue } from 'recoil';
import { useLinkNavigator } from "../../useLinkNavigator";
import { fromBNWithDecimals, toBNWithDecimals } from '../../utils/withDecimals';
import { AddressDomainInput } from '../../components/AddressDomainInput';
import { useParams } from '../../utils/useParams';
import { useAppConfig } from '../../utils/AppConfigContext';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useCallback, useMemo } from 'react';
import { WImage } from '../../components/WImage';

import Verified from '../../../assets/ic-verified.svg';
import TonIcon from '../../../assets/ic_ton_account.svg';
import Chevron from '../../../assets/ic_chevron_forward.svg';
import { JettonWalletState } from '../../engine/sync/startJettonWalletSync';
import { JettonMasterState } from '../../engine/sync/startJettonMasterSync';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    fontSize: 17
};

export type SimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: BN | null,
    stateInit?: Cell | null,
    job?: string | null,
    jetton?: Address | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    app?: {
        domain: string,
        title: string
    }
}

export const SimpleTransferFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const params: SimpleTransferParams | undefined = useParams();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();
    const acc = React.useMemo(() => getCurrentAddress(), []);

    const [target, setTarget] = React.useState(params?.target || '');
    const [addressDomainInput, setAddressDomainInput] = React.useState(target);
    const [domain, setDomain] = React.useState<string>();
    const [comment, setComment] = React.useState(params?.comment || '');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = React.useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = React.useState<BN | null>(null);

    const jettonWallet = params && params.jetton ? engine.model.jettonWallet(params.jetton).value : null;
    const jettonMaster = jettonWallet && jettonWallet.master ? engine.model.jettonMaster(jettonWallet.master).value : null;
    const [jetton, setJetton] = React.useState<{ master: JettonMasterState, wallet: JettonWalletState } | null>(
        (jettonMaster && jettonWallet) ? { master: jettonMaster, wallet: jettonWallet } : null
    );
    const isVerified = useMemo(() => {
        if (!jetton || !jetton.wallet.master) {
            return true;
        }
        return !!KnownJettonMasters(AppConfig.isTestnet)[jetton.wallet.master.toFriendly({ testOnly: AppConfig.isTestnet })];
    }, [jetton]);

    const balance = React.useMemo(() => {
        let value;
        if (jetton) {
            value = jetton.wallet.balance;
        } else {
            value = account.balance;
        }
        return value;
    }, [jetton, account.balance]);

    const callback: ((ok: boolean, result: Cell | null) => void) | null = params && params.callback ? params.callback : null;

    // Auto-cancel job
    React.useEffect(() => {
        return () => {
            if (params && params.job) {
                engine.products.apps.commitCommand(false, params.job, new Cell());
            }
            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);

    // Resolve order
    const order = React.useMemo(() => {

        // Parse value
        let value: BN;
        try {
            const validAmount = amount.replace(',', '.').trim();
            // Manage jettons with decimals
            if (jettonWallet) {
                value = toBNWithDecimals(validAmount, jettonMaster?.decimals);
            } else {
                value = toNano(validAmount);
            }
        } catch (e) {
            return null;
        }

        // Parse address
        let address: Address;
        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
        } catch (e) {
            return null;
        }

        // Resolve jetton order
        if (jettonWallet) {
            return createJettonOrder({
                wallet: params!.jetton!,
                target: target,
                domain: domain,
                responseTarget: acc.address,
                text: comment,
                amount: value,
                tonAmount: toNano(0.1),
                txAmount: toNano(0.2),
                payload: null
            }, AppConfig.isTestnet);
        }

        // Resolve order
        return createSimpleOrder({
            target: target,
            domain: domain,
            text: comment,
            payload: null,
            amount: value.eq(account.balance) ? toNano('0') : value,
            amountAll: value.eq(account.balance),
            stateInit,
            app: params?.app
        });

    }, [amount, target, domain, comment, stateInit, jettonWallet, jettonMaster, params?.app]);

    const doSend = React.useCallback(async () => {

        let address: Address;
        let isTestOnly: boolean;
        let value: BN;

        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
            isTestOnly = parsed.isTestOnly;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        try {
            const validAmount = amount.replace(',', '.');
            // Manage jettons with decimals
            if (jettonWallet) {
                value = toBNWithDecimals(validAmount, jettonMaster?.decimals);
            } else {
                value = toNano(validAmount);
            }
        } catch (e) {
            console.warn(e);
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        if (value.isNeg()) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        // Might not happen
        if (!order) {
            return;
        }

        // Load contract
        const contract = await contractFromPublicKey(acc.publicKey);

        // Check if same address
        if (address.equals(contract.address)) {
            Alert.alert(t('transfer.error.sendingToYourself'));
            return;
        }

        // Check amount
        if (!value.eq(balance) && balance.lt(value)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (value.eq(new BN(0))) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        // Navigate to transaction confirmation
        navigation.navigateTransfer({
            text: comment,
            order,
            job: params && params.job ? params.job : null,
            callback,
            back: params && params.back ? params.back + 1 : undefined
        })
    }, [amount, target, domain, comment, account.seqno, stateInit, order, callback, jettonWallet, jettonMaster]);

    // Estimate fee
    const config = engine.products.config.useConfig();
    const accountState = useRecoilValue(engine.persistence.liteAccounts.item(engine.address).atom);
    const lock = React.useMemo(() => {
        return new AsyncLock();
    }, []);
    React.useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff('simple-transfer', async () => {
                if (ended) {
                    return;
                }

                // Load app state
                const appState = getCurrentAddress();

                // Parse order
                let intMessage: InternalMessage;
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY;
                if (!order) {
                    intMessage = new InternalMessage({
                        to: appState.address,
                        value: new BN(0),
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: stateInit ? new CellMessage(stateInit) : null,
                            body: new CommentMessage(comment)
                        })
                    });
                } else {
                    intMessage = new InternalMessage({
                        to: Address.parse(order.messages[0].target),
                        value: order.messages[0].amount,
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: order.messages[0].stateInit ? new CellMessage(order.messages[0].stateInit) : null,
                            body: order.messages[0].payload ? new CellMessage(order.messages[0].payload) : null
                        })
                    });
                    if (order.messages[0].amountAll) {
                        sendMode = SendMode.CARRRY_ALL_REMAINING_BALANCE;
                    }
                }

                // Load contract
                const contract = await contractFromPublicKey(appState.publicKey);

                // Create transfer
                let transfer = await contract.createTransfer({
                    seqno: account.seqno,
                    walletId: contract.source.walletId,
                    secretKey: null,
                    sendMode,
                    order: intMessage
                });
                if (ended) {
                    return;
                }

                // Resolve fee
                if (config && accountState) {
                    let inMsg = new Cell();
                    new ExternalMessage({
                        to: contract.address,
                        body: new CommonMessageInfo({
                            stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                            body: new CellMessage(transfer)
                        })
                    }).writeTo(inMsg);
                    let outMsg = new Cell();
                    intMessage.writeTo(outMsg);
                    let local = estimateFees(config, inMsg, [outMsg], [accountState.storageStats]);
                    setEstimation(local);
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, account.seqno, config, accountState, comment]);

    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src, AppConfig.isTestnet);
        if (res && res.type === 'transaction') {
            if (res.payload) {
                navigation.goBack();
                linkNavigator(res);
            } else {
                setAddressDomainInput(res.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                if (res.amount) {
                    setAmount(fromNano(res.amount));
                }
                if (res.comment) {
                    setComment(res.comment);
                }
                if (res.stateInit) {
                    setStateInit(res.stateInit);
                } else {
                    setStateInit(null);
                }
            }
        }
    }, []);

    const onAddAll = React.useCallback(() => {
        setAmount(jettonWallet ? fromBNWithDecimals(balance, jettonMaster?.decimals) : fromNano(balance));
    }, [balance, jettonWallet, jettonMaster]);

    //
    // Scroll state tracking
    //

    const [selectedInput, setSelectedInput] = React.useState(0);

    const refs = React.useMemo(() => {
        let r: React.RefObject<ATextInputRef>[] = [];
        for (let i = 0; i < 3; i++) {
            r.push(React.createRef());
        }
        return r;
    }, []);

    const keyboard = useKeyboard();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const containerRef = useAnimatedRef<View>();

    const scrollToInput = React.useCallback((index: number) => {
        'worklet';

        if (index === 0) {
            scrollTo(scrollRef, 0, 0, true);
            return;
        }

        let container = measure(containerRef);
        if (Platform.OS !== 'android' && container) {
            scrollTo(scrollRef, 0, container.height, true);
        }
        if (Platform.OS === 'android') {
            scrollTo(scrollRef, 0, 400, true);
        }
        return;

    }, []);

    const keyboardHeight = useSharedValue(keyboard.keyboardShown ? keyboard.keyboardHeight : 0);
    React.useEffect(() => {
        keyboardHeight.value = keyboard.keyboardShown ? keyboard.keyboardHeight : 0;
        if (keyboard.keyboardShown) {
            runOnUI(scrollToInput)(selectedInput);
        }
    }, [keyboard.keyboardShown ? keyboard.keyboardHeight : 0, selectedInput]);

    const onFocus = React.useCallback((index: number) => {
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = React.useCallback((index: number) => {
        let next = refs[index + 1].current;
        if (next) {
            next.focus();
        }
    }, []);

    const onAssetSelected = useCallback((address?: Address) => {
        if (address) {
            const jetton = engine.products.main.getJettons().jettons.find((jetton) => jetton.master.equals(address));

            if (jetton) {
                const walletState = engine.persistence.jettonWallets.item(jetton.wallet).value;
                const masterState = engine.persistence.jettonMasters.item(jetton.master).value;

                if (walletState && masterState) {
                    setJetton({ wallet: walletState, master: masterState });
                    return;
                }
            }
        }
        setJetton(null);
    }, []);

    const isKnown: boolean = !!KnownWallets(AppConfig.isTestnet)[target];
    const contact = engine.products.settings.useContact(target);

    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader title={t('transfer.title')} onClosePressed={navigation.goBack} />
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom - 16) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                ref={scrollRef}
                scrollEventThrottle={16}
            >
                <View
                    ref={containerRef}
                    style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}
                >
                    <View style={{
                        backgroundColor: Theme.lightGrey,
                        borderRadius: 20, padding: 20, marginTop: 16
                    }}>
                        <Pressable
                            style={({ pressed }) => {
                                return { opacity: pressed ? 0.5 : 1 }
                            }}
                            onPress={() => {
                                navigation.navigate('Assets', { callback: onAssetSelected, selectedJetton: jetton?.master });
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                }}>
                                    <View style={{ height: 46, width: 46, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        {!!jetton && (
                                            <WImage
                                                src={jetton.master.image?.preview256}
                                                blurhash={jetton.master.image?.blurhash}
                                                width={46}
                                                heigh={46}
                                                borderRadius={23}
                                                lockLoading
                                            />
                                        )}
                                        {!jetton && (
                                            <TonIcon width={46} height={46} />
                                        )}
                                        {isVerified && (
                                            <Verified
                                                height={16} width={16}
                                                style={{
                                                    height: 16, width: 16,
                                                    position: 'absolute', right: -2, bottom: -2,
                                                }}
                                            />
                                        )}
                                    </View>
                                    <View style={{ justifyContent: 'space-between' }}>
                                        <Text style={{
                                            fontSize: 17,
                                            color: Theme.textColor,
                                            fontWeight: '600',
                                            lineHeight: 24
                                        }}>
                                            {`${jetton?.master.symbol ?? 'TON'}`}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontWeight: '400',
                                                lineHeight: 20,
                                                color: Theme.price,
                                            }}
                                            selectable={false}
                                            ellipsizeMode={'middle'}
                                        >
                                            {`${jetton?.master.description ?? 'The Open Network'}`}
                                        </Text>
                                    </View>
                                </View>
                                <Chevron style={{ height: 16, width: 16 }} height={16} width={16} />
                            </View>
                        </Pressable>
                    </View>
                    <View style={{
                        marginTop: 20,
                        marginBottom: 16,
                        backgroundColor: Theme.lightGrey,
                        borderRadius: 20,
                        justifyContent: 'center',
                        padding: 20
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            marginBottom: 12,
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15, lineHeight: 20,
                                color: Theme.darkGrey,
                            }}>
                                {`${t('common.balance')}: ` + (jetton
                                    ? fromBNWithDecimals(balance, jetton.master?.decimals) + ` ${jetton.master.symbol}`
                                    : fromNano(balance) + ' TON')
                                }
                            </Text>
                            <Pressable
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1
                                    }
                                }}
                                onPress={onAddAll}
                            >
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 15, lineHeight: 20,
                                    color: Theme.mainViolet,
                                }}>
                                    {t('transfer.sendAll')}
                                </Text>
                            </Pressable>
                        </View>
                        <ATextInput
                            index={0}
                            ref={refs[0]}
                            onFocus={onFocus}
                            value={amount}
                            onValueChange={setAmount}
                            placeholder={jetton ? jetton.master.symbol ?? 'TON' : 'TON'}
                            keyboardType={'numeric'}
                            style={{
                                backgroundColor: 'white',
                                justifyContent: 'center', alignItems: 'center',
                                paddingHorizontal: 16, paddingVertical: 14,
                                borderRadius: 16,
                            }}
                            inputStyle={{
                                height: undefined,
                                fontSize: 17,
                                fontWeight: '400',
                                paddingTop: 0, paddingBottom: 0,
                                color: Theme.textColor,
                                flexShrink: 1
                            }}
                            preventDefaultHeight
                            preventDefaultLineHeight
                            preventDefaultValuePadding
                            blurOnSubmit={false}
                        />
                    </View>
                    <AddressDomainInput
                        input={addressDomainInput}
                        onInputChange={setAddressDomainInput}
                        target={target}
                        index={1}
                        ref={refs[1]}
                        onFocus={onFocus}
                        onTargetChange={setTarget}
                        onDomainChange={setDomain}
                        style={{
                            margin: 0, padding: 20, paddingTop: 10,
                            backgroundColor: Theme.lightGrey,
                        }}
                        inputStyle={{
                            marginHorizontal: 0,
                            marginVertical: 0,
                            paddingBottom: 0, paddingTop: 0,
                            fontSize: 17,
                            fontWeight: '400', color: Theme.textColor,
                        }}
                        isKnown={isKnown}
                        onSubmit={onSubmit}
                        contact={contact}
                    />
                    <ATextInput
                        value={comment}
                        index={2}
                        ref={refs[2]}
                        onFocus={onFocus}
                        onValueChange={setComment}
                        placeholder={isKnown ? t('transfer.commentRequired') : t('transfer.comment')}
                        keyboardType={'default'}
                        autoCapitalize={'sentences'}
                        style={{
                            backgroundColor: Theme.lightGrey,
                            padding: 20, marginTop: 20
                        }}
                        inputStyle={{
                            marginHorizontal: 0,
                            marginVertical: 0,
                            paddingBottom: 0, paddingTop: 0,
                            fontSize: 17,
                            fontWeight: '400', color: Theme.textColor,
                        }}
                        preventDefaultHeight
                        multiline
                    />
                    <Text
                        style={{
                            color: Theme.darkGrey,
                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                            marginTop: 16,
                        }}>
                        {t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}
                    </Text>
                </View>
            </Animated.ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <RoundButton
                    title={t('common.continue')}
                    action={doSend}
                />
            </KeyboardAvoidingView>
        </>
    );
});