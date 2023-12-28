import { CardNotification } from "../../engine/api/holders/fetchCardsTransactions";
import { t } from "../../i18n/t";

export const notificationTypeFormatter = (event: CardNotification) => {
    if (event.type === 'charge' || event.type === 'charge_failed') {
        const { merchantInfo } = event.data;
        return merchantInfo?.dirtyName || merchantInfo?.cleanName || t('products.holders.card.notifications.type.charge');
    } else if (event.type === 'limits_change') {
        if (event.data.pending) {
            return t('products.holders.card.notifications.type.limits_change.pending');
        }
        return t('products.holders.card.notifications.type.limits_change.completed');
    }
    if (event.type === 'crypto_account_withdraw') {
        return t('products.holders.card.notifications.type.card_withdraw');
    }
    return t(`products.holders.card.notifications.type.${event.type as
        | 'card_ready'
        | 'deposit'
        | 'charge'
        | 'charge_failed'
        | 'card_withdraw'
        | 'contract_closed'
        | 'card_block'
        | 'card_freeze'
        | 'card_unfreeze'
        | 'card_paid'
        }`);
};

export const notificationCategoryFormatter = (event: CardNotification) => {
    if (event.type === 'deposit') {
        return t('products.holders.card.notifications.category.deposit');
    }

    if (event.type === 'card_withdraw') {
        return t('products.holders.card.notifications.category.card_withdraw');
    }

    if (event.type === 'charge' || event.type === 'charge_failed') {
        return t('products.holders.card.notifications.category.charge');
    }

    return t('products.holders.card.notifications.category.other');
};

export const transactionStatusFormatter = (event: CardNotification) => {
    if (event.type === 'charge_failed') {
        const { reason } = event.data;

        if (reason.type === 'limit') {
            const { limit } = reason;
            if (limit === 'onetime') {
                return t('products.holders.card.notifications.status.charge_failed.limit.onetime');
            }
            if (limit === 'daily') {
                return t('products.holders.card.notifications.status.charge_failed.limit.daily');
            }
            if (limit === 'monthly') {
                return t('products.holders.card.notifications.status.charge_failed.limit.monthly');
            }
        }

        return t('products.holders.card.notifications.status.charge_failed.failed');
    }

    return t('products.holders.card.notifications.status.completed');
};