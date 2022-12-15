import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Alert } from "react-native";
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
import { KnownWallets } from '../../secure/KnownWallets';
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

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

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

    // Resolve operation
    let body = order.payload ? parseBody(order.payload) : null;
    let operation = resolveOperation({ body: body, amount: order.amount, account: Address.parse(order.target), metadata, jettonMaster });

    // Tracking
    const success = React.useRef(false);
    React.useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { target: order.target, amount: order.amount.toString(10) });
        }
    }, []);

    // Verified wallets
    const known = KnownWallets[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];
    // Contact wallets
    const contact = engine.products.settings.useContactAddress(operation.address);

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
        if (!target.active) {
            bounce = false;
            if (target.balance.lte(new BN(0))) {
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
            prev: null
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

    return (
        <>
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

                    <View
                        style={{
                            marginBottom: 14,
                            backgroundColor: "white",
                            borderRadius: 14,
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 19,
                            height: 95
                        }}
                    >
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
                            {fromNano(order.amountAll ? account.balance : order.amount)}
                        </Text>
                    </View>
                    <ItemGroup>
                        <ItemLarge
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
                        {!!operation.comment && (
                            <>
                                <ItemDivider />
                                <ItemLarge title={t('transfer.comment')} text={operation.comment} />
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
                        <ItemDivider />
                        <ItemLarge title={t('transfer.feeTitle')} text={fromNano(fees) + ' TON'} />
                    </ItemGroup>
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
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('transfer.confirmTitle')}</Text>
                </View>
            )}
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