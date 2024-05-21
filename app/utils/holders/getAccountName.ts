import { t } from "../../i18n/t";

export function getAccountName(
    accountIndex: number,
    accountName?: string | null
): string {
    if (accountName) return accountName;

    if (accountIndex === 1) {
        return t('products.holders.accounts.primaryName');
    }

    return t('products.holders.accounts.paymentName', { accountIndex });
}