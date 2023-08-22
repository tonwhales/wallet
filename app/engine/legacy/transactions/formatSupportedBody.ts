import BN from "bn.js";
import { Cell, fromNano, SupportedMessage, toNano } from "ton";
import { t } from "../../../i18n/t";

export function formatSupportedBody(supportedMessage: SupportedMessage): { text: string } | null {
    if (supportedMessage.type === 'deposit') {
        return { text: t('known.deposit') };
    }
    if (supportedMessage.type === 'deposit::ok') {
        return { text: t('known.depositOk') };
    }
    if (supportedMessage.type === 'withdraw') {
        let coins = supportedMessage.data['stake'] as BN;
        if (coins.eq(toNano(0))) {
            return { text: t('known.withdrawAll') };
        } else {
            return { text: t('known.withdraw', { coins: fromNano(coins) }) };
        }
    }
    if (supportedMessage.type === 'withdraw::ok') {
        return { text: t('known.withdrawAll') };
    }
    if (supportedMessage.type === 'upgrade') {
        let code = supportedMessage.data['code'] as Cell;
        return { text: t('known.upgrade', { hash: code.hash().toString('base64') }) };
    }
    if (supportedMessage.type === 'upgrade::ok') {
        return { text: t('known.upgradeOk') };
    }
    if (supportedMessage.type === 'jetton::excesses') {
        return { text: t('known.cashback') };
    }
    if (supportedMessage.type === 'jetton::transfer') {
        return { text: t('known.tokenSent') };
    }
    if (supportedMessage.type === 'jetton::transfer_notification') {
        return { text: t('known.tokenReceived') };
    }
    return null;
}