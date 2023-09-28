import BN from "bn.js";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Alert, View, Text, ScrollView, Pressable } from "react-native";
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from "ton";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { useEngine } from "../../../engine/Engine";
import { ContractMetadata } from "../../../engine/metadata/Metadata";
import { useItem } from "../../../engine/persistence/PersistedItem";
import { usePrice } from "../../../engine/PriceContext";
import { JettonMasterState } from "../../../engine/sync/startJettonMasterSync";
import { parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../../engine/transactions/resolveOperation";
import { createWalletTransferV4, internalFromSignRawMessage } from "../../../engine/utils/createWalletTransferV4";
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
import { fromBNWithDecimals } from "../../../utils/withDecimals";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { confirmAlert } from "../../../utils/confirmAlert";

import IcAlert from '@assets/ic-alert.svg';
import TonSign from '@assets/ic_ton_sign.svg';
import SignLock from '@assets/ic_sign_lock.svg';
import Verified from '@assets/ic-verified.svg';

type Props = {
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
            amount: BN,
            amountAll: boolean,
            payload: Cell | null,
            stateInit: Cell | null,
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
}

export const TransferBatch = memo((props: Props) => {
    const authContext = useKeysAuth();
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const walletSettings = engine.products.wallets.useWalletSettings(engine.address);
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

    const { internals, totalJettons, gas } = useMemo(() => {
        const temp = [];
        const totalJettons = new Map<string, { jettonMaster: JettonMasterState, jettonAmount: BN, gas: BN }>();
        let gas = {
            total: new BN(0),
            unusual: false
        };
        for (const message of order.messages) {
            let body = message.payload ? parseBody(message.payload) : null;
            let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell, message.metadata.interfaces) : null;

            // Read jetton master
            let jettonMaster: JettonMasterState | null = null;
            if (message.metadata.jettonWallet) {
                jettonMaster = engine.persistence.jettonMasters.item(message.metadata.jettonWallet!.master).value;
            }

            let jettonAmount: BN | null = null;
            try {
                if (jettonMaster && message.payload) {
                    const temp = message.payload;
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
                        gas: message.amount
                    });
                }

                gas.total = gas.total.add(message.amount);

                if (message.amount.gt(toNano('0.2'))) {
                    gas.unusual = true;
                }
            }

            // Resolve operation
            let operation = resolveOperation({
                body: body,
                amount: message.amount,
                account: message.addr.address,
                metadata: message.metadata,
                jettonMaster
            });

            const contact = (engine.products.settings.addressBook.value.contacts ?? {})[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];
            const friendlyTarget = message.addr.address.toFriendly({ testOnly: AppConfig.isTestnet });
            let known: KnownWallet | undefined = undefined;
            if (KnownWallets(AppConfig.isTestnet)[friendlyTarget]) {
                known = KnownWallets(AppConfig.isTestnet)[friendlyTarget];
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
            trackEvent(MixpanelEvent.TransferCancel, { order }, AppConfig.isTestnet);
        }
    }, []);


    // Confirmation
    const doSend = useCallback(async () => {
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

            // Create message
            const msg = internalFromSignRawMessage({
                target: i.message.addr.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                amount: i.message.amount,
                payload: i.message.payload,
                amountAll: i.message.amountAll,
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
            walletKeys = await authContext.authenticate({ cancelable: true });
        } catch (e) {
            return;
        }

        // Create transfer
        let transfer: Cell;
        try {
            transfer = createWalletTransferV4({
                seqno: account.seqno,
                walletId: contract.source.walletId,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                messages
            });
        } catch (e) {
            warn('Failed to create transfer');
            return;
        }

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
        trackEvent(MixpanelEvent.Transfer, { order }, AppConfig.isTestnet);

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
                    {!!order.app && (
                        <View style={{
                            marginTop: 8,
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                        }}>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                flexShrink: 1,
                            }}>
                                {t('transfer.requestsToSign', { app: order.app.title })}
                            </Text>
                            <View style={{
                                alignItems: 'center',
                                flexDirection: 'row',
                                flexShrink: 1,
                            }}>
                                <SignLock />
                                <Text style={{
                                    textAlign: 'center',
                                    fontSize: 14,
                                    fontWeight: '400',
                                    marginLeft: 4,
                                    color: Theme.textSecondary
                                }}>
                                    {order.app.domain}
                                </Text>
                            </View>
                        </View>
                    )}
                    <ItemGroup style={{ marginBottom: 16, marginTop: 16, paddingTop: 27 }}>
                        <View style={{
                            backgroundColor: Theme.accent,
                            height: 54,
                            position: 'absolute', left: 0, right: 0
                        }} />
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 34 * (totalJettons.size + 2), flexDirection: 'row', height: 68 }}>
                                {totalJettons.size > 0 && (
                                    Array.from(totalJettons).map((value, index) => {
                                        return (
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    height: 68, width: 68,
                                                    borderRadius: 34,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    position: 'absolute',
                                                    left: 34 + 68 * (index) - 34 * index,
                                                }}
                                                key={value[0]}
                                            >
                                                <WImage
                                                    src={value[1].jettonMaster.image?.preview256}
                                                    blurhash={value[1].jettonMaster.image?.blurhash}
                                                    width={64}
                                                    heigh={64}
                                                    borderRadius={32}
                                                />
                                            </View>
                                        )
                                    })
                                )}
                                <View style={{
                                    backgroundColor: 'white',
                                    height: 68, width: 68,
                                    borderRadius: 34,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'absolute',
                                    left: 0,
                                }}>
                                    <View style={{
                                        backgroundColor: Theme.ton,
                                        height: 64, width: 64,
                                        borderRadius: 32,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                        <TonSign height={26} width={26} color={'white'} />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 17, lineHeight: 24, fontWeight: '600',
                                color: Theme.textPrimary,
                                marginTop: 8
                            }}>
                                {t('common.send')}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17, lineHeight: 24,
                                color: Theme.textPrimary
                            }}>
                                {fromNano(totalAmount) + ' TON'}
                            </Text>
                            {Array.from(totalJettons).map((value, index) => {
                                return (
                                    <>
                                        <Text
                                            key={`jetton-amount-${index}`}
                                            style={{
                                                fontWeight: '600',
                                                fontSize: 17, lineHeight: 24,
                                                color: Theme.textPrimary
                                            }}
                                        >
                                            {index !== totalJettons.size - 1 ? ' • ' : ''}
                                            {fromBNWithDecimals(value[1].jettonAmount, value[1].jettonMaster.decimals) + ' ' + value[1].jettonMaster.symbol}
                                        </Text>
                                    </>
                                );
                            })}
                        </View>
                        <PriceComponent
                            amount={totalAmount}
                            style={{
                                backgroundColor: Theme.transparent,
                                paddingHorizontal: 0, marginTop: 2,
                                alignSelf: 'center'
                            }}
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 17, lineHeight: 24 }}
                        />
                    </ItemGroup>
                    <ItemGroup>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: Theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                    <AddressComponent address={engine.address} end={4} />
                                </Text>
                                {walletSettings?.name && (
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: Theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {walletSettings.name}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: Theme.textSecondary,
                            }}>
                                {t('transfer.feeTotalTitle')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                    {fromNano(fees) + ' TON'}
                                </Text>
                                <PriceComponent
                                    amount={fees}
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                        flexShrink: 1
                                    }}
                                />
                            </View>
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
                                        color: Theme.accentRed
                                    }}>
                                        {t('transfer.unusualJettonsGas')}
                                    </Text>
                                    <IcAlert style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                </Pressable>
                            </View>
                        )}
                    </ItemGroup>

                    {internals.map((i, index) => {
                        return (
                            <>
                                <ItemCollapsible
                                    style={{ marginTop: 16 }}
                                    titleStyle={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                    }}
                                    title={t('common.transaction') + ` #${index + 1}`}
                                >
                                    <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: Theme.textSecondary,
                                        }}>
                                            {t('common.amount')}
                                        </Text>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                                {i.jettonAmount
                                                    ? fromNano(i.jettonAmount) + (i.jettonMaster?.symbol ?? '')
                                                    : fromNano(i.message.amount) + ' TON'
                                                }
                                            </Text>
                                            {!i.jettonAmount && (
                                                <PriceComponent
                                                    amount={i.message.amount}
                                                    style={{
                                                        backgroundColor: Theme.transparent,
                                                        paddingHorizontal: 0,
                                                        alignSelf: 'flex-end'
                                                    }}
                                                    textStyle={{
                                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                        color: Theme.textSecondary,
                                                        flexShrink: 1
                                                    }}
                                                />
                                            )}
                                        </View>
                                    </View>
                                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                                    <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: Theme.textSecondary,
                                        }}>
                                            {t('common.to')}
                                        </Text>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                                <AddressComponent address={i.operation.address} end={4} />
                                            </Text>
                                            {i.known && (
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                            color: Theme.textSecondary,
                                                            flexShrink: 1
                                                        }}
                                                        numberOfLines={1}
                                                        ellipsizeMode={'tail'}
                                                    >
                                                        {i.known?.name}
                                                    </Text>
                                                    <Verified style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                                </View>
                                            )}
                                            {(!i.message.addr.active) && (
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                            color: Theme.textSecondary,
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
                                                            color: Theme.textSecondary,
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
                                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                                            <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{
                                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                    color: Theme.textSecondary,
                                                }}>
                                                    {t('transfer.gasFee')}
                                                </Text>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                                        {fromNano(i.message.amount) + ' TON'}
                                                    </Text>
                                                    <PriceComponent
                                                        amount={i.message.amount}
                                                        style={{
                                                            backgroundColor: Theme.transparent,
                                                            paddingHorizontal: 0,
                                                            alignSelf: 'flex-end'
                                                        }}
                                                        textStyle={{
                                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                            color: Theme.textSecondary,
                                                            flexShrink: 1
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </>
                                    )}
                                    {!!i.operation.op && (
                                        <>
                                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                                            <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{
                                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                    color: Theme.textSecondary,
                                                }}>
                                                    {t('transfer.purpose')}
                                                </Text>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                                        {i.operation.op}
                                                    </Text>
                                                </View>
                                            </View>
                                        </>
                                    )}
                                    {!!i.operation.comment && (
                                        <>
                                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
                                            <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{
                                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                    color: Theme.textSecondary,
                                                }}>
                                                    {t('transfer.commentLabel')}
                                                </Text>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
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