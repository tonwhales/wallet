import { Cell, CommentMessage } from "ton";
import { TonPayloadFormat } from "ton-ledger";

export function resolveLedgerPayload(ledgerPayload: TonPayloadFormat) {
    let payload: Cell | null = null;
    if (ledgerPayload.type === 'unsafe') {
        let c = new Cell();
        ledgerPayload.message.writeTo(c);
        payload = c;
    }
    if (ledgerPayload.type === 'comment') {
        let c = new Cell();
        new CommentMessage(ledgerPayload.text).writeTo(c);
        payload = c;
    }

    return payload;
}