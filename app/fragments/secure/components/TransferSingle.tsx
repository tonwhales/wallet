import BN from "bn.js";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, Text, Pressable, ScrollView, Image } from "react-native";
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit, toNano } from "ton";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { useEngine } from "../../../engine/Engine";
import { ContractMetadata } from "../../../engine/metadata/Metadata";
import { useItem } from "../../../engine/persistence/PersistedItem";
import { JettonMasterState } from "../../../engine/sync/startJettonMasterSync";
import { parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../../engine/transactions/resolveOperation";
import { Order } from "../../../fragments/secure/ops/Order";
import { LocalizedResources } from "../../../i18n/schema";
import { t } from "../../../i18n/t";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { backoff } from "../../../utils/time";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { PriceComponent } from "../../../components/PriceComponent";
import { WImage } from "../../../components/WImage";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { Avatar } from "../../../components/Avatar";
import { RoundButton } from "../../../components/RoundButton";
import { ItemGroup } from "../../../components/ItemGroup";
import { fromBNWithDecimals } from "../../../utils/withDecimals";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { holdersUrl } from "../../../engine/holders/HoldersProduct";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { useImage } from "@shopify/react-native-skia";
import { getMostPrevalentColorFromBytes } from "../../../utils/image/getMostPrevalentColorFromBytes";
import { openWithInApp } from "../../../utils/openWithInApp";

import TonSign from '../../../../assets/ic_ton_sign.svg';
import WithStateInit from '../../../../assets/ic_sign_contract.svg';
import IcAlert from '../../../../assets/ic-alert.svg';
import IcInfo from '../../../../assets/ic-info.svg';
import SignLock from '../../../../assets/ic_sign_lock.svg';
import Verified from '../../../../assets/ic-verified.svg';

type Props = {
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: BN,
        active: boolean,
        domain?: string
    },
    text: string | null,
    order: Order,
    job: string | null,
    fees: BN,
    metadata: ContractMetadata,
    restricted: boolean,
    jettonMaster: JettonMasterState | null
    callback: ((ok: boolean, result: Cell | null) => void) | null
    back?: number
}

export const TransferSingle = memo((props: Props) => {
    const authContext = useKeysAuth();
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const walletSettings = engine.products.wallets.useWalletSettings(engine.address);
    const account = useItem(engine.model.wallet(engine.address));
    const {
        restricted,
        target,
        text,
        order,
        job,
        fees,
        metadata,
        jettonMaster,
        callback,
        back
    } = props;

    // Resolve operation
    let body = order.messages[0].payload ? parseBody(order.messages[0].payload) : null;
    let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell, metadata.interfaces) : null;
    let operation = resolveOperation({
        body: body,
        amount: order.messages[0].amount,
        account: Address.parse(order.messages[0].target),
        metadata,
        jettonMaster
    });

    const jettonAmount = useMemo(() => {
        try {
            if (jettonMaster && order.messages[0].payload) {
                const temp = order.messages[0].payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.readUint(32);
                    parsing.readUint(64);
                    const unformatted = parsing.readCoins();
                    return fromBNWithDecimals(unformatted, jettonMaster.decimals);
                }
            }
        } catch (e) {
            console.warn(e);
        }

        return undefined;
    }, [order]);

    // Tracking
    const success = useRef(false);
    useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, AppConfig.isTestnet);
        }
    }, []);

    const friendlyTarget = target.address.toFriendly({ testOnly: AppConfig.isTestnet });
    // Contact wallets
    const contact = engine.products.settings.useContactAddress(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(AppConfig.isTestnet)[friendlyTarget]) {
        known = KnownWallets(AppConfig.isTestnet)[friendlyTarget];
    } else if (operation.title) {
        known = { name: operation.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = engine.products.settings.useDenyAddress(operation.address);
    let spam = engine.products.serverConfig.useIsSpamWallet(friendlyTarget) || isSpam;

    const amount = useMemo(() => {
        if (order.messages[0].amountAll) {
            return account.balance;
        }
        return order.messages[0].amount;
    }, [account, order]);


    // Confirmation
    const doSend = useCallback(async () => {
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

        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);


        // Check if same address
        if (target.address.equals(contract.address)) {
            Alert.alert(t('transfer.error.sendingToYourself'));
            return;
        }

        // Check amount
        if (!order.messages[0].amountAll && account.balance.lt(order.messages[0].amount)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (!order.messages[0].amountAll && order.messages[0].amount.eq(new BN(0))) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Check if trying to send to testnet
        if (!AppConfig.isTestnet && target.isTestOnly) {
            let cont = await confirm('transfer.error.addressIsForTestnet');
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
        if (!target.active && !order.messages[0].stateInit) {
            bounce = false;
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
            transfer = await contract.createTransfer({
                seqno: account.seqno,
                walletId: contract.source.walletId,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: order.messages[0].amountAll
                    ? SendMode.CARRRY_ALL_REMAINING_BALANCE
                    : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                order: new InternalMessage({
                    to: target.address,
                    value: order.messages[0].amount,
                    bounce,
                    body: new CommonMessageInfo({
                        stateInit: order.messages[0].stateInit ? new CellMessage(order.messages[0].stateInit) : null,
                        body: order.messages[0].payload ? new CellMessage(order.messages[0].payload) : new CommentMessage(text || '')
                    })
                })
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
        trackEvent(MixpanelEvent.Transfer, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, AppConfig.isTestnet);

        // Register pending
        engine.products.main.registerPending({
            id: 'pending-' + account.seqno,
            lt: null,
            fees: fees,
            amount: amount.mul(new BN(-1)),
            address: target.address,
            seqno: account.seqno,
            kind: 'out',
            body: order.messages[0].payload ? { type: 'payload', cell: order.messages[0].payload } : (text && text.length > 0 ? { type: 'comment', comment: text } : null),
            status: 'pending',
            time: Math.floor(Date.now() / 1000),
            bounced: false,
            prev: null,
            mentioned: [],
            hash: msg.hash(),
        });

        // Reset stack to root
        if (props.back && props.back > 0) {
            for (let i = 0; i < props.back; i++) {
                navigation.goBack();
            }
        } else {
            navigation.popToTop();
        }
    }, []);

    const inactiveAlert = useCallback(() => {
        Alert.alert(
            t('transfer.error.addressIsNotActive'),
            t('transfer.error.addressIsNotActiveDescription'),
            [{ text: t('common.gotIt') }])
    }, []);

    const feesAlert = useCallback(() => {
        Alert.alert(
            t('transfer.aboutFees', { amount: fromNano(fees) }),
            t('transfer.aboutFeesDescription'),
            [
                { text: 'More info', onPress: () => openWithInApp('https://ton.org') },
                { text: t('common.gotIt') }
            ]);
    }, [])

    const [capColor, setCapColor] = useState(Theme.accent);
    const image = useImage(jettonMaster?.image?.preview256);
    useEffect(() => {
        if (image) {
            const bytes = image.encodeToBytes();
            const newColor = getMostPrevalentColorFromBytes(bytes);
            setCapColor(newColor);
            return;
        }
        setCapColor('#0098EA');
    }, [image]);

    const jettonsGasAlert = useCallback(() => {
        if (!jettonAmount) return;
        Alert.alert(
            t('transfer.unusualJettonsGasTitle', { amount: fromNano(order.messages[0].amount) }),
            t('transfer.unusualJettonsGasMessage'),
            [{ text: t('common.gotIt') }]
        );

    }, [order.messages[0].amount, jettonAmount]);

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
                            backgroundColor: capColor,
                            height: 54,
                            position: 'absolute', left: 0, right: 0
                        }} />
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 68, flexDirection: 'row', height: 68 }}>
                                {!!jettonAmount && (
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            height: 68, width: 68,
                                            borderRadius: 34,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <WImage
                                            src={jettonMaster?.image?.preview256}
                                            blurhash={jettonMaster?.image?.blurhash}
                                            width={64}
                                            heigh={64}
                                            borderRadius={32}
                                        />
                                    </View>
                                )}
                                {!jettonAmount && (
                                    <View style={{
                                        backgroundColor: 'white',
                                        height: 68, width: 68,
                                        borderRadius: 34,
                                        justifyContent: 'center',
                                        alignItems: 'center',
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
                                )}
                            </View>
                        </View>
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 17, lineHeight: 24, fontWeight: '600',
                                color: Theme.textColor,
                                marginTop: 8
                            }}>
                                {t('common.send')}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {!jettonAmount && (
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 32, lineHeight: 38,
                                    color: Theme.textColor
                                }}>
                                    {fromNano(amount) + ' TON'}
                                </Text>
                            )}
                            {!!jettonAmount && (
                                <Text
                                    style={{
                                        fontWeight: '600',
                                        fontSize: 32, lineHeight: 38,
                                        color: Theme.textColor
                                    }}
                                >
                                    {`${jettonAmount} ${jettonMaster?.symbol ?? ''}`}
                                </Text>
                            )}
                        </View>
                        {!jettonAmount && (
                            <PriceComponent
                                amount={amount}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0, marginTop: 2,
                                    alignSelf: 'center'
                                }}
                                textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 17, lineHeight: 24 }}
                            />
                        )}
                    </ItemGroup>

                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: Theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ marginRight: 12 }}>
                                        <Avatar
                                            size={24}
                                            id={engine.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                            address={engine.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                            borderWith={0}
                                        />
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textColor }}>
                                        <AddressComponent address={engine.address} end={4} />
                                    </Text>
                                </View>
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
                                {t('common.to')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ marginRight: 12 }}>
                                        <Avatar
                                            size={24}
                                            id={target.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                            address={target.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                            borderWith={0}
                                            dontShowVerified
                                        />
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textColor }}>
                                        <AddressComponent address={target.address} end={4} />
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    {!!known && (
                                        <>
                                            <Text
                                                style={{
                                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                    color: Theme.textSecondary,
                                                    flexShrink: 1
                                                }}
                                                numberOfLines={1}
                                                ellipsizeMode={'tail'}
                                            >
                                                {known?.name.length > 16 ? known?.name.slice(0, 16) + '...' : known?.name}
                                            </Text>
                                            <Verified style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                        </>
                                    )}
                                    {!!order.domain && (
                                        <Text
                                            style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: Theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {`${!!known ? ' • ' : ''}${order.domain.length > 16 ? order.domain.slice(0, 16) + '...' : order.domain}`}
                                        </Text>
                                    )}
                                </View>
                                {(!target.active && !order.messages[0].stateInit) && (
                                    <Pressable
                                        style={{ flexDirection: 'row' }}
                                        onPress={inactiveAlert}
                                    >
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
                                    </Pressable>
                                )}
                                {spam && (
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
                        {!!operation.op && !jettonAmount && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                    }}>
                                        {t('transfer.smartContract')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {order?.app?.domain !== extractDomain(holdersUrl) && (
                                            <View style={{
                                                backgroundColor: Theme.surfacePimary,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        )}
                                        {order?.app?.domain === extractDomain(holdersUrl) && (
                                            <View style={{
                                                height: 46, width: 34,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <Image
                                                    style={{
                                                        height: 46, width: 34,
                                                    }}
                                                    source={require('../../../../assets/ic_sign_card.png')}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}
                        {!operation.comment && !operation.op && !!text && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                    }}>
                                        {t('transfer.smartContract')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {order?.app?.domain !== extractDomain(holdersUrl) && (
                                            <View style={{
                                                backgroundColor: Theme.surfacePimary,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        )}
                                        {order?.app?.domain === extractDomain(holdersUrl) && (
                                            <View style={{
                                                height: 46, width: 34,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <Image
                                                    style={{
                                                        height: 46, width: 34,
                                                    }}
                                                    source={require('../../../../assets/ic_sign_card.png')}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}
                        {!!operation.op && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                    }}>
                                        {t('transfer.purpose')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textColor, textAlign: 'right' }}>
                                            {operation.op}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {!!text && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'column', paddingHorizontal: 10 }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                    }}>
                                        {t('transfer.comment')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-start', flexShrink: 1, marginTop: 2 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textColor, textAlign: 'right' }}>
                                            {text}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                        {!!jettonAmount && (
                            <>
                                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                                <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
                                    }}>
                                        {t('transfer.gasFee')}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 }}>
                                        <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textColor }}>
                                            {fromNano(order.messages[0].amount) + ' TON'}
                                        </Text>
                                    </View>

                                    {order.messages[0].amount.gt(toNano('0.2')) && (
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
                                    )}
                                </View>
                            </>
                        )}
                    </ItemGroup>
                    <ItemGroup>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Pressable
                                onPress={feesAlert}
                                style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: Theme.textSecondary,
                                }}>
                                    {t('transfer.feeTitle')}
                                </Text>
                                <IcInfo
                                    height={16} width={16}
                                    style={{ height: 16, width: 16, marginLeft: 10 }}
                                    color={Theme.iconPrimary}
                                />
                            </Pressable>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textColor }}>
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
                    </ItemGroup>
                    <View style={{ height: 54 }} />
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