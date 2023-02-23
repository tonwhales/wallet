import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { RoundButton } from '../../components/RoundButton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { useRoute } from '@react-navigation/native';
import { useEngine } from '../../engine/Engine';
import { getCurrentAddress } from '../../storage/appState';
import { AppConfig } from '../../AppConfig';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { LocalizedResources } from '../../i18n/schema';
import { KnownWallet, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemGroup } from '../../components/ItemGroup';
import { ItemLarge } from '../../components/ItemLarge';
import { CloseButton } from '../../components/CloseButton';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { useItem } from '../../engine/persistence/PersistedItem';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { resolveOperation } from '../../engine/transactions/resolveOperation';
import { JettonMasterState } from '../../engine/sync/startJettonMasterSync';
import { estimateV4Fees } from '../../engine/estimate/estimateFees';
import { warn } from '../../utils/log';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import LottieView from 'lottie-react-native';
import SignLock from '../../../assets/ic_sign_lock.svg';
import { parseMessageBody } from '../../engine/transactions/parseMessageBody';
import { SignRawMessage } from '../../engine/tonconnect/types';
import { createWalletTransferV4, internalFromSignRawMessage } from '../../engine/utils/createWalletTransferV4';
import { TransferComponent } from '../../components/transactions/TransferComponent';
import { ItemDivider } from '../../components/ItemDivider';
import { Theme } from '../../Theme';
import { PriceComponent } from '../../components/PriceComponent';
import TonSignGas from '../../../assets/ic_transfer_gas.svg';
import Question from '../../../assets/ic_question.svg';
import TonSign from '../../../assets/ic_ton_sign.svg';
import { WImage } from '../../components/WImage';
import { ItemCollapsible } from '../../components/ItemCollapsible';
import { usePrice } from '../../engine/PriceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { ItemAddress } from '../../components/ItemAddress';

export type ATextInputRef = {
    focus: () => void;
}

type ConfirmLoadedProps = {
    text: string | null,
    job: string | null,
    order: {
        messages: {
            addr: {
                address: Address;
                balance: BN,
                active: boolean
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: string,
            payload?: string | undefined,
            stateInit?: string | undefined;
        }[],
        app?: {
            domain: string,
            title: string
        }
    },
    fees: BN,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    totalAmount: BN
};

const TransferLoaded = React.memo((props: ConfirmLoadedProps) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const [price, currency] = usePrice();
    const {
        text,
        order,
        job,
        fees,
        callback,
        back,
        totalAmount
    } = props;

    const { internals, totalJettons, gas } = React.useMemo(() => {
        const temp = [];
        const totalJettons = new Map<string, { jettonMaster: JettonMasterState, jettonAmount: BN, gas: BN }>();
        let gas = {
            total: new BN(0),
            unusual: false
        };
        for (const message of order.messages) {
            let body = message.payload ? parseBody(Cell.fromBoc(Buffer.from(message.payload, 'base64'))[0]) : null;
            let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell, message.metadata.interfaces) : null;

            // Read jetton master
            let jettonMaster: JettonMasterState | null = null;
            if (message.metadata.jettonWallet) {
                jettonMaster = engine.persistence.jettonMasters.item(message.metadata.jettonWallet!.master).value;
            }

            let jettonAmount: BN | null = null;
            try {
                if (jettonMaster && message.payload) {
                    const temp = Cell.fromBoc(Buffer.from(message.payload, 'base64'))[0];
                    if (temp) {
                        const parsing = temp.beginParse();
                        parsing.readUint(32);
                        parsing.readUint(64);
                        jettonAmount = parsing.readCoins();
                    }
                }
            } catch (e) {
                console.warn(e);
            }

            if (jettonAmount && jettonMaster && message.metadata.jettonWallet) {
                const addr = message.metadata.jettonWallet?.master.toFriendly({ testOnly: AppConfig.isTestnet });
                const value = totalJettons.get(addr);
                if (!!value) {
                    value.jettonAmount = value.jettonAmount.add(jettonAmount);
                    totalJettons.set(addr, value);
                } else {
                    totalJettons.set(addr, {
                        jettonMaster,
                        jettonAmount,
                        gas: toNano(fromNano(message.amount))
                    });
                }

                gas.total = gas.total.add(toNano(fromNano(message.amount)));

                if (toNano(fromNano(message.amount)).gt(toNano('0.2'))) {
                    gas.unusual = true;
                }
            }

            // Resolve operation
            let operation = resolveOperation({
                body: body,
                amount: toNano(fromNano(message.amount)),
                account: message.addr.address,
                metadata: message.metadata,
                jettonMaster
            });

            const contact = (engine.products.settings.addressBook.value.contacts ?? {})[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];
            const friendlyTarget = message.addr.address.toFriendly({ testOnly: AppConfig.isTestnet });
            let known: KnownWallet | undefined = undefined;
            if (KnownWallets[friendlyTarget]) {
                known = KnownWallets[friendlyTarget];
            } else if (operation.title) {
                known = { name: operation.title };
            } else if (!!contact) { // Resolve contact known wallet
                known = { name: contact.name }
            }
            const isSpam = !!(engine.products.settings.addressBook.value.denyList ?? {})[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];
            const spam = !!engine.persistence.serverConfig.item().value?.wallets.spam.find((s) => s === friendlyTarget) || isSpam;

            temp.push({
                message,
                operation,
                parsedBody,
                known,
                spam,
                jettonAmount,
                contact,
                jettonMaster
            });
        }

        return { internals: temp, totalJettons, gas };
    }, []);

    const jettonsGasAlert = React.useCallback(() => {
        Alert.alert(t('transfer.unusualJettonsGasTitle', { amount: fromNano(gas.total) }),
            t('transfer.unusualJettonsGasMessage'),
            [{ text: t('common.gotIt') }])
    }, [gas]);

    // Tracking
    const success = React.useRef(false);
    React.useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { order });
        }
    }, []);


    // Confirmation
    const doSend = React.useCallback(async () => {
        async function confirm(title: LocalizedResources, message?: string) {
            return await new Promise<boolean>(resolve => {
                Alert.alert(t(title), `${message ? message + ' ' : ''}${t('transfer.confirm')}`, [{
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

        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);

        const messages: InternalMessage[] = [];
        for (const i of internals) {
            const target = i.message.addr.address;
            const restricted = i.message.restricted;

            // Check if same address
            if (target.equals(contract.address)) {
                Alert.alert(t('transfer.error.sendingToYourself'));
                return;
            }

            // Check if restricted
            if (restricted) {
                let cont = await confirm('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
            }

            // Check if restricted
            if (restricted) {
                let cont = await confirm('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
            }

            // Check bounce flag
            let bounce = true;
            if (!i.message.addr.active && !i.message.stateInit) {
                bounce = false;
            }

            // Create message
            const msg = internalFromSignRawMessage({
                address: i.message.addr.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                amount: i.message.amount,
                payload: i.message.payload,
                stateInit: i.message.stateInit
            }, bounce);

            if (msg) {
                messages.push(msg);
            }

        }

        // Check amount
        if (account.balance.lt(totalAmount)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (totalAmount.eq(new BN(0))) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }


        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            return;
        }

        // Create transfer
        let transfer = createWalletTransferV4({
            seqno: account.seqno,
            walletId: contract.source.walletId,
            secretKey: walletKeys.keyPair.secretKey,
            sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
            messages
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
        await backoff('transfer', () => engine.client4.sendMessage(msg.toBoc({ idx: false })));

        // Notify job
        if (job) {
            await engine.products.apps.commitCommand(true, job, transfer);
        }

        // Notify callback
        if (callback) {
            try {
                callback(true, transfer);
            } catch (e) {
                warn(e);
                // Ignore on error
            }
        }

        // Track
        success.current = true;
        trackEvent(MixpanelEvent.Transfer, { order });

        // Register pending
        engine.products.main.registerPending({
            id: 'pending-' + account.seqno,
            lt: null,
            fees: fees,
            amount: totalAmount.mul(new BN(-1)),
            address: null,
            seqno: account.seqno,
            kind: 'out',
            body: null,
            status: 'pending',
            time: Math.floor(Date.now() / 1000),
            bounced: false,
            prev: null,
            mentioned: [],
            hash: msg.hash(),
        });

        // Reset stack to root
        if (back && back > 0) {
            for (let i = 0; i < back; i++) {
                navigation.goBack();
            }
        } else {
            navigation.popToTop();
        }
    }, []);

    const anim = React.useRef<LottieView>(null);

    React.useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play()
        }, 300);
    }, []);

    return (
        <>
            {!!order.app && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17,
                    paddingHorizontal: Platform.OS === 'ios' ? 40 + 8 : 16,
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 14,
                        fontWeight: '600'
                    }}>
                        {t('transfer.requestsToSign', { app: order.app.title })}
                    </Text>
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        marginTop: 6
                    }}>
                        <SignLock />
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: '400',
                            marginLeft: 4,
                            color: '#858B93'
                        }}>
                            {order.app.domain}
                        </Text>
                    </View>
                </View>
            )}
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 28 }}>
                        <LottieView
                            ref={anim}
                            source={require('../../../assets/animations/sign.json')}
                            style={{ width: 120, height: 120 }}
                            autoPlay={false}
                            loop={false}
                        />
                        {Platform.OS === 'ios' && (
                            <Text style={{
                                fontWeight: '700',
                                fontSize: 30,
                                textAlign: 'center'
                            }}>
                                {order.messages.length > 1 ? t('transfer.confirmManyTitle', { count: order.messages.length }) : t('transfer.confirmTitle')}
                            </Text>
                        )}
                    </View>
                    <ItemGroup style={{ marginBottom: 16, marginTop: 30 }}>
                        <Text style={{
                            fontWeight: '700',
                            fontSize: 20,
                            color: Theme.textColor,
                            marginHorizontal: 16,
                            marginVertical: 16,
                        }}>
                            {t('transfer.txsSummary')}
                        </Text>
                        <View>
                            <View style={{
                                flexDirection: 'row',
                                marginHorizontal: 16,
                                alignItems: 'center'
                            }}>
                                <View style={{
                                    backgroundColor: Theme.accent,
                                    height: 20, width: 20,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12
                                }}>
                                    <TonSign height={10} width={10} color={'white'} />
                                </View>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 20,
                                    color: Theme.textColor
                                }}>
                                    {fromNano(totalAmount) + ' TON'}
                                </Text>
                            </View>
                            <PriceComponent
                                amount={totalAmount}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0,
                                    marginLeft: 48, marginTop: 4
                                }}
                                textStyle={{ color: Theme.textColor, fontWeight: '400', fontSize: 14 }}
                            />
                        </View>
                        {totalJettons.size > 0 && (
                            Array.from(totalJettons).map((value) => {
                                return (
                                    <View
                                        key={value[0]}
                                        style={{
                                            minHeight: 40,
                                            flexDirection: 'row',
                                            marginHorizontal: 16,
                                            marginBottom: 16,
                                            alignItems: 'center'
                                        }}>
                                        <View style={{
                                            backgroundColor: Theme.accent,
                                            height: 20, width: 20,
                                            borderRadius: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center', marginTop: 2
                                        }}>
                                            <WImage
                                                src={value[1].jettonMaster.image?.preview256}
                                                blurhash={value[1].jettonMaster.image?.blurhash}
                                                width={20}
                                                heigh={20}
                                                borderRadius={20}
                                            />
                                        </View>
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={{
                                                fontWeight: '700',
                                                fontSize: 20,
                                                color: Theme.textColor,
                                                marginLeft: 2
                                            }}>
                                                {`${fromNano(value[1].jettonAmount)} ${value[1].jettonMaster.symbol}`}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            })
                        )}
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginTop: totalJettons.size > 0 ? 0 : 16 }} />
                        <ItemCollapsible title={t('transfer.gasDetails')} hideDivider>
                            {totalJettons.size > 0 && (
                                <>
                                    <View style={{ flexDirection: 'column', paddingHorizontal: 16, alignItems: 'flex-start' }}>
                                        <View style={{ height: 30, flexDirection: 'row' }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '500',
                                                color: Theme.textSecondary,
                                                alignSelf: 'center',
                                                flexGrow: 1, flexBasis: 0
                                            }}>
                                                {t('transfer.jettonGas')}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', paddingBottom: 4 }}>
                                            <View style={{ paddingBottom: gas.unusual ? 0 : 6 }}>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: gas.unusual ? '#E19626' : Theme.textColor,
                                                    fontWeight: gas.unusual ? '700' : '400'
                                                }}>
                                                    {(!AppConfig.isTestnet && price)
                                                        ? fromNano(gas.total) + ' TON' + ` (${formatCurrency((parseFloat(fromNano(gas.total.abs())) * price.price.usd * price.price.rates[currency]).toFixed(2), currency, false)})`
                                                        : fromNano(gas.total) + ' TON'
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                        {gas.unusual && (
                                            <Pressable
                                                onPress={jettonsGasAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: '#FFC165',
                                                        paddingHorizontal: 8, paddingVertical: 4,
                                                        marginBottom: 16,
                                                        justifyContent: 'center', alignItems: 'center',
                                                        opacity: pressed ? 0.3 : 1
                                                    }
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '400',
                                                    color: '#E19626'
                                                }}>
                                                    {t('transfer.unusualJettonsGas')}
                                                </Text>
                                                <Question style={{ marginLeft: 5 }} />
                                            </Pressable>
                                        )}
                                    </View>
                                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginBottom: 6 }} />
                                </>
                            )}
                            <ItemLarge
                                title={t('transfer.feeTotalTitle')}
                                text={fromNano(fees) + ' TON'}
                            />
                        </ItemCollapsible>
                    </ItemGroup>
                    <ItemGroup>
                        {internals.map((i, index) => {
                            return (
                                <TransferComponent
                                    key={'transfer' + index}
                                    transfer={i}
                                    first={index === 0}
                                    last={index >= internals.length - 1}
                                    index={index}
                                />
                            );
                        })}
                    </ItemGroup>
                    <ItemGroup style={{
                        marginTop: 16
                    }}>
                        <ItemCollapsible title={t('transfer.moreDetails')}>
                            {internals.map((i, index) => {
                                return (
                                    <>
                                        <ItemAddress
                                            key={'address' + index}
                                            title={`#${index + 1} ` + t('common.walletAddress')}
                                            text={i.operation.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                        />
                                        {index < internals.length - 1 && (<ItemDivider />)}
                                    </>
                                );
                            })}
                        </ItemCollapsible>
                    </ItemGroup>
                    <View style={{ height: 56 }} />
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <RoundButton
                    title={t('common.confirm')}
                    action={doSend}
                />
            </View>
        </>
    );
});

export const TransferV4Fragment = fragment(() => {
    const params: {
        text: string | null,
        order: {
            messages: SignRawMessage[],
            app?: {
                domain: string,
                title: string
            }
        },
        job: string | null,
        back?: number,
        callback?: ((ok: boolean, result: Cell | null) => void) | null
    } = useRoute().params! as any;
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    // Memmoize all parameters just in case
    const from = React.useMemo(() => getCurrentAddress(), []);
    const text = React.useMemo(() => params.text, []);
    const order = React.useMemo(() => params.order, []);
    const job = React.useMemo(() => params.job, []);
    const callback = React.useMemo(() => params.callback, []);

    // Auto-cancel job on unmount
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

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = React.useState<ConfirmLoadedProps | null>(null);
    const netConfig = engine.products.config.useConfig();
    React.useEffect(() => {
        // Await data
        if (!netConfig) {
            return;
        }

        let exited = false;

        backoff('transfer', async () => {
            // Get contract
            const contract = contractFromPublicKey(from.publicKey);

            if (exited) {
                return;
            }

            const block = await backoff('transfer', () => engine.client4.getLastBlock());
            const config = await backoff('transfer', () => fetchConfig());

            const outMsgs: Cell[] = [];
            const storageStats = [];
            const inMsgs: InternalMessage[] = [];
            const messages = [];
            let totalAmount = new BN(0);
            for (let i = 0; i < order.messages.length; i++) {
                const msg = internalFromSignRawMessage(order.messages[i]);
                if (msg) {
                    inMsgs.push(msg);
                    // Fetch data
                    const [metadata, state] = await Promise.all([
                        backoff('transfer', () => fetchMetadata(engine.client4, block.last.seqno, msg.to)),
                        backoff('transfer', () => engine.client4.getAccount(block.last.seqno, msg.to))
                    ]);

                    storageStats.push(state!.account.storageStat);

                    // Check if wallet is restricted
                    let restricted = false;
                    for (let r of config.wallets.restrict_send) {
                        if (Address.parse(r).equals(msg.to)) {
                            restricted = true;
                            break;
                        }
                    }
                    let outMsg = new Cell();
                    msg.writeTo(outMsg);
                    outMsgs.push(outMsg);
                    totalAmount = totalAmount.add(msg.value);

                    messages.push({
                        ...order.messages[i],
                        metadata,
                        restricted,
                        addr: {
                            address: msg.to,
                            balance: new BN(state.account.balance.coins, 10),
                            active: state.account.state.type === 'active',
                        },
                    });
                } else {
                    Alert.alert(t('transfer.error.invalidTransaction'), undefined, [{
                        text: t('common.back'),
                        onPress: () => {
                            if (params.back && params.back > 0) {
                                for (let i = 0; i < params.back; i++) {
                                    navigation.goBack();
                                }
                            } else {
                                navigation.popToTop();
                            }
                        }
                    }]);
                    exited = true;
                    if (params && params.job) {
                        engine.products.apps.commitCommand(false, params.job, new Cell());
                    }
                    if (params && params.callback) {
                        params.callback(false, null);
                    }
                    return;
                }

            }

            // Create transfer
            let transfer = await createWalletTransferV4({
                seqno: account.seqno,
                walletId: contract.source.walletId,
                secretKey: null,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                messages: inMsgs
            });

            // Estimate fee
            let inMsg = new Cell();
            new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                    body: new CellMessage(transfer)
                })
            }).writeTo(inMsg);

            let fees = estimateV4Fees(netConfig!, inMsg, outMsgs, storageStats);

            // Set state
            setLoadedProps({
                order: { messages, app: order.app },
                text,
                job,
                fees,
                callback: callback ? callback : null,
                back: params.back,
                totalAmount,
            });
        });

        return () => {
            exited = true;
        };
    }, [netConfig]);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('transfer.confirmTitle')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ flexGrow: 1, flexBasis: 0, paddingBottom: safeArea.bottom }}>
                {!loadedProps && (
                    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <LoadingIndicator simple={true} />
                    </View>
                )}
                {!!loadedProps && <TransferLoaded {...loadedProps} />}
            </View>
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