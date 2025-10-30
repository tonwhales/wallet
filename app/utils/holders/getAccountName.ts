import { AccountType } from "../../engine/api/holders/fetchAccounts";
import { t } from "../../i18n/t";

export function getAccountName(
    accountType: AccountType = 'crypto',
    accountIndex: number,
    accountName?: string | null
): string {
    if (accountName) return accountName;

    if (accountType === 'vesting') {
        if (accountIndex === 1) {
          return t('products.holders.accounts.vestingPrimaryName');
        }
    
        return t('products.holders.accounts.vestingName', { accountIndex });
      }

    if (accountIndex === 1) {
        return t('products.holders.accounts.primaryName');
    }

    return t('products.holders.accounts.paymentName', { accountIndex });
}