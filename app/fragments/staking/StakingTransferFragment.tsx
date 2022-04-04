import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, KeyboardAvoidingView, Keyboard, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useSharedValue, useAnimatedRef, measure, scrollTo, runOnUI } from 'react-native-reanimated';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, fromNano, InternalMessage, SendMode, toNano } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ATextInput } from '../../components/ATextInput';
import { CloseButton } from '../../components/CloseButton';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { Theme } from '../../Theme';
import { contractFromPublicKey } from '../../sync/contractFromPublicKey';
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
import { PriceComponent } from '../../components/PriceComponent';
import { StakingCalcComponent } from '../../components/Staking/StakingCalcComponent';
import { PoolTransactionInfo } from '../../components/Staking/PoolTransactionInfo';
import { createWithdrawStakeCell } from '../../utils/createWithdrawStakeCommand';
import { StakingCycle } from "../../components/Staking/StakingCycle";
import { UnstakeBanner } from '../../components/Staking/UnstakeBanner';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    fontSize: 17
};

export type ATextInputRef = {
    focus: () => void;
    blur: () => void;
}

export type StakingTransferParams = {
    target?: string,
    comment?: string | null,
    amount?: BN | null,
    minAmount?: BN | null
    payload?: Cell | null,
    stateInit?: Cell | null,
    lockAmount?: boolean,
    lockComment?: boolean,
    lockAddress?: boolean,
    goBack?: boolean,
    action?: 'deposit' | 'withdraw' | 'top_up'
    job?: string | null,
    navigateToStakingAfter?: boolean
}

export const StakingTransferFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const params: StakingTransferParams | undefined = useRoute().params;
    const [account, engine] = useAccount();
    const safeArea = useSafeAreaInsets();
    const pool = engine.products.stakingPool.useState();
    const address = React.useMemo(() => getCurrentAddress().address, []);

    const member = pool
        ?.members
        .find((m) => {
            return m.address
                .toFriendly({ testOnly: AppConfig.isTestnet }) === address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        });

    const [title, setTitle] = React.useState('');
    const [target, setTarget] = React.useState(params?.target || '');
    const [comment, setComment] = React.useState(params?.comment || '');
    const [amount, setAmount] = React.useState(params?.amount ? fromNano(params.amount) : '0');
    const [stateInit, setStateInit] = React.useState<Cell | null>(params?.stateInit || null);
    const [estimation, setEstimation] = React.useState<BN | null>(null);
    const [amountInputFocused, setAmountInputFocused] = React.useState(false);
    const [minAmountWarn, setMinAmountWarn] = React.useState<string>();
    const acc = React.useMemo(() => getCurrentAddress(), []);
    React.useEffect(() => {
        return () => {
            if (params && params.job) {
                engine.products.apps.commitCommand(false, params.job, new Cell());
            }
        }
    }, []);

    const onSetAmount = React.useCallback(
        (newAmount: string) => {
            setMinAmountWarn(undefined);
            setAmount(newAmount);
        }, []);

    const doSend = React.useCallback(async () => {
        if (
            pool
            && (
                params?.action === 'deposit'
                || params?.action === 'top_up'
            )
            && pool.minStake.gt(toNano(amount.replace(',', '.')))
        ) {
            setMinAmountWarn(t('products.staking.minAmountWarning', { minAmount: fromNano(pool!.minStake) }));
            return;
        }

        if (params?.action === 'withdraw' && toNano('0.2').gt(toNano(amount.replace(',', '.')))) {
            setMinAmountWarn(t('products.staking.minAmountWarning', { minAmount: '0.2' }));
            return;
        }

        if (amountInputFocused) {
            refs[0].current?.blur();
            setAmountInputFocused(false);
            return;
        }

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

        if ((params?.action === 'withdraw')) {
            // Check staked balance
            if (member && member.balance.add(member.withdraw).add(member.pendingDeposit).lt(value)) {
                setMinAmountWarn(t('products.staking.transfer.notEnoughStaked'));
                Alert.alert(t('products.staking.transfer.notEnoughStaked'));
                return;
            }
        }

        // Check amount
        if ((!value.eq(account.balance) && account.balance.lt(value))) {
            setMinAmountWarn(t('transfer.error.notEnoughCoins'));
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (value.eq(new BN(0))) {
            setMinAmountWarn(t('products.staking.minAmountWarning', { minAmount: fromNano(pool!.minStake) }));
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
                value: params?.action === 'withdraw'
                    ? toNano('0.2')
                    : value.eq(account.balance) ? toNano('0') : value,
                bounce,
                body: new CommonMessageInfo({
                    stateInit: stateInit ? new CellMessage(stateInit) : null,
                    body: params?.action === 'withdraw'
                        ? new CellMessage(createWithdrawStakeCell(value))
                        : new CommentMessage(comment)
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

        if (params?.navigateToStakingAfter) {
            navigation.navigate('Staking')
        } else {
            navigation.goBack();
        }
    }, [amountInputFocused, amount, target, comment, account.seqno, stateInit, params, member, pool]);

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
                        value: params?.action === 'withdraw'
                            ? toNano('0.2')
                            : value,
                        bounce: false,
                        body: new CommonMessageInfo({
                            stateInit: stateInit ? new CellMessage(stateInit) : null,
                            body: params?.action === 'withdraw'
                                ? new CellMessage(createWithdrawStakeCell(value))
                                : new CommentMessage(comment)
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
    }, [amount, target, comment, account.seqno, stateInit]);

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
        if (amount === '0') {
            setAmount('');
        }
        runOnUI(scrollToInput)(index);
        setSelectedInput(index);
        setAmountInputFocused(true);
    }, [amount]);

    const onBlur = React.useCallback((index: number) => {
        setAmountInputFocused(false);
    }, []);

    React.useEffect(() => {
        if (amountInputFocused) {
            setTitle(
                params?.action === 'deposit'
                    ? t('products.staking.transfer.depositStakeTitle')
                    : params?.action === 'withdraw'
                        ? t('products.staking.transfer.withdrawStakeTitle')
                        : params?.action === 'top_up'
                            ? t('products.staking.transfer.topUpTitle')
                            : t('products.staking.title')
            );
        } else {
            setTitle(
                params?.action === 'deposit'
                    ? t('products.staking.transfer.depositStakeTitle')
                    : params?.action === 'withdraw'
                        ? t('products.staking.transfer.withdrawStakeConfirmTitle')
                        : params?.action === 'top_up'
                            ? t('products.staking.transfer.topUpConfirmTitle')
                            : t('products.staking.title')
            );
        }
    }, [amountInputFocused, params?.action]);

    return (
        <>
            <AndroidToolbar
                style={{ marginTop: safeArea.top }}
                pageTitle={title}
            />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>
                        {title}
                    </Text>
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
                    <>
                        <View style={{
                            marginBottom: 0,
                            backgroundColor: "white",
                            borderRadius: 14,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 15,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                width: '100%',
                                justifyContent: 'space-between'
                            }}>
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    color: '#8E979D',
                                }}>
                                    {t('common.amount')}
                                </Text>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    color: '#6D6D71',
                                }}>
                                    {fromNano(
                                        (params?.action === 'withdraw' && member)
                                            ? member.balance.add(member.withdraw)
                                            : account?.balance || new BN(0)
                                    )} TON
                                </Text>
                            </View>
                            <View style={{
                                width: '100%',
                            }}>
                                <ATextInput
                                    index={0}
                                    ref={refs[0]}
                                    onFocus={onFocus}
                                    value={amount}
                                    onValueChange={onSetAmount}
                                    placeholder={'0'}
                                    keyboardType={'numeric'}
                                    textAlign={'center'}
                                    style={{ paddingHorizontal: 0, backgroundColor: 'transparent', marginTop: 4 }}
                                    inputStyle={{ color: Theme.accent, flexGrow: 0, paddingTop: 0 }}
                                    fontWeight={'800'}
                                    fontSize={30}
                                    onBlur={onBlur}
                                    preventDefaultHeight
                                    preventDefaultLineHeight
                                    preventDefaultValuePadding
                                    blurOnSubmit={false}
                                />
                                <PriceComponent
                                    amount={toNano(parseFloat(amount.replace(',', '.')))}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0
                                    }}
                                    textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                                />
                            </View>
                        </View>
                        {!!minAmountWarn && (
                            <Text style={{
                                color: '#FF0000',
                                fontWeight: '400',
                                fontSize: 14,
                                marginTop: 10
                            }}>
                                {minAmountWarn}
                            </Text>
                        )}
                        {(params?.action === 'deposit' || params?.action === 'top_up') && (
                            <>
                                <StakingCalcComponent
                                    amount={amount}
                                    topUp={params?.action === 'top_up'}
                                    member={member}
                                />
                                <PoolTransactionInfo pool={pool} fee={estimation} />
                            </>
                        )}
                        {params?.action === 'withdraw' && (
                            <>
                                <View style={{
                                    backgroundColor: 'white',
                                    borderRadius: 14,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingLeft: 16,
                                    marginTop: 20,
                                    marginBottom: 15
                                }}>
                                    <View style={{
                                        flexDirection: 'row', width: '100%',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        paddingRight: 16,
                                        height: 55
                                    }}>
                                        <Text style={{
                                            fontSize: 16,
                                            color: '#7D858A'
                                        }}>
                                            {t('products.staking.info.withdrawFee')}
                                        </Text>
                                        <View style={{ justifyContent: 'center' }}>
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 16,
                                                color: Theme.textColor
                                            }}>
                                                {'0.2 TON'}
                                            </Text>
                                            <PriceComponent
                                                amount={toNano('0.2')}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    paddingHorizontal: 0, paddingVertical: 2,
                                                    alignSelf: 'flex-end'
                                                }}
                                                textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                                            />
                                        </View>
                                    </View>
                                </View>
                                {!!pool && (
                                    <StakingCycle
                                        stakeUntil={pool.stakeUntil}
                                        style={{
                                            marginBottom: 15
                                        }}
                                    />
                                )}
                                {!!member && !amountInputFocused && (
                                    <UnstakeBanner member={member} />
                                )}
                            </>
                        )}
                    </>
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
                    title={
                        amountInputFocused
                            ? t('common.continue')
                            : t('common.confirm')
                    }
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