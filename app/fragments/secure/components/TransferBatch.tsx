import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Alert, View, Text, ScrollView, Pressable, Image } from "react-native";
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
import { useAppData, useAppManifest, useClient4, useCommitCommand, useNetwork, useRegisterPending, useSelectedAccount, useServerConfig, useTheme } from "../../../engine/hooks";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { getJettonMaster } from "../../../engine/getters/getJettonMaster";
import { Address, Cell, MessageRelaxed, SendMode, beginCell, external, fromNano, storeMessage, internal, toNano, loadStateInit, comment } from "@ton/core";
import { ContractMetadata } from "../../../engine/metadata/Metadata";
import { getAccountLite } from "../../../engine/getters/getAccountLite";
import { fetchSeqno } from "../../../engine/api/fetchSeqno";
import { getLastBlock } from "../../../engine/accountWatcher";
import { StoredOperation } from "../../../engine/types";
import { AddressContact, useAddressBook } from "../../../engine/hooks/contacts/useAddressBook";
import { OrderMessage } from "../TransferFragment";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { useWalletSettings } from "../../../engine/hooks/appstate/useWalletSettings";
import { AppInfo } from "../../../components/ConnectedAppButton";

import IcAlert from '@assets/ic-alert.svg';
import IcTonIcon from '@assets/ic-ton-acc.svg';
import { ItemDivider } from "../../../components/ItemDivider";

type Props = {
    text: string | null,
    job: string | null,
    order: {
        messages: {
            addr: {
                address: Address;
                balance: bigint,
                active: boolean
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: bigint,
            amountAll: boolean,
            payload: Cell | null,
            stateInit: Cell | null,
        }[],
        app?: {
            url: string,
            domain: string,
            title: string
        }
    },
    fees: bigint,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    totalAmount: bigint
}

export const TransferBatch = memo((props: Props) => {
    const authContext = useKeysAuth();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
    const commitCommand = useCommitCommand();
    const registerPending = useRegisterPending();
    const [walletSettings,] = useWalletSettings(selected?.address);
    const [addressBook,] = useAddressBook();
    const contacts = addressBook.contacts;
    const denyList = addressBook.denyList;
    const serverConfig = useServerConfig();

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

    const {
        text,
        order,
        job,
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
                        parsing.loadUint(32);
                        parsing.loadUint(64);
                        jettonAmount = parsing.loadCoins();
                    }
                }
            } catch (e) {
                console.warn(e);
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

    // Tracking
    const success = useRef(false);
    useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { order }, isTestnet);
        }
    }, []);


    // Confirmation
    const doSend = useCallback(async () => {
        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);

        if (!selected) {
            return;
        }

        const messages: MessageRelaxed[] = [];
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

            const body = !!order.messages[0].payload
                ? order.messages[0].payload
                : text ? comment(text) : null;

            // Create message
            const msg = internal({
                to: i.message.addr.address,
                value: i.message.amount,
                init: internalStateInit,
                bounce,
                body,
            });

            if (msg) {
                messages.push(msg);
            }

        }

        const account = getAccountLite(selected.addressString);

        // Check amount
        if (account!.balance < totalAmount) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (totalAmount === 0n) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }


        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ cancelable: true });
        } catch (e) {
            return;
        }

        let seqno = await fetchSeqno(client, await getLastBlock(), selected.address);

        // Create transfer
        let transfer: Cell;
        try {
            transfer = contract.createTransfer({
                seqno: seqno,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: order.messages[0].amountAll
                    ? SendMode.CARRY_ALL_REMAINING_BALANCE
                    : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages,
            });
        } catch (e) {
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

        // Notify job
        if (job) {
            await commitCommand(true, job, transfer);
        }

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
        trackEvent(MixpanelEvent.Transfer, { order }, isTestnet);

        // Register pending
        registerPending({
            id: 'pending-' + seqno,
            status: 'pending',
            fees: fees,
            amount: totalAmount * (BigInt(-1)),
            address: null,
            seqno: seqno,
            body: { type: 'batch' },
            time: Math.floor(Date.now() / 1000),
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
                    heigh={68}
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
                        heigh={68}
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
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: index < Array.from(totalJettons).length - 1 ? 16 : 0 }}>
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
                                            heigh={48}
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
                                        {'-' + fromBnWithDecimals(value[1].jettonAmount, value[1].jettonMaster.decimals) + ' ' + value[1].jettonMaster.symbol}
                                    </Text>
                                </View>
                            )
                        })}
                    </ItemGroup>
                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                    <AddressComponent address={selected!.address} end={4} />
                                </Text>
                                {walletSettings?.name && (
                                    <Text
                                        style={{
                                            fontSize: 17, lineHeight: 24, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1, marginLeft: 6
                                        }}
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
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('transfer.feeTotalTitle')}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
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
                                                        opacity: pressed ? 0.5 : 1
                                                    }
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 15, lineHeight: 20,
                                                    fontWeight: '400',
                                                    color: theme.accentRed
                                                }}>
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
                        return (
                            <>
                                <ItemCollapsible
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
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                        }}>
                                            {t('common.to')}
                                        </Text>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                                <AddressComponent address={Address.parse(i.operation.address)} start={10} end={4} />
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
                                                        {t('transfer.addressNotActive')}
                                                    </Text>
                                                    <IcAlert style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                                </View>
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
                                    </View>
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
                            </>
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