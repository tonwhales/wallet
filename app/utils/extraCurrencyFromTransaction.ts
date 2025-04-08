import { ExtraCurrency } from "@ton/core";
import { TonTransaction } from "../engine/types";

export function extraCurrencyFromTransaction(tx: TonTransaction) {
    const kind = tx.base.parsed.kind;
    if (kind === 'in') {
        const inMessage = tx.base.inMessage;
        if (inMessage && inMessage.info.type === 'internal') {
            return Object.fromEntries(Object.entries(inMessage.info.extraCurrency ?? {}).map(([key, value]) => [Number(key), BigInt(value)]));
        }
    } else if (kind === 'out') {
        const outMessages = tx.base.outMessages;
        if (outMessages) {
            const extraCurrency: ExtraCurrency = {};
            outMessages.forEach((m) => {
                if (m.info.type === 'internal') {
                    Object.entries(m.info.extraCurrency ?? {}).forEach(([key, value]) => {
                        extraCurrency[Number(key)] = BigInt(value);
                    });
                }
            });
            return extraCurrency;
        }
    }

    return null;
}