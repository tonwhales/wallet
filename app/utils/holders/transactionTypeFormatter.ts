import { HoldersTransaction } from "../../engine/types";

export function transactionTypeFormatter(
  type: HoldersTransaction['type'],
  isPending?: boolean
) {
  if (type === 'crypto_account_ready') {
    return 'products.holders.transaction.type.accountReady';
  }
  if (type === 'card_ready') {
    return 'products.holders.transaction.type.cardReady';
  }
  if (type === 'deposit') {
    return 'products.holders.transaction.type.deposit';
  }
  if (type === 'prepaid_topup') {
    return 'products.holders.transaction.type.prepaidTopUp';
  }
  if (
    type === 'charge' ||
    type === 'account_charge' ||
    type === 'prepaid_charge' ||
    type === 'charge_failed'
  ) {
    return 'products.holders.transaction.type.payment';
  }

  if (type === 'decline') {
    return 'products.holders.transaction.type.decline';
  }

  if (type === 'charge_back') {
    return 'products.holders.transaction.type.refund';
  }

  if (type === 'limits_change') {
    if (isPending) {
      return 'products.holders.transaction.type.limitsChanging';
    }
    return 'products.holders.transaction.type.limitsChanged';
  }
  if (type === 'crypto_account_withdraw' || type === 'card_withdraw') {
    return 'products.holders.transaction.type.cardWithdraw';
  }
  if (type === 'contract_closed') {
    return 'products.holders.transaction.type.contractClosed';
  }
  if (type === 'card_block') {
    return 'products.holders.transaction.type.cardBlock';
  }
  if (type === 'card_freeze') {
    return 'products.holders.transaction.type.cardFreeze';
  }
  if (type === 'card_unfreeze') {
    return 'products.holders.transaction.type.cardUnfreeze';
  }
  if (type === 'card_paid') {
    return 'products.holders.transaction.type.cardPaid';
  }

  return 'products.holders.transaction.type.unknown';
}