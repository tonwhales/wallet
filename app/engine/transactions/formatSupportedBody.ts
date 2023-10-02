import BN from "bn.js";
import { Cell, fromNano, SupportedMessage, toNano } from "@ton/core";
import { LocalizedResources } from "../../i18n/schema";

export function formatSupportedBody(supportedMessage: SupportedMessage): { res: LocalizedResources, options?: any } | null {
    if (supportedMessage.type === 'deposit') {
        return { res: 'known.deposit' };
    }
    if (supportedMessage.type === 'deposit::ok') {
        return { res: 'known.depositOk' };
    }
    if (supportedMessage.type === 'withdraw') {
        let coins = supportedMessage.data['stake'] as BN;
        if (coins.eq(toNano(0))) {
            return { res: 'known.withdrawAll' };
        } else {
            return { res: 'known.withdraw', options: { coins: fromNano(coins) } };
        }
    }
    if (supportedMessage.type === 'withdraw::ok') {
        return { res: 'known.withdrawAll' };
    }
    if (supportedMessage.type === 'upgrade') {
        let code = supportedMessage.data['code'] as Cell;
        return { res: 'known.upgrade', options: { hash: code.hash().toString('base64') } };
    }
    if (supportedMessage.type === 'upgrade::ok') {
        return { res: 'known.upgradeOk' };
    }
    if (supportedMessage.type === 'jetton::excesses') {
        return { res: 'known.cashback' };
    }
    if (supportedMessage.type === 'jetton::transfer') {
        return { res: 'known.tokenSent' };
    }
    if (supportedMessage.type === 'jetton::transfer_notification') {
        return { res: 'known.tokenReceived' };
    }
    return null;
}