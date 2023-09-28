import BN from "bn.js";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, InternalMessage, SendMode, StateInit } from "ton";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { useEngine } from "../../../engine/Engine";
import { ContractMetadata } from "../../../engine/metadata/Metadata";
import { useItem } from "../../../engine/persistence/PersistedItem";
import { JettonMasterState } from "../../../engine/sync/startJettonMasterSync";
import { parseMessageBody } from "../../../engine/transactions/parseMessageBody";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../../engine/transactions/resolveOperation";
import { Order } from "../../../fragments/secure/ops/Order";
import { t } from "../../../i18n/t";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { backoff } from "../../../utils/time";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { fromBNWithDecimals } from "../../../utils/withDecimals";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { TransferSingleView } from "./TransferSingleView";
import { confirmAlert } from "../../../utils/confirmAlert";

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
    const { AppConfig } = useAppConfig();
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

    const jettonAmountString = useMemo(() => {
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
            let cont = await confirmAlert('transfer.error.addressIsForTestnet');
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

    return (
        <TransferSingleView
            operation={operation}
            order={order}
            amount={amount}
            tonTransferAmount={order.messages[0].amountAll ? account.balance : order.messages[0].amount}
            jettonAmountString={jettonAmountString}
            target={target}
            fees={fees}
            jettonMaster={null}
            doSend={doSend}
            walletSettings={walletSettings}
            text={text}
            known={known}
            isSpam={spam}
            isWithStateInit={!!order.messages[0].stateInit}
        />
    );
});