import { fromNano } from "@ton/core";
import { LocalizedResources } from "../../i18n/schema";
import { SupportedMessage } from "./parseMessageBody";

export function formatSupportedBody(supportedMessage: SupportedMessage): { res: LocalizedResources, options?: any } | null {
    if (supportedMessage.type === 'whales-staking::deposit') {
        return { res: 'known.deposit' };
    }
    if (supportedMessage.type === 'deposit::ok') {
        return { res: 'known.depositOk' };
    }
    if (supportedMessage.type === 'withdraw') {
        let coins = supportedMessage.data['stake'] as bigint;
        if (coins === BigInt(0)) {
            return { res: 'known.withdrawAll' };
        } else {
            return { res: 'known.withdraw', options: { coins: fromNano(coins) } };
        }
    }
    if (supportedMessage.type === 'withdraw::ok') {
        return { res: 'known.withdrawAll' };
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