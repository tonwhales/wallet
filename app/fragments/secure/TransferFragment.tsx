import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { RoundButton } from '../../components/RoundButton';
import { Theme } from '../../Theme';
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
import { ItemDivider } from '../../components/ItemDivider';
import { CloseButton } from '../../components/CloseButton';
import { Order } from './ops/Order';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { useItem } from '../../engine/persistence/PersistedItem';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { resolveOperation } from '../../engine/transactions/resolveOperation';
import { JettonMasterState } from '../../engine/sync/startJettonMasterSync';
import { estimateFees } from '../../engine/estimate/estimateFees';
import { warn } from '../../utils/log';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { DNS_CATEGORY_NEXT_RESOLVER, DNS_CATEGORY_WALLET, resolveDomain, tonDnsRootAddress } from '../../utils/dns/dns';
import LottieView from 'lottie-react-native';
import TonSign from '../../../assets/ic_ton_sign.svg';
import TransferToArrow from '../../../assets/ic_transfer_to.svg';
import Contact from '../../../assets/ic_transfer_contact.svg';
import VerifiedIcon from '../../../assets/ic_verified.svg';
import TonSignGas from '../../../assets/ic_transfer_gas.svg';
import SignLock from '../../../assets/ic_sign_lock.svg';
import WithStateInit from '../../../assets/ic_sign_contract.svg';
import SmartContract from '../../../assets/ic_sign_smart_contract.svg';
import Staking from '../../../assets/ic_sign_staking.svg';
import Question from '../../../assets/ic_question.svg';
import { PriceComponent } from '../../components/PriceComponent';
import { Avatar } from '../../components/Avatar';
import { AddressComponent } from '../../components/AddressComponent';
import { ItemCollapsible } from '../../components/ItemCollapsible';
import { WImage } from '../../components/WImage';
import { ItemAddress } from '../../components/ItemAddress';
import { parseMessageBody } from '../../engine/transactions/parseMessageBody';

export type ATextInputRef = {
    focus: () => void;
}

type ConfirmLoadedProps = {
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
};

const TransferLoaded = React.memo((props: ConfirmLoadedProps) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
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

    console.log({ payload: order.payload?.toBoc({ idx: false }).toString('base64'), target: order.target });

    // Resolve operation
    let body = order.payload ? parseBody(order.payload) : null;
    let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell, metadata.interfaces) : null;
    let operation = resolveOperation({ body: body, amount: order.amount, account: Address.parse(order.target), metadata, jettonMaster });
    const jettonAmount = React.useMemo(() => {
        try {
            if (jettonMaster && order.payload) {
                const temp = order.payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.readUint(32);
                    parsing.readUint(64);
                    return parsing.readCoins();
                }
            }
        } catch (e) {
            console.warn(e);
        }

        return undefined;
    }, [order]);

    // Tracking
    const success = React.useRef(false);
    React.useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { target: order.target, amount: order.amount.toString(10) });
        }
    }, []);

    const friendlyTarget = target.address.toFriendly({ testOnly: AppConfig.isTestnet });
    // Contact wallets
    const contact = engine.products.settings.useContactAddress(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets[friendlyTarget]) {
        known = KnownWallets[friendlyTarget];
    } else if (operation.title) {
        known = { name: operation.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = engine.products.settings.useDenyAddress(operation.address);
    let spam = engine.products.serverConfig.useIsSpamWallet(friendlyTarget) || isSpam


    // Confirmation
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

        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);


        // Check if same address
        if (target.address.equals(contract.address)) {
            Alert.alert(t('transfer.error.sendingToYourself'));
            return;
        }

        // Check amount
        if (!order.amountAll && account.balance.lt(order.amount)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (!order.amountAll && order.amount.eq(new BN(0))) {
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
        if (!target.active && !order.stateInit) {
            bounce = false;
        }

        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            return;
        }

        // Create transfer
        let transfer = await contract.createTransfer({
            seqno: account.seqno,
            walletId: contract.source.walletId,
            secretKey: walletKeys.keyPair.secretKey,
            sendMode: order.amountAll
                ? SendMode.CARRRY_ALL_REMAINING_BALANCE
                : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
            order: new InternalMessage({
                to: target.address,
                value: order.amount,
                bounce,
                body: new CommonMessageInfo({
                    stateInit: order.stateInit ? new CellMessage(order.stateInit) : null,
                    body: order.payload ? new CellMessage(order.payload) : new CommentMessage(text || '')
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
        trackEvent(MixpanelEvent.Transfer, { target: order.target, amount: order.amount.toString(10) });

        // Register pending
        engine.products.main.registerPending({
            id: 'pending-' + account.seqno,
            lt: null,
            fees: fees,
            amount: order.amount.mul(new BN(-1)),
            address: target.address,
            seqno: account.seqno,
            kind: 'out',
            body: order.payload ? { type: 'payload', cell: order.payload } : (text && text.length > 0 ? { type: 'comment', comment: text } : null),
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

    const anim = React.useRef<LottieView>(null);

    React.useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play()
        }, 300);
    }, []);

    const inactiveAlert = React.useCallback(
        () => {
            Alert.alert(t('transfer.error.addressIsNotActive'),
                t('transfer.error.addressIsNotActiveDescription'),
                [{ text: t('common.gotIt') }])
        },
        [],
    );


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
                                {t('transfer.confirmTitle')}
                            </Text>
                        )}
                    </View>
                    <View
                        style={{
                            marginTop: 30,
                            backgroundColor: Theme.item,
                            borderRadius: 14,
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 20,
                            marginBottom: 14
                        }}
                    >
                        <View>
                            {!jettonAmount && (
                                <>
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 40,
                                        justifyContent: 'center'
                                    }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: Theme.textColor,
                                            marginLeft: 2,
                                        }}>
                                            {`${fromNano(order.amountAll ? account.balance : order.amount)} TON`}
                                        </Text>
                                        <PriceComponent
                                            prefix={'~'}
                                            amount={order.amountAll ? account.balance : order.amount}
                                            style={{
                                                backgroundColor: 'transparent',
                                                paddingHorizontal: 0,
                                                marginLeft: 2
                                            }}
                                            textStyle={{ color: Theme.textColor, fontWeight: '400', fontSize: 14 }}
                                        />
                                        {!!operation.comment && operation.comment.length > 0 && (
                                            <View style={{
                                                backgroundColor: Theme.background,
                                                padding: 10,
                                                borderRadius: 6,
                                                marginTop: 8,
                                                marginBottom: 22,
                                            }}>
                                                <Text>
                                                    {`💬 ${operation.comment}`}
                                                </Text>
                                                <View style={{
                                                    marginLeft: 40 + 6,
                                                    marginVertical: 14,
                                                    justifyContent: 'center',
                                                    minHeight: 22,
                                                    position: 'absolute',
                                                    left: -82, top: operation.comment.length > 32 ? 22 : 8, bottom: 0,
                                                }}>
                                                    <View>
                                                        <TransferToArrow />
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                        <View style={{
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                            backgroundColor: Theme.accent,
                                            height: 40, width: 40,
                                            borderRadius: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginTop: 2
                                        }}>
                                            <TonSign />
                                        </View>
                                    </View>
                                    {!(!!operation.comment && operation.comment.length > 0) && (
                                        <View style={{
                                            marginLeft: 40 + 6,
                                            marginVertical: 14,
                                            justifyContent: 'center',
                                            minHeight: 22,
                                        }}>
                                            <View style={{
                                                position: 'absolute',
                                                left: -26 - 10, top: 0, bottom: 0,
                                            }}>
                                                <TransferToArrow />
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                            {!!jettonAmount && !!jettonMaster && (
                                <>
                                    <View style={{
                                        position: 'absolute',
                                        top: 44,
                                        bottom: contact ? 48 : 44,
                                        left: 17,
                                        width: 2,
                                        borderRadius: 2,
                                        backgroundColor: Theme.divider
                                    }} />
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 40,
                                        justifyContent: 'center'
                                    }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: Theme.textColor,
                                            marginLeft: 2
                                        }}>
                                            {`${fromNano(jettonAmount)} ${jettonMaster.symbol}`}
                                        </Text>
                                        {!!operation.comment && operation.comment.length > 0 && (
                                            <View style={{
                                                backgroundColor: Theme.background,
                                                padding: 10,
                                                borderRadius: 6,
                                                marginTop: 8
                                            }}>
                                                <Text>
                                                    {`💬 ${operation.comment}`}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                            backgroundColor: Theme.accent,
                                            height: 40, width: 40,
                                            borderRadius: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginTop: 2
                                        }}>
                                            <WImage
                                                src={jettonMaster.image?.preview256}
                                                blurhash={jettonMaster.image?.blurhash}
                                                width={40}
                                                heigh={40}
                                                borderRadius={40}
                                            />
                                        </View>
                                    </View>
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 24,
                                        marginTop: 20, marginBottom: 30,
                                        justifyContent: 'center'
                                    }}>
                                        {!AppConfig.isTestnet && (
                                            <PriceComponent
                                                prefix={`${t('transfer.gasFee')} ${fromNano(order.amount)} TON (`}
                                                suffix={')'}
                                                amount={order.amountAll ? account.balance : order.amount}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    paddingHorizontal: 0,
                                                    marginLeft: 2
                                                }}
                                                textStyle={{
                                                    color: '#858B93',
                                                    fontWeight: '400', fontSize: 14
                                                }}
                                            />
                                        )}
                                        {AppConfig.isTestnet && (
                                            <Text style={{
                                                color: '#858B93',
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {`${t('transfer.gasFee')} ${fromNano(order.amount)} TON`}
                                            </Text>
                                        )}
                                        <View style={{
                                            backgroundColor: Theme.item,
                                            shadowColor: 'rgba(0, 0, 0, 0.25)',
                                            shadowOffset: {
                                                height: 1,
                                                width: 0
                                            },
                                            shadowRadius: 3,
                                            shadowOpacity: 1,
                                            height: 24, width: 24,
                                            borderRadius: 24,
                                            position: 'absolute', top: 0, bottom: 0, left: -40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            <TonSignGas />
                                        </View>
                                    </View>
                                </>
                            )}
                            {(!!contact || !!known) && (
                                <View style={{
                                    marginLeft: 40 + 6,
                                    minHeight: 40,
                                    justifyContent: 'center'
                                }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: Theme.textColor,
                                            marginLeft: 2,
                                        }}>
                                            {`${contact?.name ?? known?.name}`}
                                        </Text>
                                        {known && (
                                            <VerifiedIcon
                                                width={20}
                                                height={20}
                                                style={{ alignSelf: 'center', marginLeft: 6 }}
                                            />
                                        )}
                                    </View>
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 14,
                                        color: '#858B93',
                                        marginLeft: 2,
                                        marginTop: 4
                                    }}>
                                        <AddressComponent address={target.address} />
                                    </Text>
                                    {!target.active && !order.stateInit && (
                                        <>
                                            <Pressable
                                                onPress={inactiveAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: '#FFC165',
                                                        paddingHorizontal: 8, paddingVertical: 4,
                                                        marginTop: 4,
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
                                                    {t('transfer.error.addressIsNotActive')}
                                                </Text>
                                                <Question style={{ marginLeft: 5 }} />
                                            </Pressable>
                                        </>
                                    )}
                                    {contact && (
                                        <>
                                            <View style={{
                                                position: 'absolute',
                                                left: -48, top: 0, bottom: 0,
                                                backgroundColor: '#EDA652',
                                                height: 40, width: 40,
                                                borderRadius: 40,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: 36
                                            }}>
                                                <Contact />
                                            </View>
                                            <View style={{
                                                alignSelf: 'flex-start',
                                                borderRadius: 6, borderWidth: 1,
                                                borderColor: '#DEDEDE',
                                                paddingHorizontal: 8, paddingVertical: 4,
                                                marginTop: 4
                                            }}>
                                                <Text>
                                                    {t('transfer.contact')}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                    {!contact && (
                                        <View style={{
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                            height: 40, width: 40,
                                        }}>
                                            <Avatar
                                                address={friendlyTarget}
                                                id={friendlyTarget}
                                                size={40}
                                                spam={spam}
                                                dontShowVerified={true}
                                            />
                                        </View>
                                    )}
                                </View>
                            )}
                            {(!contact && !known) && (
                                <View style={{
                                    marginLeft: 40 + 6,
                                    minHeight: 40,
                                    justifyContent: 'center'
                                }}>
                                    <Text style={{
                                        fontWeight: '700',
                                        fontSize: 20,
                                        color: Theme.textColor,
                                        marginLeft: 2
                                    }}>
                                        <AddressComponent address={target.address} />
                                    </Text>
                                    <View style={{
                                        position: 'absolute',
                                        left: -48, top: 0, bottom: 0,
                                        height: 40, width: 40,
                                    }}>
                                        <Avatar
                                            address={friendlyTarget}
                                            id={friendlyTarget}
                                            size={40}
                                            spam={spam}
                                            dontShowVerified={true}
                                        />
                                    </View>
                                    {!target.active && !order.stateInit && (
                                        <>
                                            <Pressable
                                                onPress={inactiveAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: '#FFC165',
                                                        paddingHorizontal: 8, paddingVertical: 4,
                                                        marginTop: 4,
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
                                                    {t('transfer.error.addressIsNotActive')}
                                                </Text>
                                                <Question style={{ marginLeft: 5 }} />
                                            </Pressable>
                                        </>
                                    )}
                                </View>
                            )}
                        </View>

                        {!jettonAmount && (!!operation.op || (!operation.comment && !operation.op && !!text)) && (
                            <View>
                                <View style={{
                                    position: 'absolute',
                                    top: -2,
                                    bottom: 42,
                                    left: 17,
                                    width: 2,
                                    borderRadius: 2,
                                    backgroundColor: Theme.divider
                                }} />
                                <View style={{
                                    marginLeft: 40 + 6,
                                    justifyContent: 'center'
                                }}>
                                    {!!operation.op && (
                                        <View style={{ marginLeft: 2, marginVertical: 30, minHeight: 24, justifyContent: 'center' }}>
                                            <Text style={{
                                                color: '#858B93',
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {t('transfer.smartContract')}
                                            </Text>
                                            <View style={{
                                                backgroundColor: Theme.item,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                position: 'absolute', top: 0, bottom: 0, left: -42,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        </View>
                                    )}
                                    {!operation.comment && !operation.op && !!text && (
                                        <View style={{ marginLeft: 2, marginVertical: 30, minHeight: 24, justifyContent: 'center' }}>
                                            <Text style={{
                                                color: '#858B93',
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {t('transfer.smartContract')}
                                            </Text>
                                            <View style={{
                                                backgroundColor: Theme.item,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                position: 'absolute', top: 0, bottom: 0, left: -42,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        </View>
                                    )}
                                </View>
                                <View style={{
                                    marginLeft: 40 + 6,
                                    justifyContent: 'center'
                                }}>
                                    {!!operation.op && (
                                        <View style={{ marginLeft: 2, minHeight: 40, justifyContent: 'center' }}>
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 17,
                                                color: Theme.textColor,
                                            }}>
                                                {operation.op}
                                            </Text>
                                        </View>
                                    )}
                                    {!operation.comment && !operation.op && !!text && (
                                        <View style={{ marginLeft: 2, minHeight: 40, justifyContent: 'center' }}>
                                            <Text style={{
                                                flexShrink: 1,
                                                fontWeight: '500',
                                                fontSize: 14,
                                                color: Theme.textColor,
                                                opacity: 0.4
                                            }}>
                                                {text}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{
                                        backgroundColor: '#60C75E',
                                        height: 40, width: 40,
                                        borderRadius: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'absolute',
                                        left: -48, top: 0, bottom: 0,
                                    }}>
                                        {(parsedBody?.type === 'deposit' || parsedBody?.type === 'withdraw') && (
                                            <Staking />
                                        )}
                                        {!(parsedBody?.type === 'deposit' || parsedBody?.type === 'withdraw') && (
                                            <SmartContract />
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                    </View>
                    <ItemGroup>
                        <ItemCollapsible title={t('transfer.moreDetails')}>
                            <ItemAddress
                                title={t('common.walletAddress')}
                                text={operation.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                verified={!!known}
                                contact={!!contact}
                                secondary={known ? known.name : contact?.name ?? undefined}
                            />
                            {!!props.order.domain && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('common.domain')} text={`${props.order.domain}.ton`} />
                                </>
                            )}
                            {!!operation.op && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.purpose')} text={operation.op} />
                                </>
                            )}
                            {!operation.comment && !operation.op && !!text && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.purpose')} text={text} />
                                </>
                            )}
                            {!operation.comment && !operation.op && order.payload && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.unknown')} text={order.payload.hash().toString('base64')} />
                                </>
                            )}
                            {!!jettonAmount && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.gasFee')} text={fromNano(order.amount) + ' TON'} />
                                </>
                            )}
                            <ItemDivider />
                            <ItemLarge title={t('transfer.feeTitle')} text={fromNano(fees) + ' TON'} />
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

export const TransferFragment = fragment(() => {
    const params: {
        text: string | null,
        order: Order,
        job: string | null,
        callback?: ((ok: boolean, result: Cell | null) => void) | null,
        back?: number
    } = useRoute().params! as any;
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    // Memmoize all parameters just in case
    const from = React.useMemo(() => getCurrentAddress(), []);
    const target = React.useMemo(() => Address.parseFriendly(params.order.target), []);
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

            // Confirm domain-resolved wallet address
            if (order.domain) {
                try {
                    const resolvedDomainAddress = await resolveDomain(engine.client4, tonDnsRootAddress, order.domain, DNS_CATEGORY_NEXT_RESOLVER, true);

                    if (!resolvedDomainAddress || !Address.isAddress(resolvedDomainAddress)) {
                        throw Error('Error resolving domain address');
                    }

                    const resolvedDomainWallet = await resolveDomain(engine.client4, resolvedDomainAddress, '.', DNS_CATEGORY_WALLET);

                    if (
                        !resolvedDomainWallet
                        || !Address.isAddress(resolvedDomainWallet)
                        || !resolvedDomainWallet.equals(target.address)
                    ) {
                        throw Error('Error resolving wallet address');
                    }
                } catch (e) {
                    Alert.alert(t('transfer.error.invalidDomain'), undefined, [{
                        text: t('common.close'),
                        onPress: () => navigation.goBack()
                    }]);
                    return;
                }
            }

            // Get contract
            const contract = contractFromPublicKey(from.publicKey);

            // Create transfer
            let intMessage = new InternalMessage({
                to: target.address,
                value: order.amount,
                bounce: false,
                body: new CommonMessageInfo({
                    stateInit: order.stateInit ? new CellMessage(order.stateInit) : null,
                    body: order.payload ? new CellMessage(order.payload) : new CommentMessage(text || '')
                })
            });
            let transfer = await contract.createTransfer({
                seqno: account.seqno,
                walletId: contract.source.walletId,
                secretKey: null,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                order: intMessage
            });

            // Fetch data
            const [
                config,
                [metadata, state]
            ] = await Promise.all([
                backoff('transfer', () => fetchConfig()),
                backoff('transfer', async () => {
                    let block = await backoff('transfer', () => engine.client4.getLastBlock());
                    return Promise.all([
                        backoff('transfer', () => fetchMetadata(engine.client4, block.last.seqno, target.address)),
                        backoff('transfer', () => engine.client4.getAccount(block.last.seqno, target.address))
                    ])
                }),
            ])
            if (exited) {
                return;
            }

            // Check if wallet is restricted
            let restricted = false;
            for (let r of config.wallets.restrict_send) {
                if (Address.parse(r).equals(target.address)) {
                    restricted = true;
                    break;
                }
            }

            // Read jetton master
            let jettonMaster: JettonMasterState | null = null;
            if (metadata.jettonWallet) {
                jettonMaster = engine.persistence.jettonMasters.item(metadata.jettonWallet!.master).value;
            }

            // Estimate fee
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
            let fees = estimateFees(netConfig!, inMsg, outMsg, state!.account.storageStat);

            // Set state
            setLoadedProps({
                restricted,
                target: {
                    isTestOnly: target.isTestOnly,
                    address: target.address,
                    balance: new BN(state.account.balance.coins, 10),
                    active: state.account.state.type === 'active',
                    domain: order.domain
                },
                order,
                text,
                job,
                fees,
                metadata,
                jettonMaster,
                callback: callback ? callback : null,
                back: params.back
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
                {!loadedProps && (<View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}><LoadingIndicator simple={true} /></View>)}
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