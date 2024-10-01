import { Address, beginCell, Cell } from "@ton/core";
import { GaslessMessage } from "../../engine/api/gasless/fetchGaslessEstimate";
import { OperationType } from "../../engine/transactions/parseMessageBody";
import { queryClient } from "../../engine/clients";
import { Queries } from "../../engine/queries";
import { getQueryData } from "../../engine/utils/getQueryData";
import { StoredJettonWallet } from "../../engine/metadata/StoredMetadata";

export function updateTargetAmount(args: {
    messages: GaslessMessage[],
    relayerAddress: Address, targetAddress: Address, walletAddress: Address,
    adjustEstimateAmount: bigint,
    isTestnet: boolean
}): GaslessMessage[] {
    const { messages, relayerAddress, targetAddress, walletAddress, isTestnet, adjustEstimateAmount } = args;

    let relayerMessage, targetMessage: { index: number, amount: bigint, payload: Cell } | null = null;

    for (let i = 0; i < messages.length; i++) {
        const isWallet = Address.parse(messages[i].address).equals(walletAddress);

        if (!isWallet) {
            continue;
        }

        const payloadStr = messages[i].payload;
        const payloadCell = payloadStr ? Cell.fromBoc(Buffer.from(payloadStr, 'hex'))[0] : null;

        if (!payloadCell) {
            continue;
        }

        const slice = payloadCell.beginParse();

        if (slice.remainingBits < 32) {
            continue;
        }

        const op = slice.loadUint(32);

        if (op === 0 || op !== OperationType.JettonTransfer) {
            continue;
        }

        slice.loadUintBig(64);
        let amount = slice.loadCoins();
        let destination = slice.loadAddress();

        if (destination.equals(relayerAddress)) {
            relayerMessage = { index: i, amount, payload: payloadCell };
            continue;
        }

        if (destination.equals(targetAddress)) {
            targetMessage = { index: i, amount, payload: payloadCell };
            continue;
        }
    }

    if (!relayerMessage || !targetMessage) {
        return messages;
    }

    const relayerAmount = relayerMessage.amount;
    const targetAmount = targetMessage.amount;

    const queryCache = queryClient.getQueryCache();
    const jettonWalletKey = Queries.Account(walletAddress.toString({ testOnly: isTestnet })).JettonWallet();
    const walletBalance = getQueryData<StoredJettonWallet | null>(queryCache, jettonWalletKey)?.balance;

    if (!walletBalance) {
        return messages;
    }

    const diff = BigInt(walletBalance) - relayerAmount - targetAmount;
    const diffAmount = diff >= 0 ? 0n : diff;
    const newTargetAmount = targetAmount + diffAmount;

    if (newTargetAmount < 0n) {
        return messages;
    }

    const newTargetBuilder = beginCell();
    const prevPayload = targetMessage.payload.beginParse();
    const op = prevPayload.loadUint(32);
    const queryId = prevPayload.loadUint(64);
    prevPayload.loadCoins();
    const destination = prevPayload.loadMaybeAddress();
    const responseDestination = prevPayload.loadMaybeAddress();
    const customPayload = prevPayload.loadMaybeRef();
    const forwardTonAmount = prevPayload.loadCoins();
    const forwardPayload = prevPayload.remainingBits > 0 ? prevPayload.loadMaybeRef() ?? prevPayload.asCell() : null;

    newTargetBuilder
        .storeUint(op, 32)
        .storeUint(queryId, 64)
        .storeCoins(newTargetAmount)
        .storeAddress(destination)
        .storeAddress(responseDestination)
        .storeMaybeRef(customPayload)
        .storeCoins(forwardTonAmount)
        .storeMaybeRef(forwardPayload);

    const newTargetMessage = { ...messages[targetMessage.index], payload: newTargetBuilder.endCell().toBoc({ idx: false }).toString('hex') };

    return messages.map((m, i) => i === targetMessage?.index ? newTargetMessage : m);
}