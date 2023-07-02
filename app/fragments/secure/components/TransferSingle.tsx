import BN from "bn.js";
import React from "react";
import { Alert, View, Text, Pressable, ScrollView, Platform, Image } from "react-native";
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
import LottieView from 'lottie-react-native';
import TonSign from '../../../../assets/ic_ton_sign.svg';
import TransferToArrow from '../../../../assets/ic_transfer_to.svg';
import Contact from '../../../../assets/ic_transfer_contact.svg';
import VerifiedIcon from '../../../../assets/ic_verified.svg';
import TonSignGas from '../../../../assets/ic_transfer_gas.svg';
import SignLock from '../../../../assets/ic_sign_lock.svg';
import WithStateInit from '../../../../assets/ic_sign_contract.svg';
import SmartContract from '../../../../assets/ic_sign_smart_contract.svg';
import Staking from '../../../../assets/ic_sign_staking.svg';
import Question from '../../../../assets/ic_question.svg';
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { PriceComponent } from "../../../components/PriceComponent";
import { WImage } from "../../../components/WImage";
import { AddressComponent } from "../../../components/AddressComponent";
import { Avatar } from "../../../components/Avatar";
import { ItemDivider } from "../../../components/ItemDivider";
import { ItemLarge } from "../../../components/ItemLarge";
import { ItemCollapsible } from "../../../components/ItemCollapsible";
import { RoundButton } from "../../../components/RoundButton";
import { ItemGroup } from "../../../components/ItemGroup";
import { ItemAddress } from "../../../components/ItemAddress";
import { fromBNWithDecimals } from "../../../utils/withDecimals";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { holdersUrl } from "../../../engine/holders/HoldersProduct";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";

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

export const TransferSingle = React.memo((props: Props) => {
    const authContext = useKeysAuth();
    const { Theme, AppConfig } = useAppConfig();
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

    // Resolve operation
    let body = order.messages[0].payload ? parseBody(order.messages[0].payload) : null;
    let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell, metadata.interfaces) : null;
    let operation = resolveOperation({ body: body, amount: order.messages[0].amount, account: Address.parse(order.messages[0].target), metadata, jettonMaster });
    const jettonAmount = React.useMemo(() => {
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
    const success = React.useRef(false);
    React.useEffect(() => {
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
            amount: order.messages[0].amount.mul(new BN(-1)),
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
                            color: Theme.labelSecondary
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
                            source={require('../../../../assets/animations/sign.json')}
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
                                            {`${fromNano(order.messages[0].amountAll ? account.balance : order.messages[0].amount)} TON`}
                                        </Text>
                                        <PriceComponent
                                            prefix={'~'}
                                            amount={order.messages[0].amountAll ? account.balance : order.messages[0].amount}
                                            style={{
                                                backgroundColor: Theme.transparent,
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
                                            {`${jettonAmount} ${jettonMaster.symbol}`}
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
                                                prefix={`${t('transfer.gasFee')} ${fromNano(order.messages[0].amount)} TON (`}
                                                suffix={')'}
                                                amount={order.messages[0].amountAll ? account.balance : order.messages[0].amount}
                                                style={{
                                                    backgroundColor: Theme.transparent,
                                                    paddingHorizontal: 0,
                                                    marginLeft: 2
                                                }}
                                                textStyle={{
                                                    color: Theme.labelSecondary,
                                                    fontWeight: '400', fontSize: 14
                                                }}
                                            />
                                        )}
                                        {AppConfig.isTestnet && (
                                            <Text style={{
                                                color: Theme.labelSecondary,
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {`${t('transfer.gasFee')} ${fromNano(order.messages[0].amount)} TON`}
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
                                        color: Theme.labelSecondary,
                                        marginLeft: 2,
                                        marginTop: 4
                                    }}>
                                        <AddressComponent address={operation.address} />
                                    </Text>
                                    {!target.active && !order.messages[0].stateInit && (
                                        <>
                                            <Pressable
                                                onPress={inactiveAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: Theme.warningSecondaryBorder,
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
                                                    color: Theme.warningSecondary
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
                                                backgroundColor: Theme.contactIcon,
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
                                                borderColor: Theme.contactBorder,
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
                                        <AddressComponent address={operation.address} />
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
                                    {!target.active && !order.messages[0].stateInit && (
                                        <>
                                            <Pressable
                                                onPress={inactiveAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: Theme.warningSecondaryBorder,
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
                                                    color: Theme.warningSecondary
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
                                    top: 2,
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
                                                color: Theme.labelSecondary,
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
                                                color: Theme.labelSecondary,
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
                                    {order?.app?.domain !== extractDomain(holdersUrl) && (
                                        <View style={{
                                            backgroundColor: Theme.operationIcon,
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
                                    )}
                                    {order?.app?.domain === extractDomain(holdersUrl) && (
                                        <View style={{
                                            height: 46, width: 34,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            position: 'absolute',
                                            left: -46, top: 0, bottom: 0,
                                            borderRadius: 6
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
                            {!operation.comment && !operation.op && order.messages[0].payload && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.unknown')} text={order.messages[0].payload.hash().toString('base64')} />
                                </>
                            )}
                            {!!jettonAmount && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.gasFee')} text={fromNano(order.messages[0].amount) + ' TON'} />
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