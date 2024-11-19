import { Address, beginCell, Cell } from "@ton/core";
import { GaslessMessage } from "../../engine/api/gasless/fetchGaslessEstimate";
import { OperationType } from "../../engine/transactions/parseMessageBody";
import { queryClient } from "../../engine/clients";
import { Queries } from "../../engine/queries";
import { getQueryData } from "../../engine/utils/getQueryData";
import { HintsFull } from "../../engine/hooks/jettons/useHintsFull";

export function updateTargetAmount(args: {
    amount: bigint,
    messages: GaslessMessage[],
    relayerAddress: Address, targetAddress: Address,
    walletAddress: Address,
    owner: Address,
    adjustEstimateAmount: bigint,
    isTestnet: boolean
}): GaslessMessage[] {
    const { messages, relayerAddress, targetAddress, isTestnet, walletAddress, owner, amount } = args;

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

    //
    // Get wallet balance
    //

    const queryCache = queryClient.getQueryCache();
    const ownerStr = owner.toString({ testOnly: isTestnet });
    const hintsKey = Queries.HintsFull(ownerStr || '');
    const hintsFull = getQueryData<HintsFull | null>(queryCache, hintsKey);
    const walletHintIndex = hintsFull?.addressesIndex?.[walletAddress.toString({ testOnly: isTestnet })] ?? null;
    const walletHint = walletHintIndex !== null ? hintsFull?.hints[walletHintIndex] : null;
    const walletBalance = walletHint?.balance ?? null;

    if (!walletBalance) {
        return messages;
    }

    //
    // Calculate new target amount
    //

    // If the difference between the new amount (from estimate) and the old amount is equal to the adjust amount (min decimal),
    // then we need to add the adjust amount to preserve the original target amount user entered
    const addAdjustAmount = amount - targetAmount === args.adjustEstimateAmount; 
    const adjustEstimateAmount = addAdjustAmount ? args.adjustEstimateAmount : 0n;

    // Calculate the difference between the wallet balance and the sum of the relayer and target amounts
    // if the difference is greater than or equal to zero, then we don't need to adjust the target amount
    // (e.g. the wallet has enough balance to cover the relayer and target amounts), otherwise we need to adjust the target amount to send the remaining balance
    const diff = BigInt(walletBalance) - (relayerAmount + targetAmount);
    const diffAmount = diff >= 0n ? 0n : (diff - adjustEstimateAmount);

    // Calculate the new target amount
    const newTargetAmount = targetAmount + diffAmount + adjustEstimateAmount;

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