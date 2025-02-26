import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Alert, View, Text, ScrollView, Pressable, Linking } from "react-native";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { SupportedMessage, parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../../engine/transactions/resolveOperation";
import { t } from "../../../i18n/t";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { backoff } from "../../../utils/time";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { ItemCollapsible } from "../../../components/ItemCollapsible";
import { ItemGroup } from "../../../components/ItemGroup";
import { PriceComponent } from "../../../components/PriceComponent";
import { RoundButton } from "../../../components/RoundButton";
import { WImage } from "../../../components/WImage";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { confirmAlert } from "../../../utils/confirmAlert";
import { useAppData, useAppManifest, useClient4, useNetwork, useBounceableWalletFormat, useRegisterPending, useSelectedAccount, useServerConfig, useTheme } from "../../../engine/hooks";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { getJettonMaster } from "../../../engine/getters/getJettonMaster";
import { Cell, MessageRelaxed, SendMode, beginCell, external, fromNano, storeMessage, internal, toNano, loadStateInit } from "@ton/core";
import { getAccountLite } from "../../../engine/getters/getAccountLite";
import { fetchSeqno } from "../../../engine/api/fetchSeqno";
import { getLastBlock } from "../../../engine/accountWatcher";
import { StoredOperation } from "../../../engine/types";
import { AddressContact, useAddressBook } from "../../../engine/hooks/contacts/useAddressBook";
import { ConfirmLoadedPropsBatch, OrderMessage } from "../TransferFragment";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { useWalletSettings } from "../../../engine/hooks/appstate/useWalletSettings";
import { AppInfo } from "../../../components/ConnectedAppButton";
import { ItemDivider } from "../../../components/ItemDivider";
import { Typography } from "../../../components/styles";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { copyText } from "../../../utils/copyText";
import { clearLastReturnStrategy } from "../../../engine/tonconnect/utils";
import Minimizer from "../../../modules/Minimizer";
import { useWalletVersion } from "../../../engine/hooks/useWalletVersion";
import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { PendingTransactionStatus } from "../../../engine/state/pending";
import { Image } from 'expo-image';

import IcAlert from '@assets/ic-alert.svg';
import IcTonIcon from '@assets/ic-ton-acc.svg';

export const TransferBatch = memo((props: ConfirmLoadedPropsBatch) => {
    const authContext = useKeysAuth();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
    const registerPending = useRegisterPending();
    const [walletSettings] = useWalletSettings(selected?.address);
    const [addressBook] = useAddressBook();
    const [bounceableFormat] = useBounceableWalletFormat();
    const contacts = addressBook.contacts;
    const denyList = addressBook.denyList;
    const serverConfig = useServerConfig();
    const knownWallets = KnownWallets(isTestnet);
    const toaster = useToaster();

    const appData = useAppData(props.order.app?.url || '');
    const appManifest = useAppManifest(props.order.app?.url || '');

    let app: AppInfo = useMemo(() => {
        if (appData) {
            return { ...appData, type: 'app-data' };
        } else if (appManifest) {
            return { ...appManifest, type: 'app-manifest' };
        } else {
            return null;
        }
    }, [appData, appManifest]);

    const handleReturnStrategy = useCallback((returnStrategy: string) => {
        if (returnStrategy === 'back') {
            Minimizer.goBack();
        } else if (returnStrategy !== 'none') {
            try {
                const url = new URL(decodeURIComponent(returnStrategy));
                Linking.openURL(url.toString());
            } catch {
                warn('Failed to open url');
            }
        }
        clearLastReturnStrategy();
    }, []);

    const {
        text,
        order,
        fees,
        callback,
        back,
        totalAmount
    } = props;

    const { internals, totalJettons, gas } = useMemo(() => {
        const temp: {
            message: OrderMessage;
            operation: StoredOperation;
            parsedBody: SupportedMessage | null;
            known: KnownWallet | undefined;
            spam: boolean;
            jettonAmount: bigint | null;
            contact: AddressContact | null;
            jettonMaster: JettonMasterState | null;
        }[] = [];
        const totalJettons = new Map<string, { jettonMaster: JettonMasterState, jettonAmount: bigint, gas: bigint }>();
        let gas = {
            total: BigInt(0),
            unusual: false
        };
        for (const message of order.messages) {
            let body = message.payload ? parseBody(message.payload) : null;
            let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell) : null;

            // Read jetton master
            let jettonMaster: JettonMasterState | null = null;
            if (message.metadata.jettonWallet) {
                jettonMaster = getJettonMaster(message.metadata.jettonWallet!.master, isTestnet) || null;
            }

            let jettonAmount: bigint | null = null;
            try {
                if (jettonMaster && message.payload) {
                    const temp = message.payload;
                    if (temp) {
                        const parsing = temp.beginParse();
                        parsing.skip(32);
                        parsing.skip(64);
                        jettonAmount = parsing.loadCoins();
                    }
                }
            } catch {
                console.warn('Failed to parse jetton amount');
            }

            if (jettonAmount && jettonMaster && message.metadata.jettonWallet) {
                const addr = message.metadata.jettonWallet?.master.toString({ testOnly: isTestnet });
                const value = totalJettons.get(addr);
                if (!!value) {
                    value.jettonAmount = value.jettonAmount + jettonAmount;
                    totalJettons.set(addr, value);
                } else {
                    totalJettons.set(addr, {
                        jettonMaster,
                        jettonAmount,
                        gas: message.amount
                    });
                }

                gas.total = gas.total + message.amount;

                if (message.amount > toNano('0.2')) {
                    gas.unusual = true;
                }
            }

            // Resolve operation
            let operation = resolveOperation({
                body: body,
                amount: message.amount,
                account: message.addr.address,
            }, isTestnet);

            const friendlyTarget = message.addr.address.toString({ testOnly: isTestnet });
            const contact = contacts[operation.address];

            let known: KnownWallet | undefined = undefined;

            if (KnownWallets(isTestnet)[friendlyTarget]) {
                known = KnownWallets(isTestnet)[friendlyTarget];
            }
            if (!!contact) { // Resolve contact known wallet
                known = { name: contact.name }
            }
            const isSpam = !!(denyList ?? {})[operation.address];
            const spam = !!serverConfig.data?.wallets.spam.find((s) => s === friendlyTarget) || isSpam;

            temp.push({
                message,
                operation,
                parsedBody,
                known,
                spam,
                jettonAmount,
                contact: null,
                jettonMaster
            });
        }

        return { internals: temp, totalJettons, gas };
    }, []);

    const jettonsGasAlert = useCallback(() => {
        navigation.navigateAlert({
            title: t('transfer.unusualJettonsGasTitle', { amount: fromNano(gas.total) }),
            message: t('transfer.unusualJettonsGasMessage'),
        })
    }, [gas]);

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    // Tracking
    const success = useRef(false);
    useEffect(() => {
        return () => {
            if (!success.current) {
                trackEvent(MixpanelEvent.TransferCancel, { target: 'batch', amount: totalAmount.toString(10) }, isTestnet);
            }
        }
    }, []);

    const walletVersion = useWalletVersion();


    // Confirmation
    const doSend = useCallback(async () => {
        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey, walletVersion, isTestnet);
        const isV5 = walletVersion === 'v5R1';

        if (!selected) {
            return;
        }

        const messages: MessageRelaxed[] = [];
        for (const i of internals) {
            const target = i.message.addr.address;
            const restricted = i.message.restricted;

            // Check if transfering to yourself
            if (target.equals(contract.address)) {
                let allowSendingToYourself = await new Promise((resolve) => {
                    Alert.alert(t('transfer.error.sendingToYourself'), undefined, [
                        {
                            onPress: () => resolve(true),
                            text: t('common.continueAnyway')
                        },
                        {
                            onPress: () => resolve(false),
                            text: t('common.cancel'),
                            isPreferred: true,
                        }
                    ]);
                });
                if (!allowSendingToYourself) {
                    return;
                }
            }

            // Check if restricted
            if (restricted) {
                let cont = await confirmAlert('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
            }

            // Check if restricted
            if (restricted) {
                let cont = await confirmAlert('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
            }

            // Check bounce flag
            let bounce = true;
            if (!i.message.addr.active && !i.message.stateInit) {
                bounce = false;
            }

            const internalStateInit = !!i.message.stateInit
                ? loadStateInit(i.message.stateInit.asSlice())
                : null;

            // Create message
            const msg = internal({
                to: target,
                value: i.message.amount,
                init: internalStateInit,
                body: i.message.payload,
                bounce
            });

            if (msg) {
                messages.push(msg);
            }

        }

        const account = getAccountLite(selected.addressString);

        // Check amount
        if (account!.balance < totalAmount) {
            const diff = totalAmount - account!.balance;
            const diffString = fromNano(diff);
            Alert.alert(
                t('transfer.error.notEnoughGasTitle'),
                t('transfer.error.notEnoughGasMessage', { diff: diffString }),
            );
            return;
        }
        if (totalAmount === 0n) {
            let allowSeingZero = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.zeroCoinsAlert'), undefined, [
                    {
                        onPress: () => resolve(true),
                        text: t('common.continueAnyway')
                    },
                    {
                        onPress: () => resolve(false),
                        text: t('common.cancel'),
                        isPreferred: true,
                    }
                ]);
            });
            if (!allowSeingZero) {
                return;
            }
        }


        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ cancelable: true });
        } catch (e) {
            return;
        }

        let lastBlock = await getLastBlock();
        let seqno = await fetchSeqno(client, lastBlock, selected.address);

        // Create transfer
        let transfer: Cell;
        try {
            const transferParams = {
                seqno: seqno,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages,
            }
            transfer = isV5
                ? (contract as WalletContractV5R1).createTransfer(transferParams)
                : (contract as WalletContractV4).createTransfer(transferParams);
        } catch {
            warn('Failed to create transfer');
            return;
        }

        // Create external message
        const extMessage = external({
            to: contract.address,
            body: transfer,
            init: seqno === 0 ? contract.init : undefined
        });

        let msg = beginCell().store(storeMessage(extMessage)).endCell();

        // Sending transaction
        await backoff('transfer', () => client.sendMessage(msg.toBoc({ idx: false })));

        // Notify callback
        if (callback) {
            try {
                callback(true, transfer);
            } catch {
                warn('Failed to execute callback');
            }
        }

        // Track
        success.current = true;
        trackEvent(MixpanelEvent.Transfer, { target: 'batch', amount: totalAmount.toString(10) }, isTestnet);

        // Register pending
        registerPending({
            id: 'pending-' + seqno,
            status: PendingTransactionStatus.Pending,
            fees: fees,
            amount: totalAmount * (BigInt(-1)),
            address: null,
            seqno: seqno,
            blockSeqno: lastBlock,
            body: { type: 'batch' },
            time: Math.floor(Date.now() / 1000),
            hash: msg.hash(),
        });

        if (props.source?.type === 'tonconnect' && !!props.source?.returnStrategy) {
            const returnStrategy = props.source?.returnStrategy;

            // close modal
            navigation.goBack();

            // resolve return strategy
            if (!!returnStrategy) {
                handleReturnStrategy(returnStrategy);
            }

            return;
        }

        // Reset stack to root
        if (back && back > 0) {
            for (let i = 0; i < back; i++) {
                navigation.goBack();
            }
        } else {
            navigation.popToTop();
        }
    }, [registerPending]);

    let appInfo = !!order.app && (
        <ItemGroup style={{ marginBottom: 16, marginTop: 16, paddingTop: 27 }}>
            <View style={{
                backgroundColor: theme.divider,
                height: 54,
                position: 'absolute', left: 0, right: 0
            }} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <WImage
                    height={68}
                    width={68}
                    borderRadius={34}
                />
                <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    flexShrink: 1,
                    color: theme.textPrimary,
                    textAlign: 'center'
                }}>
                    {t('transfer.requestsToSign', { app: order.app.title })}
                </Text>
                <View style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    flexShrink: 1,
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 17,
                        fontWeight: '400',
                        marginLeft: 4,
                        color: theme.textPrimary
                    }}>
                        {order.app.domain}
                    </Text>
                </View>
            </View>
        </ItemGroup>
    );

    if (app) {
        appInfo = (
            <ItemGroup style={{ marginBottom: 16, marginTop: 16, paddingTop: 27 }}>
                <View style={{
                    backgroundColor: theme.divider,
                    height: 54,
                    position: 'absolute', left: 0, right: 0
                }} />
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <WImage
                        height={68}
                        width={68}
                        borderRadius={34}
                        src={app.type === 'app-data' ? app.image?.preview256 : app.iconUrl}
                    />
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        flexShrink: 1,
                        color: theme.textPrimary,
                        textAlign: 'center'
                    }}>
                        {t('products.transactionRequest.title')}
                    </Text>
                    <View style={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        flexShrink: 1,
                    }}>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 17,
                            fontWeight: '400',
                            marginLeft: 4,
                            color: theme.textPrimary
                        }}>
                            {app.type === 'app-data' ? app.title : app.name}
                        </Text>
                    </View>
                </View>
            </ItemGroup>
        )
    }

    return (
        <>
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    {appInfo}
                    <ItemGroup style={{ marginBottom: 16, marginTop: !!appInfo ? 0 : 16, paddingHorizontal: 20 }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Array.from(totalJettons).length > 0 ? 16 : 0
                        }}>
                            <View style={{
                                backgroundColor: theme.ton,
                                height: 48, width: 48,
                                borderRadius: 24,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <IcTonIcon height={48} width={48} color={'white'} />
                            </View>
                            <View style={{ justifyContent: 'center', marginLeft: 16 }}>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 17, lineHeight: 24,
                                    color: theme.textPrimary
                                }}>
                                    {'-' + fromNano(totalAmount) + ' TON'}
                                </Text>
                                <PriceComponent
                                    amount={totalAmount}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0, marginTop: 2,
                                        paddingLeft: 0, height: undefined, paddingVertical: 0
                                    }}
                                    prefix={'-'}
                                    textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 17, lineHeight: 24 }}
                                    theme={theme}
                                />
                            </View>
                        </View>
                        {Array.from(totalJettons).map((value, index) => {
                            return (
                                <View
                                    key={`jetton-${index}`}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: index < Array.from(totalJettons).length - 1 ? 16 : 0 }}
                                >
                                    <View
                                        style={{
                                            backgroundColor: theme.surfaceOnElevation,
                                            height: 48, width: 48,
                                            borderRadius: 24,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        key={value[0]}
                                    >
                                        <WImage
                                            src={value[1].jettonMaster.image?.preview256}
                                            blurhash={value[1].jettonMaster.image?.blurhash}
                                            width={48}
                                            height={48}
                                            borderRadius={24}
                                        />
                                    </View>
                                    <Text
                                        key={`jetton-amount-${index}`}
                                        style={{
                                            fontWeight: '600',
                                            fontSize: 17, lineHeight: 24,
                                            color: theme.textPrimary,
                                            marginLeft: 16
                                        }}
                                    >
                                        {'-' + fromBnWithDecimals(value[1].jettonAmount, value[1].jettonMaster?.decimals) + ' ' + value[1].jettonMaster?.symbol}
                                    </Text>
                                </View>
                            )
                        })}
                    </ItemGroup>
                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {t('common.from')}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    <AddressComponent
                                        address={selected!.address}
                                        bounceable={bounceableFormat}
                                        end={4}
                                        testOnly={isTestnet}
                                    />
                                </Text>
                                {walletSettings?.name && (
                                    <Text
                                        style={[{ color: theme.textSecondary, flexShrink: 1, marginLeft: 6 }, Typography.regular17_24]}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {walletSettings.name}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </ItemGroup>
                    <ItemCollapsible titleComponent={
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {t('transfer.feeTotalTitle')}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {fromNano(fees + gas.total) + ' TON'}
                                </Text>
                                <PriceComponent
                                    amount={fees + gas.total}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end',
                                        paddingLeft: 0, height: undefined, paddingVertical: 0,
                                        marginLeft: 6
                                    }}
                                    textStyle={{
                                        fontSize: 17, fontWeight: '400', lineHeight: 24,
                                        color: theme.textSecondary,
                                        flexShrink: 1
                                    }}
                                    theme={theme}
                                />
                            </View>
                        </View>
                    }>
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('transfer.feeTitle')}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                    {fromNano(fees) + ' TON'}
                                </Text>
                                <PriceComponent
                                    amount={fees}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end',
                                        paddingLeft: 0, height: undefined, paddingVertical: 0,
                                        marginLeft: 6
                                    }}
                                    textStyle={{
                                        fontSize: 17, fontWeight: '400', lineHeight: 24,
                                        color: theme.textSecondary,
                                        flexShrink: 1
                                    }}
                                    theme={theme}
                                />
                            </View>
                        </View>
                        {gas.total > 0n && (
                            <>
                                <ItemDivider marginHorizontal={0} />
                                <View style={{ justifyContent: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('transfer.gasFee')}
                                    </Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                            {fromNano(gas.total) + ' TON'}
                                        </Text>
                                        <PriceComponent
                                            amount={gas.total}
                                            style={{
                                                backgroundColor: theme.transparent,
                                                paddingHorizontal: 0,
                                                alignSelf: 'flex-end',
                                                paddingLeft: 0, height: undefined, paddingVertical: 0,
                                                marginLeft: 6
                                            }}
                                            textStyle={{
                                                fontSize: 17, fontWeight: '400', lineHeight: 24,
                                                color: theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            theme={theme}
                                        />
                                    </View>
                                    {gas.unusual && (
                                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Pressable
                                                onPress={jettonsGasAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        borderRadius: 12,
                                                        marginTop: 16,
                                                        paddingLeft: 16, paddingRight: 14, paddingVertical: 12,
                                                        justifyContent: 'space-between', alignItems: 'center',
                                                        backgroundColor: 'white',
                                                        opacity: pressed ? 0.5 : 1,
                                                        overflow: 'hidden'
                                                    }
                                                }}
                                            >
                                                <Text style={[{ color: theme.accentRed, flexShrink: 1 }, Typography.regular15_20]}>
                                                    {t('transfer.unusualJettonsGas')}
                                                </Text>
                                                <IcAlert style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                            </Pressable>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </ItemCollapsible>

                    {internals.map((i, index) => {
                        const known = knownWallets[i.message.addr.address.toString({ testOnly: isTestnet })];
                        return (
                            <ItemCollapsible
                                key={`internal-${index}`}
                                style={{ marginTop: 16 }}
                                titleStyle={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}
                                title={t('common.transaction') + ` #${index + 1}`}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('common.amount')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                            {i.jettonAmount
                                                ? fromNano(i.jettonAmount) + (i.jettonMaster?.symbol ?? '')
                                                : fromNano(i.message.amount) + ' TON'
                                            }
                                        </Text>
                                        {!i.jettonAmount && (
                                            <PriceComponent
                                                amount={i.message.amount}
                                                style={{
                                                    backgroundColor: theme.transparent,
                                                    paddingHorizontal: 0,
                                                    alignSelf: 'flex-end'
                                                }}
                                                textStyle={{
                                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                    color: theme.textSecondary,
                                                    flexShrink: 1
                                                }}
                                                theme={theme}
                                            />
                                        )}
                                    </View>
                                </View>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                                <Pressable
                                    style={({ pressed }) => ({
                                        opacity: pressed ? 0.5 : 1,
                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                    })}
                                    onPress={() => onCopyAddress(i.message.addr.address.toString({
                                        testOnly: isTestnet,
                                        bounceable: i.message.addr.bounceable
                                    }))}
                                >
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('common.to')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                            <AddressComponent
                                                bounceable={i.message.addr.bounceable}
                                                address={i.message.addr.address}
                                                start={10}
                                                end={4}
                                                testOnly={isTestnet}
                                                known={!!known}
                                            />
                                        </Text>
                                        {i.known && (
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                        color: theme.textSecondary,
                                                        flexShrink: 1
                                                    }}
                                                    numberOfLines={1}
                                                    ellipsizeMode={'tail'}
                                                >
                                                    {i.known?.name}
                                                </Text>
                                                <View style={{
                                                    justifyContent: 'center', alignItems: 'center',
                                                    height: 18, width: 18, borderRadius: 9,
                                                    marginLeft: 6,
                                                    backgroundColor: theme.surfaceOnBg
                                                }}>
                                                    <Image
                                                        source={require('@assets/ic-verified.png')}
                                                        style={{ height: 18, width: 18 }}
                                                    />
                                                </View>
                                            </View>
                                        )}
                                        {(!i.message.addr.active) && (
                                            <Pressable
                                                style={({ pressed }) => ({ flexDirection: 'row', gap: 4, opacity: pressed ? 0.5 : 1 })}
                                                onPress={() => {
                                                    navigation.navigateAlert({
                                                        title: t('transfer.error.addressIsNotActive'),
                                                        message: t('transfer.error.addressIsNotActiveDescription')
                                                    })
                                                }}
                                            >
                                                <Image style={{ height: 18, width: 18 }} source={require('@assets/ic-info-round.png')} />
                                                <Text
                                                    style={{
                                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                        color: theme.textSecondary,
                                                        flexShrink: 1
                                                    }}
                                                    numberOfLines={2}
                                                    ellipsizeMode={'tail'}
                                                >
                                                    {t('transfer.addressNotActive')}
                                                </Text>
                                            </Pressable>
                                        )}
                                        {i.spam && (
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                        color: theme.textSecondary,
                                                        flexShrink: 1
                                                    }}
                                                    numberOfLines={1}
                                                    ellipsizeMode={'tail'}
                                                >
                                                    {'SPAM'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </Pressable>
                                {!!i.jettonAmount && (
                                    <>
                                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                            }}>
                                                {t('transfer.gasFee')}
                                            </Text>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                                    {fromNano(i.message.amount) + ' TON'}
                                                </Text>
                                                <PriceComponent
                                                    amount={i.message.amount}
                                                    style={{
                                                        backgroundColor: theme.transparent,
                                                        paddingHorizontal: 0,
                                                        alignSelf: 'flex-end'
                                                    }}
                                                    textStyle={{
                                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                        color: theme.textSecondary,
                                                        flexShrink: 1
                                                    }}
                                                    theme={theme}
                                                />
                                            </View>
                                        </View>
                                    </>
                                )}
                                {!!i.operation.op && (
                                    <>
                                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                            }}>
                                                {t('transfer.purpose')}
                                            </Text>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                                    {t(i.operation.op.res, i.operation.op.options)}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                                {!!i.operation.comment && (
                                    <>
                                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                            }}>
                                                {t('transfer.commentLabel')}
                                            </Text>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                                    {i.operation.comment}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </ItemCollapsible>
                        );
                    })}
                    <View style={{ height: 56 }} />
                </View >
            </ScrollView >
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <RoundButton
                    title={t('common.confirm')}
                    action={doSend}
                />
            </View>
        </>
    );
});