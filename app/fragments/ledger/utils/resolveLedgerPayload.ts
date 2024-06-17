import { TonPayloadFormat } from '@ton-community/ton-ledger';
import { Cell, beginCell, comment } from "@ton/core";
import { OperationType } from '../../../engine/transactions/parseMessageBody';

export function resolveLedgerPayload(ledgerPayload: TonPayloadFormat) {
    let payload: Cell | null = null;
    if (ledgerPayload.type === 'comment') {
        payload = comment(ledgerPayload.text);
    } else if (ledgerPayload.type === 'jetton-transfer') {
        payload = beginCell()
            .storeUint(OperationType.JettonTransfer, 32)
            .storeUint(ledgerPayload.queryId ?? 0, 64)
            .storeCoins(ledgerPayload.amount)
            .storeAddress(ledgerPayload.destination)
            .storeAddress(ledgerPayload.responseDestination)
            .storeMaybeRef(ledgerPayload.customPayload)
            .storeCoins(ledgerPayload.forwardAmount)
            .storeMaybeRef(ledgerPayload.forwardPayload)
            .endCell();
        // todo: implement jetton transfer
    } else if (ledgerPayload.type === 'nft-transfer') {
        // todo: implement nft transfer
    } else {
        throw new Error('Unsupported ledger payload');
    }

    return payload;
}