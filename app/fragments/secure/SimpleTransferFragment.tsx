import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Image, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ATextInput, ATextInputRef } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { useEngine } from '../../engine/Engine';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { t } from '../../i18n/t';
import MessageIcon from '../../../assets/ic_message.svg';
import { KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { createJettonOrder, createSimpleOrder } from './ops/Order';
import { useItem } from '../../engine/persistence/PersistedItem';
import { estimateFees } from '../../engine/estimate/estimateFees';
import { useRecoilValue } from 'recoil';
import { useLinkNavigator } from "../../useLinkNavigator";
import { fromBNWithDecimals, toBNWithDecimals } from '../../utils/withDecimals';
import { AddressDomainInput } from '../../components/AddressDomainInput';
import { useAppConfig } from '../../utils/AppConfigContext';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

export const SimpleTransferFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const params: {
        target?: string,
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
    } | undefined = useRoute().params;
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();

    const [target, setTarget] = React.useState(params?.target || '');
    const [addressDomainInput, setAddressDomainInput] = React.useState(target);
    const [domain, setDomain] = React.useState<string>();
    const [comment, setComment] = React.useState(params?.comment || '');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit, setStateInit] = React.useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = React.useState<BN | null>(null);
    const acc = React.useMemo(() => getCurrentAddress(), []);
    const jettonWallet = params && params.jetton ? useItem(engine.model.jettonWallet(params.jetton!)) : null;
    const jettonMaster = jettonWallet ? useItem(engine.model.jettonMaster(jettonWallet.master!)) : null;
    const symbol = jettonMaster ? jettonMaster.symbol! : 'TON'
    const balance = React.useMemo(() => {
        let value;
        if (jettonWallet) {
            value = jettonWallet.balance;
        } else {
            value = account.balance;
        }
        return value;
    }, [jettonWallet, jettonMaster, account.balance]);
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
        scrollTo(scrollRef, 0, Platform.OS === 'android' ? 400 : container.height, true);
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

    const isKnown: boolean = !!KnownWallets(AppConfig.isTestnet)[target];
    const contact = engine.products.settings.useContact(target);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('transfer.title', { symbol })} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('transfer.title', { symbol })}</Text>
                </View>
            )}
            <Animated.ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
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
                        marginBottom: 16,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 15
                    }}>
                        <ATextInput
                            index={0}
                            ref={refs[0]}
                            onFocus={onFocus}
                            value={amount}
                            onValueChange={setAmount}
                            placeholder={'0'}
                            keyboardType={'numeric'}
                            textAlign={'center'}
                            style={{ backgroundColor: Theme.transparent }}
                            fontWeight={'800'}
                            fontSize={30}
                            preventDefaultHeight
                            preventDefaultLineHeight
                            preventDefaultValuePadding
                            blurOnSubmit={false}
                        />
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 16,
                            color: Theme.priceSecondary,
                            marginBottom: 5
                        }}>
                            {jettonWallet ? fromBNWithDecimals(balance, jettonMaster?.decimals) : fromNano(balance)} {symbol}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }} collapsable={false}>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: Theme.item, borderRadius: 14 }}>
                            <Pressable
                                onPress={onAddAll}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? Theme.selector
                                            : Theme.item,
                                    },
                                    { borderRadius: 14 }
                                ]}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                    <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('../../../assets/ic_all_coins.png')} />
                                    </View>
                                    <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('transfer.sendAll')}</Text>
                                </View>
                            </Pressable>
                        </View>
                        <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: Theme.item, borderRadius: 14 }}>
                            <Pressable
                                onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed
                                            ? Theme.selector
                                            : Theme.item,
                                    },
                                    { borderRadius: 14 }
                                ]}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', height: 66, borderRadius: 14 }}>
                                    <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('../../../assets/ic_scan_qr.png')} />
                                    </View>
                                    <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('transfer.scanQR')}</Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
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
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            isKnown={isKnown}
                            onSubmit={onSubmit}
                            contact={contact}
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                        <ATextInput
                            value={comment}
                            index={2}
                            ref={refs[2]}
                            onFocus={onFocus}
                            onValueChange={setComment}
                            placeholder={isKnown ? t('transfer.commentRequired') : t('transfer.comment')}
                            keyboardType="default"
                            autoCapitalize="sentences"
                            style={{ backgroundColor: Theme.transparent, paddingHorizontal: 0, marginHorizontal: 16 }}
                            preventDefaultHeight
                            multiline
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
                                        {t('transfer.commentLabel')}
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
                                            <MessageIcon
                                                width={12}
                                                height={12}
                                                style={{ alignSelf: 'center', marginRight: 4 }}
                                            />
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 12,
                                                color: Theme.labelSecondary,
                                                alignSelf: 'flex-start',
                                            }}>
                                                {t('transfer.checkComment')}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </View>
                            }
                        />
                    </View>
                    <Text style={{ color: Theme.priceSecondary, marginLeft: 16, fontSize: 13 }}>{t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}</Text>
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
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )
            }
        </>
    );
});