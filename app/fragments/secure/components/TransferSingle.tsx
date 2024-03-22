import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../../engine/transactions/resolveOperation";
import { t } from "../../../i18n/t";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { backoff } from "../../../utils/time";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { TransferSingleView } from "./TransferSingleView";
import { confirmAlert } from "../../../utils/confirmAlert";
import { beginCell, storeMessage, external, Address, Cell, loadStateInit, comment, internal, SendMode } from "@ton/core";
import { useAccountLite, useClient4, useCommitCommand, useContact, useDenyAddress, useIsSpamWallet, useNetwork, useRegisterPending, useSelectedAccount } from "../../../engine/hooks";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../utils/withDecimals";
import { fetchSeqno } from "../../../engine/api/fetchSeqno";
import { getLastBlock } from "../../../engine/accountWatcher";
import { useWalletSettings } from "../../../engine/hooks/appstate/useWalletSettings";
import { ConfirmLoadedPropsSingle } from "../TransferFragment";
import { PendingTransactionBody } from "../../../engine/state/pending";

export const TransferSingle = memo((props: ConfirmLoadedPropsSingle) => {
    const authContext = useKeysAuth();
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected!.address);
    const commitCommand = useCommitCommand();
    const registerPending = useRegisterPending();
    const [walletSettings,] = useWalletSettings(selected?.address);

    let {
        restricted,
        target,
        jettonTarget,
        text,
        order,
        job,
        fees,
        metadata,
        jetton,
        callback,
        back
    } = props;

    // Resolve operation
    let body = order.messages[0].payload ? parseBody(order.messages[0].payload) : null;
    let operation = resolveOperation({ body: body, amount: order.messages[0].amount, account: Address.parse(order.messages[0].target) }, isTestnet);

    const amount = useMemo(() => {
        if (order.messages[0].amountAll) {
            return account?.balance ?? 0n;
        }
        return order.messages[0].amount;
    }, [account, props.order]);

    const jettonAmountString = useMemo(() => {
        try {
            if (jetton && order.messages[0].payload) {
                const temp = order.messages[0].payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.skip(32);
                    parsing.skip(64);
                    const unformatted = parsing.loadCoins();
                    return fromBnWithDecimals(unformatted, jetton.decimals);
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
        return () => {
            if (!success.current) {
                trackEvent(MixpanelEvent.TransferCancel, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, isTestnet);
            }
        }
    }, []);

    if (jettonTarget) {
        target = jettonTarget;
    }

    const friendlyTarget = target.address.toString({ testOnly: isTestnet, bounceable: target.bounceable });
    // Contact wallets
    const contact = useContact(friendlyTarget);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(isTestnet)[friendlyTarget]) {
        known = KnownWallets(isTestnet)[friendlyTarget];
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = useDenyAddress(friendlyTarget);
    const spam = useIsSpamWallet(friendlyTarget) || isSpam

    // Confirmation
    const doSend = useCallback(async () => {
        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);

        // Check if transfering to yourself
        if (target.address.equals(contract.address)) {
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

        // Check amount
        if (!order.messages[0].amountAll && account!.balance < order.messages[0].amount) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (!order.messages[0].amountAll && order.messages[0].amount === BigInt(0)) {
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
        if (
            jettonTarget && jetton && jettonAmountString
            && toBnWithDecimals(jettonAmountString, jetton.decimals ?? 9) === 0n
        ) {
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
                to: order.messages[0].target,
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
            } catch {
                warn('Failed to execute callback');
            }
        }

        // Track
        success.current = true;
        trackEvent(MixpanelEvent.Transfer, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, isTestnet);

        let amount = order.messages[0].amount * (BigInt(-1));
        if (order.messages[0].amountAll) {
            amount = BigInt(-1) * account!.balance;
        }

        let body: PendingTransactionBody | null = order.messages[0].payload
            ? { type: 'payload', cell: order.messages[0].payload }
            : (text && text.length > 0
                ? { type: 'comment', comment: text }
                : null
            );

        if (jettonTarget && jetton && jettonAmountString) {
            body = {
                type: 'token',
                master: jetton,
                target: jettonTarget.address,
                bounceable: jettonTarget.bounceable,
                amount: toBnWithDecimals(jettonAmountString, jettonMaster.decimals ?? 9),
                comment: text,
            }
        }

        // Register pending
        registerPending({
            id: 'pending-' + seqno,
            status: 'pending',
            fees: fees,
            amount: amount,
            address: target.address,
            bounceable: target.bounceable,
            seqno: seqno,
            body: body,
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
    }, [registerPending]);

    return (
        <TransferSingleView
            operation={operation}
            order={order}
            amount={amount}
            jettonAmountString={jettonAmountString}
            target={target}
            fees={fees}
            jetton={jetton}
            doSend={doSend}
            walletSettings={walletSettings}
            text={text}
            known={known}
            isSpam={spam}
            isWithStateInit={!!order.messages[0].stateInit}
        />
    );
});