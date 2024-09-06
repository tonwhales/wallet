import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { parseBody } from "../../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../../engine/transactions/resolveOperation";
import { t } from "../../../i18n/t";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { backoff, backoffFailaible } from "../../../utils/time";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { TransferSingleView } from "./TransferSingleView";
import { confirmAlert } from "../../../utils/confirmAlert";
import { beginCell, storeMessage, external, Address, Cell, loadStateInit, comment, internal, SendMode } from "@ton/core";
import { useAccountLite, useClient4, useCommitCommand, useContact, useDenyAddress, useIsSpamWallet, useJetton, useNetwork, useRegisterPending, useSelectedAccount } from "../../../engine/hooks";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../utils/withDecimals";
import { fetchSeqno } from "../../../engine/api/fetchSeqno";
import { getLastBlock } from "../../../engine/accountWatcher";
import { useWalletSettings } from "../../../engine/hooks/appstate/useWalletSettings";
import { ConfirmLoadedPropsSingle } from "../TransferFragment";
import { PendingTransactionBody } from "../../../engine/state/pending";
import Minimizer from "../../../modules/Minimizer";
import { clearLastReturnStrategy } from "../../../engine/tonconnect/utils";
import { useWalletVersion } from "../../../engine/hooks/useWalletVersion";
import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { fetchGaslessSend } from "../../../engine/api/gasless/fetchGaslessSend";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";

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
    const [failed, setFailed] = useState(false);
    const toaster = useToaster();

    let { restricted, target, jettonTarget, text, order, job, fees, metadata, callback } = props;

    const jetton = useJetton({ owner: selected!.address, master: metadata?.jettonWallet?.master, wallet: metadata?.jettonWallet?.address }, true);

    // Resolve operation
    let body = order.messages[0].payload ? parseBody(order.messages[0].payload) : null;
    let operation = resolveOperation({
        body,
        amount: order.messages[0].amount,
        account: Address.parse(order.messages[0].target)
    }, isTestnet);

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
        } catch {
            console.warn('Failed to parse jetton amount');
        }

        return undefined;
    }, [order, jetton]);

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

    // Tracking
    const success = useRef(false);
    useEffect(() => {
        return () => {
            if (!success.current) {
                trackEvent(
                    MixpanelEvent.TransferCancel,
                    {
                        target: order.messages[0].target,
                        amount: order.messages[0].amount.toString(10)
                    },
                    isTestnet
                );
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
    const walletVersion = useWalletVersion();

    const closedRef = useRef(false);
    const goBack = useCallback(() => {
        if (!closedRef.current) {
            closedRef.current = true;
            navigation.goBack();
        }
    }, []);

    const onGaslessFailed = useCallback((cooldown?: boolean) => {
        setFailed(true);
        toaster.show({
            message: cooldown
                ? t('transfer.error.gaslessCooldown')
                : t('transfer.error.gaslessFailed'),
            duration: ToastDuration.LONG,
            type: 'error',
            onDestroy: goBack
        });
    }, []);

    // Confirmation
    const doSend = useCallback(async () => {
        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey, walletVersion);
        const isV5 = walletVersion === 'v5R1';

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

        const isGasless = fees.type === 'gasless';

        // Check amount
        if (!order.messages[0].amountAll && account!.balance < order.messages[0].amount && !isGasless) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        } else if (isGasless && (jetton?.balance || 0n) < fees.value) {
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

        let lastBlock = await getLastBlock();
        let seqno = await backoff('transfer-seqno', async () => fetchSeqno(client, lastBlock, selected!.address));


        // External message
        let msg: Cell;

        //
        // Gasless transfer
        //
        if (isGasless) {
            const tetherTransferForSend = (contract as WalletContractV5R1).createTransfer({
                seqno,
                authType: 'internal',
                timeout: Math.ceil(Date.now() / 1000) + 5 * 60,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                messages: fees.params.messages.map(message =>
                    internal({
                        to: message.address,
                        value: BigInt(message.amount),
                        body: message.payload ? Cell.fromBoc(Buffer.from(message.payload, 'hex'))[0] : null
                    })
                )
            });

            msg = beginCell()
                .storeWritable(
                    storeMessage(
                        external({
                            to: contract.address,
                            init: seqno === 0 ? contract.init : undefined,
                            body: tetherTransferForSend
                        })
                    )
                )
                .endCell();

            try {
                const gaslessTransferRes = await backoffFailaible('gasless', () => fetchGaslessSend({
                    wallet_public_key: walletKeys.keyPair.publicKey.toString('hex'),
                    boc: msg.toBoc({ idx: false }).toString('hex')
                }, isTestnet));

                if (!gaslessTransferRes.ok) {
                    onGaslessFailed(gaslessTransferRes.error === 'cooldown');
                    return;
                }
            } catch (error) {
                onGaslessFailed();
                return;
            }


        } else {
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
                    body
                });

                const transferParams = {
                    seqno: seqno,
                    secretKey: walletKeys.keyPair.secretKey,
                    sendMode: order.messages[0].amountAll
                        ? SendMode.CARRY_ALL_REMAINING_BALANCE
                        : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                    messages: [intMessage],
                }

                transfer = isV5
                    ? (contract as WalletContractV5R1).createTransfer(transferParams)
                    : (contract as WalletContractV4).createTransfer(transferParams);

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

            msg = beginCell().store(storeMessage(extMessage)).endCell();

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
        }

        // Track
        success.current = true;
        trackEvent(MixpanelEvent.Transfer, { target: order.messages[0].target, amount: order.messages[0].amount.toString(10) }, isTestnet);

        let amount = order.messages[0].amount * (BigInt(-1));
        if (order.messages[0].amountAll) {
            amount = BigInt(-1) * account!.balance;
        }

        let body: PendingTransactionBody | null = order.messages[0].payload
            ? { type: 'payload', cell: order.messages[0].payload, stateInit: order.messages[0].stateInit }
            : (text && text.length > 0
                ? { type: 'comment', comment: text }
                : null
            );

        if (jettonTarget && jetton && jettonAmountString) {
            body = {
                type: 'token',
                jetton: jetton,
                target: jettonTarget.address,
                bounceable: jettonTarget.bounceable,
                amount: toBnWithDecimals(jettonAmountString, jetton.decimals ?? 9),
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
            blockSeqno: lastBlock,
            body: body,
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
        if (props.back && props.back > 0) {
            for (let i = 0; i < props.back; i++) {
                navigation.goBack();
            }
        } else {
            navigation.popToTop();
        }
    }, [registerPending, jettonAmountString, jetton, fees]);

    return (
        <TransferSingleView
            operation={operation}
            order={order}
            amount={amount}
            jettonAmountString={jettonAmountString}
            target={target}
            fees={fees}
            metadata={metadata}
            jetton={jetton}
            doSend={doSend}
            walletSettings={walletSettings}
            text={text}
            known={known}
            isSpam={spam}
            isWithStateInit={!!order.messages[0].stateInit}
            contact={contact}
            failed={failed}
        />
    );
});