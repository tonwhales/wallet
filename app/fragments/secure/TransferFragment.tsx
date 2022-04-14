import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Image, KeyboardAvoidingView, Keyboard, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, fromNano, InternalMessage, SendMode, toNano } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ATextInput } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { Theme } from '../../Theme';
import { contractFromPublicKey } from '../../sync/contractFromPublicKey';
import { resolveUrl } from '../../utils/resolveUrl';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { useRoute } from '@react-navigation/native';
import { useAccount } from '../../sync/Engine';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../storage/appState';
import { AppConfig } from '../../AppConfig';
import { fetchConfig } from '../../sync/fetchConfig';
import { t } from '../../i18n/t';
import { LocalizedResources } from '../../i18n/schema';
import VerifiedIcon from '../../../assets/ic_verified.svg';
import MessageIcon from '../../../assets/ic_message.svg';
import { KnownWallets } from '../../secure/KnownWallets';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

export type ATextInputRef = {
    focus: () => void;
}

export const TransferFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const params: {
        target?: string,
        comment?: string | null,
        amount?: BN | null,
        payload?: Cell | null,
        stateInit?: Cell | null,
        job?: string | null
    } | undefined = useRoute().params;
    const [account, engine] = useAccount();
    const safeArea = useSafeAreaInsets();

    const [target, setTarget] = React.useState(params?.target || '');
    const [comment, setComment] = React.useState(params?.comment || '');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '0');
    const [payload, setPayload] = React.useState<Cell | null>(params?.payload || null);
    const [stateInit, setStateInit] = React.useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = React.useState<BN | null>(null);
    const acc = React.useMemo(() => getCurrentAddress(), []);
    React.useEffect(() => {
        return () => {
            if (params && params.job) {
                engine.products.apps.commitCommand(false, params.job, new Cell());
            }
        }
    }, []);
    const doSend = React.useCallback(async () => {

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


        let address: Address;
        let isTestnet: boolean;
        let value: BN;

        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
            isTestnet = parsed.isTestOnly;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        try {
            const validAmount = amount.replace(',', '.');
            value = toNano(validAmount);
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAmount'));
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
        if (!value.eq(account.balance) && account.balance.lt(value)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (value.eq(new BN(0))) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Check if trying to send to testnet
        if (!AppConfig.isTestnet && isTestnet) {
            let cont = await confirm('transfer.error.addressIsForTestnet');
            if (!cont) {
                return;
            }
        }

        // Check against config
        const config = await backoff(() => fetchConfig());
        for (let restricted of config.wallets.restrict_send) {
            if (Address.parse(restricted).equals(address)) {
                let cont = await confirm('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
                break;
            }
        }

        // Check bounce flag
        let bounce = true;
        if (!(await backoff(() => engine.connector.client.isContractDeployed(address)))) {
            bounce = false;
            if ((await backoff(() => engine.connector.client.getBalance(address))).eq(new BN(0))) {
                let cont = await confirm('transfer.error.addressIsNotActive');
                if (!cont) {
                    return;
                }
            }
        }

        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            navigation.goBack();
            return;
        }

        // Create transfer
        let transfer = await contract.createTransfer({
            seqno: account.seqno,
            walletId: contract.source.walletId,
            secretKey: walletKeys.keyPair.secretKey,
            sendMode: value.eq(account.balance)
                ? SendMode.CARRRY_ALL_REMAINING_BALANCE
                : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
            order: new InternalMessage({
                to: address,
                value: value.eq(account.balance) ? toNano('0') : value,
                bounce,
                body: new CommonMessageInfo({
                    stateInit: stateInit ? new CellMessage(stateInit) : null,
                    body: payload ? new CellMessage(payload) : new CommentMessage(comment)
                })
            })
        });

        // Resolve fees
        const fee = await backoff(() => engine.connector.estimateExternalMessageFee(contract, transfer));

        // Sending transfer
        await backoff(() => engine.connector.sendExternalMessage(contract, transfer));

        // Notify job
        if (params && params.job) {
            engine.products.apps.commitCommand(true, params.job, new Cell());
        }

        // Notify
        engine.registerPending({
            id: 'pending-' + account.seqno,
            lt: null,
            fees: fee,
            amount: value.mul(new BN(-1)),
            address,
            seqno: account.seqno,
            kind: 'out',
            body: null,
            status: 'pending',
            time: Math.floor(Date.now() / 1000)
        });

        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        // Reset stack to root
        navigation.popToTop();
    }, [amount, target, comment, account.seqno, payload, stateInit]);

    // Estimate fee
    const lock = React.useMemo(() => {
        return new AsyncLock();
    }, []);
    React.useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff(async () => {
                if (ended) {
                    return;
                }

                // Load app state
                const appState = getCurrentAddress();
                if (!appState) {
                    return;
                }

                // Parse address and value
                let address: Address;
                let value: BN;
                try {
                    address = Address.parseFriendly(target).address;
                    value = toNano(amount);
                } catch (e) {
                    address = appState.address;
                    value = new BN(0);
                }

                // Load contract
                const contract = await contractFromPublicKey(appState.publicKey);
                if (ended) {
                    return;
                }

                // Create transfer
                let transfer = await contract.createTransfer({
                    seqno: account.seqno,
                    walletId: contract.source.walletId,
                    secretKey: null,
                    sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                    order: new InternalMessage({
                        to: address,
                        value,
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: stateInit ? new CellMessage(stateInit) : null,
                            body: payload ? new CellMessage(payload) : new CommentMessage(comment)
                        })
                    })
                });
                if (ended) {
                    return;
                }

                // Check fees
                const fee = await engine.connector.estimateExternalMessageFee(contract, transfer);
                if (ended) {
                    return;
                }
                setEstimation(fee);
            });
        });
        return () => {
            ended = true;
        }
    }, [amount, target, comment, account.seqno, payload, stateInit]);

    const onQRCodeRead = React.useCallback((src: string) => {
        let res = resolveUrl(src);
        if (res && res.type === 'transaction') {
            setTarget(res.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            if (res.amount) {
                setAmount(fromNano(res.amount));
            }
            if (res.comment) {
                setComment(res.comment);
            }
            if (res.payload) {
                setPayload(res.payload);
            } else {
                setPayload(null);
            }
            if (res.stateInit) {
                setStateInit(res.stateInit);
            } else {
                setStateInit(null);
            }
        }
    }, []);

    const onAddAll = React.useCallback(() => {
        setAmount(fromNano(account.balance));
    }, [setAmount, account]);

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
        if (index === 0 && amount === '0') {
            setAmount('');
        }
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
    }, []);

    const onSubmit = React.useCallback((index: number) => {
        let next = refs[index + 1].current;
        console.log('[onSubmit] next', index, next);
        if (next) {
            next.focus();
        }
    }, []);

    const isKnown: boolean = !!KnownWallets[target];

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t(payload ? 'transfer.titleAction' : 'transfer.title')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t(payload ? 'transfer.titleAction' : 'transfer.title')}</Text>
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
                    {payload && (
                        <View style={{
                            marginBottom: 14,
                            backgroundColor: "white",
                            borderRadius: 14,
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 19
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: '#8E979D'
                            }}>
                                {t('common.amount')}
                            </Text>
                            <Text style={{
                                fontWeight: '800',
                                fontSize: 38,
                                color: Theme.accent,
                                marginTop: 4
                            }}>
                                {amount}
                            </Text>
                        </View>
                    )}
                    {!payload && (
                        <>
                            <View style={{
                                marginBottom: 16,
                                backgroundColor: "white",
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
                                    style={{ backgroundColor: 'transparent' }}
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
                                    color: '#6D6D71',
                                    marginBottom: 5
                                }}>
                                    {fromNano(account?.balance || new BN(0))} TON
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row' }} collapsable={false}>
                                <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, backgroundColor: 'white', borderRadius: 14 }}>
                                    <Pressable
                                        onPress={onAddAll}
                                        style={({ pressed }) => [
                                            {
                                                backgroundColor: pressed
                                                    ? Theme.selector
                                                    : 'white',
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
                                <View style={{ flexGrow: 1, flexBasis: 0, marginLeft: 7, backgroundColor: 'white', borderRadius: 14 }}>
                                    <Pressable
                                        onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                                        style={({ pressed }) => [
                                            {
                                                backgroundColor: pressed
                                                    ? Theme.selector
                                                    : 'white',
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
                        </>
                    )}
                    <View style={{
                        marginBottom: 16, marginTop: payload ? 0 : 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ATextInput
                            value={target}
                            index={1}
                            ref={refs[1]}
                            onFocus={onFocus}
                            onValueChange={setTarget}
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
                                        color: '#7D858A',
                                        alignSelf: 'flex-start',
                                    }}>
                                        {payload ? t('common.walletAddress') : t('transfer.sendTo')}
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
                                                color: '#858B93',
                                                alignSelf: 'flex-start',
                                            }}>
                                                {KnownWallets[target].name}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </View>
                            }
                            multiline
                            autoCorrect={false}
                            autoCompleteType={'off'}
                            inputStyle={[
                                {},
                                payload ? { paddingTop: 4 } : undefined,
                            ]}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0,
                                marginHorizontal: 16,
                            }}
                            enabled={!payload}
                            editable={!payload}
                            onSubmit={onSubmit}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                        <ATextInput
                            value={comment}
                            index={2}
                            ref={refs[2]}
                            onFocus={onFocus}
                            onValueChange={setComment}
                            placeholder={isKnown ? t('transfer.commentReuiered') : t('transfer.comment')}
                            keyboardType="default"
                            autoCapitalize="sentences"
                            inputStyle={payload ? { paddingTop: 4 } : undefined}
                            style={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginHorizontal: 16 }}
                            enabled={!payload}
                            editable={!payload}
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
                                        color: '#7D858A',
                                        alignSelf: 'flex-start',
                                    }}>
                                        {payload ? t('transfer.purpose') : t('transfer.commentLabel')}
                                    </Text>
                                    {isKnown && !payload && (
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
                                                color: '#858B93',
                                                alignSelf: 'flex-start',
                                            }}>
                                                {t('transfer.checkComment')}
                                            </Text>
                                        </Animated.View>
                                    )}
                                </View>
                            }
                        />
                        {payload && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    color: '#8E979D',
                                    alignSelf: 'flex-start',
                                    marginTop: 10,
                                    marginBottom: 10,
                                    marginLeft: 16
                                }}>
                                    {t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}
                                </Text>
                            </>

                        )}
                    </View>
                    {!payload && (<Text style={{ color: '#6D6D71', marginLeft: 16, fontSize: 13 }}>{t('transfer.fee', { fee: estimation ? fromNano(estimation) : '...' })}</Text>)}
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
                    title={t('common.send')}
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