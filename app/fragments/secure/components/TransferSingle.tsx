import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Alert, View, Text, Pressable, ScrollView, Platform, Image } from "react-native";
import { Address, Cell, comment, fromNano, internal, loadStateInit, SendMode, external, storeMessage, beginCell } from "@ton/core";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { ContractMetadata } from "../../../engine/metadata/Metadata";
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
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { PriceComponent } from "../../../components/PriceComponent";
import { WImage } from "../../../components/WImage";
import { AddressComponent } from "../../../components/address/AddressComponent";
import { Avatar } from "../../../components/Avatar";
import { ItemDivider } from "../../../components/ItemDivider";
import { ItemLarge } from "../../../components/ItemLarge";
import { ItemCollapsible } from "../../../components/ItemCollapsible";
import { RoundButton } from "../../../components/RoundButton";
import { ItemGroup } from "../../../components/ItemGroup";
import { ItemAddress } from "../../../components/ItemAddress";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useTheme } from '../../../engine/hooks';
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { useDenyAddress } from '../../../engine/hooks';
import { useIsSpamWallet } from '../../../engine/hooks';
import { useAccountLite } from '../../../engine/hooks';
import { useClient4 } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { useSelectedAccount } from '../../../engine/hooks';
import { fetchSeqno } from '../../../engine/api/fetchSeqno';
import { getLastBlock } from '../../../engine/accountWatcher';
import { JettonMasterState } from '../../../engine/metadata/fetchJettonMasterContent';
import { useCommitCommand } from "../../../engine/hooks/dapps/useCommitCommand";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
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
import { holdersUrl } from "../../../engine/api/holders/fetchAccountState";
import { parseMessageBody } from '../../../engine/transactions/parseMessageBody';
import { resolveOperation } from '../../../engine/transactions/resolveOperation';
import { useContact } from '../../../engine/hooks';
import { useRegisterPending } from "../../../engine/hooks/transactions/useRegisterPending";

type Props = {
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: bigint,
        active: boolean,
        domain?: string
    },
    text: string | null,
    order: Order,
    job: string | null,
    fees: bigint,
    metadata: ContractMetadata,
    restricted: boolean,
    jettonMaster: JettonMasterState | null
    callback: ((ok: boolean, result: Cell | null) => void) | null
    back?: number
}

export const TransferSingle = memo((props: Props) => {
    const authContext = useKeysAuth();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected!.address);
    const commitCommand = useCommitCommand();
    const registerPending = useRegisterPending();

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
    let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell) : null;
    let operation = resolveOperation({ body: body, amount: order.messages[0].amount, account: Address.parse(order.messages[0].target) }, isTestnet);
    const jettonAmount = useMemo(() => {
        try {
            if (jettonMaster && order.messages[0].payload) {
                const temp = order.messages[0].payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.skip(32);
                    parsing.skip(64);
                    const unformatted = parsing.loadCoins();
                    return fromBnWithDecimals(unformatted, jettonMaster.decimals);
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
            trackEvent(MixpanelEvent.TransferCancel, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, isTestnet);
        }
    }, []);

    const friendlyTarget = target.address.toString({ testOnly: isTestnet });
    // Contact wallets
    const contact = useContact(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(isTestnet)[friendlyTarget]) {
        known = KnownWallets(isTestnet)[friendlyTarget];
    } else if (operation.op) {
        known = { name: t(operation.op.res, operation.op.options) };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = useDenyAddress(operation.address);
    let spam = useIsSpamWallet(friendlyTarget) || isSpam


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
        if (!order.messages[0].amountAll && account!.balance < order.messages[0].amount) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (!order.messages[0].amountAll && order.messages[0].amount === BigInt(0)) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }

        // Check if trying to send to testnet
        if (!isTestnet && target.isTestOnly) {
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

        let seqno = await backoff('transfer-seqno', async () => fetchSeqno(client, await getLastBlock(), selected!.address));

        // Create transfer
        let transfer: Cell;
        try {
            const internalStateInit = !!order.messages[0].stateInit
                ? loadStateInit(order.messages[0].stateInit.asSlice())
                : null;

            const body = !!order.messages[0].payload
                ? order.messages[0].payload
                : text ? comment(text) : null;

            let intMessage = internal({
                to: target.address,
                value: order.messages[0].amount,
                init: internalStateInit,
                bounce,
                body,
            });

            transfer = contract.createTransfer({
                seqno: seqno,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: order.messages[0].amountAll
                    ? SendMode.CARRY_ALL_REMAINING_BALANCE
                    : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages: [intMessage],
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
            } catch (e) {
                warn(e);
                // Ignore on error
            }
        }

        // Track
        success.current = true;
        trackEvent(MixpanelEvent.Transfer, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, isTestnet);

        // Register pending
        registerPending({
            id: 'pending-' + seqno,
            fees: fees,
            amount: order.messages[0].amount * (BigInt(-1)),
            address: target.address,
            seqno: seqno,
            body: order.messages[0].payload ? { type: 'payload', cell: order.messages[0].payload } : (text && text.length > 0 ? { type: 'comment', comment: text } : null),
            time: Math.floor(Date.now() / 1000),
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

    const anim = useRef<LottieView>(null);

    useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play()
        }, 300);
    }, []);

    const inactiveAlert = useCallback(() => {
        Alert.alert(t('transfer.error.addressIsNotActive'),
            t('transfer.error.addressIsNotActiveDescription'),
            [{ text: t('common.gotIt') }])
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
                            color: theme.textSecondary
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
                            backgroundColor: theme.surfaceSecondary,
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
                                            color: theme.textPrimary,
                                            marginLeft: 2,
                                        }}>
                                            {`${fromNano(order.messages[0].amountAll ? account!.balance : order.messages[0].amount)} TON`}
                                        </Text>
                                        <PriceComponent
                                            prefix={'~'}
                                            amount={order.messages[0].amountAll ? account!.balance : order.messages[0].amount}
                                            style={{
                                                backgroundColor: theme.transparent,
                                                paddingHorizontal: 0,
                                                marginLeft: 2
                                            }}
                                            textStyle={{ color: theme.textPrimary, fontWeight: '400', fontSize: 14 }}
                                        />
                                        {!!operation.comment && operation.comment.length > 0 && (
                                            <View style={{
                                                backgroundColor: theme.background,
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
                                            backgroundColor: theme.accent,
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
                                        backgroundColor: theme.divider
                                    }} />
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 40,
                                        justifyContent: 'center'
                                    }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: theme.textPrimary,
                                            marginLeft: 2
                                        }}>
                                            {`${jettonAmount} ${jettonMaster.symbol}`}
                                        </Text>
                                        {!!operation.comment && operation.comment.length > 0 && (
                                            <View style={{
                                                backgroundColor: theme.background,
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
                                            backgroundColor: theme.accent,
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
                                        {!isTestnet && (
                                            <PriceComponent
                                                prefix={`${t('transfer.gasFee')} ${fromNano(order.messages[0].amount)} TON (`}
                                                suffix={')'}
                                                amount={order.messages[0].amountAll ? account!.balance : order.messages[0].amount}
                                                style={{
                                                    backgroundColor: theme.transparent,
                                                    paddingHorizontal: 0,
                                                    marginLeft: 2
                                                }}
                                                textStyle={{
                                                    color: theme.textSecondary,
                                                    fontWeight: '400', fontSize: 14
                                                }}
                                            />
                                        )}
                                        {isTestnet && (
                                            <Text style={{
                                                color: theme.textSecondary,
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {`${t('transfer.gasFee')} ${fromNano(order.messages[0].amount)} TON`}
                                            </Text>
                                        )}
                                        <View style={{
                                            backgroundColor: theme.surfaceSecondary,
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
                                            color: theme.textPrimary,
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
                                        color: theme.textSecondary,
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
                                                        borderColor: theme.warning,
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
                                                    color: theme.warning
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
                                                backgroundColor: theme.warning,
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
                                                borderColor: theme.accentBlue,
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
                                        color: theme.textPrimary,
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
                                                        borderColor: theme.warning,
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
                                                    color: theme.warning
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
                                    backgroundColor: theme.divider
                                }} />
                                <View style={{
                                    marginLeft: 40 + 6,
                                    justifyContent: 'center'
                                }}>
                                    {!!operation.op && (
                                        <View style={{ marginLeft: 2, marginVertical: 30, minHeight: 24, justifyContent: 'center' }}>
                                            <Text style={{
                                                color: theme.textSecondary,
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {t('transfer.smartContract')}
                                            </Text>
                                            <View style={{
                                                backgroundColor: theme.surfaceSecondary,
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
                                                color: theme.textSecondary,
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {t('transfer.smartContract')}
                                            </Text>
                                            <View style={{
                                                backgroundColor: theme.surfaceSecondary,
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
                                                color: theme.textPrimary,
                                            }}>
                                                {t(operation.op.res, operation.op.options)}
                                            </Text>
                                        </View>
                                    )}
                                    {!operation.comment && !operation.op && !!text && (
                                        <View style={{ marginLeft: 2, minHeight: 40, justifyContent: 'center' }}>
                                            <Text style={{
                                                flexShrink: 1,
                                                fontWeight: '500',
                                                fontSize: 14,
                                                color: theme.textPrimary,
                                                opacity: 0.4
                                            }}>
                                                {text}
                                            </Text>
                                        </View>
                                    )}
                                    {order?.app?.domain !== extractDomain(holdersUrl) && (
                                        <View style={{
                                            backgroundColor: theme.accentGreen,
                                            height: 40, width: 40,
                                            borderRadius: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                        }}>
                                            {(parsedBody?.type === 'whales-staking::deposit' || parsedBody?.type === 'withdraw') && (
                                                <Staking />
                                            )}
                                            {!(parsedBody?.type === 'whales-staking::deposit' || parsedBody?.type === 'withdraw') && (
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
                                text={operation.address}
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
                                    <ItemLarge title={t('transfer.purpose')} text={t(operation.op.res, operation.op.options)} />
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