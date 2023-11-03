import { TonPayloadFormat } from '@ton-community/ton-ledger';
import { Cell, beginCell, comment } from "@ton/core";

export function resolveLedgerPayload(ledgerPayload: TonPayloadFormat) {
    let payload: Cell | null = null;
    if (ledgerPayload.type === 'comment') {
        payload = comment(ledgerPayload.text);
    } else if (ledgerPayload.type === 'jetton-transfer') {
        // todo: implement jetton transfer
    } else if (ledgerPayload.type === 'nft-transfer') {
        // todo: implement nft transfer
    } else {
        throw new Error('Unsupported ledger payload');
    }

    return payload;
}