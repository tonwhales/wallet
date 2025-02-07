import { TonPayloadFormat } from '@ton-community/ton-ledger';
import { Cell, beginCell, comment } from "@ton/core";
import { OperationType } from '../../../engine/transactions/parseMessageBody';

export function resolveLedgerPayload(ledgerPayload: TonPayloadFormat) {
    let payload: Cell | null = null;

    switch (ledgerPayload.type) {
        case 'comment':
            payload = comment(ledgerPayload.text);
            break;
        case 'jetton-transfer':
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
            break;
        case 'unsafe':
            payload = ledgerPayload.message;
            break;
        default:
            throw new Error('Unsupported ledger payload');
    }

    return payload;
}