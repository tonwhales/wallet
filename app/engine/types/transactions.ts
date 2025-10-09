import { AccountStatus, Address, Cell } from '@ton/core';
import { LocalizedResources } from '../../i18n/schema';
import { PreparedMessage } from '../hooks/transactions/usePeparedMessages';
import { ContractInfo } from '../api/fetchContractInfo';
import { SolanaTransaction } from '../api/solana/fetchSolanaTransactions';

export type StoredAddressExternal = {
    bits: number;
    data: string;
};

export type ExtraCurrencyT = {
    [k: number]: string;
};

export type StoredMessageInfo = {
    type: 'internal';
    value: string;
    dest: string;
    src: string;
    bounced: boolean;
    bounce: boolean;
    ihrDisabled: boolean;
    createdAt: number;
    createdLt: string;
    fwdFee: string;
    ihrFee: string;
    extraCurrency?: ExtraCurrencyT;
} | {
    type: 'external-in';
    dest: string;
    src: StoredAddressExternal | null;
    importFee: string;
} | {
    type: 'external-out';
    dest: StoredAddressExternal | null;
};

export type StoredStateInit = {
    splitDepth?: number | null;
    code: string | null;
    data: string | null;
    special?: { tick: boolean, tock: boolean } | null;
};

export type StoredMessage = {
    body: string,
    info: StoredMessageInfo,
    init: StoredStateInit | null,
};

export type StoredOperation = {
    address: string;
    comment?: string;
    items: StoredOperationItem[];

    // Address
    op?: { res: LocalizedResources, options?: any };
    // title?: string;
    // image?: string;

};

export type StoredOperationItem = {
    kind: 'ton'
    amount: string;
} | {
    kind: 'token',
    amount: string;
};

export type StoredTxBody = { type: 'comment', comment: string } | { type: 'payload' };

export type StoredTransaction = {
    address: string;
    lt: string;
    hash: string
    prevTransaction: {
        lt: string;
        hash: string;
    };
    time: number;
    outMessagesCount: number;
    oldStatus: AccountStatus;
    newStatus: AccountStatus;
    fees: string;
    update: {
        oldHash: string;
        newHash: string;
    };
    inMessage: StoredMessage | null;
    outMessages: StoredMessage[];
    parsed: {
        seqno: number | null;
        body: StoredTxBody | null;
        status: 'success' | 'failed' | 'pending';
        dest: string | null;
        kind: 'out' | 'in';
        amount: string;
        resolvedAddress: string;
        bounced: boolean;
        mentioned: string[];
    },
    operation: StoredOperation;
}


export type TxBody = { type: 'comment', comment: string } | { type: 'payload', cell: Cell };

export type Transaction = {
    lt: string | null;
    fees: bigint;
    amount: bigint;
    address: Address | null;
    seqno: number | null;
    kind: 'out' | 'in';
    body: TxBody | null;
    status: 'success' | 'failed' | 'pending';
    time: number;
    bounced: boolean;
    prev: { lt: string, hash: string } | null;
    mentioned: string[];
    hash: Buffer;
}

export type Operation = {

    // Operation
    address: Address;
    op?: string;
    items: OperationItem[];

    // Address
    title?: string;
    image?: string;
    comment?: string;
};

export type OperationItem = {
    kind: 'ton'
    amount: bigint;
} | {
    kind: 'token',
    amount: bigint;
    symbol: string,
    decimals: number | null
};

export type ChargeAction = 'purchase' | 'refund' | 'cash_withdraw' | 'other';

export type Limits = {
    monthly: string;
    daily: string;
    onetime: string;
};

export type LimitsKeyT = keyof Limits;

export type FiatCurrencyCoin =
    | 'USD'
    | 'EUR'
    | 'RUB'
    | 'GBP'
    | 'CHF'
    | 'CNY'
    | 'KRW'
    | 'IDR'
    | 'INR'
    | 'JPY';

export type CryptoCurrencyCoin = 'USDT' | 'USDC' | 'SOL' | 'TON';

export type CurrencyCoin = FiatCurrencyCoin | CryptoCurrencyCoin;

export type CryptoCurrency = {
    decimals: number;
    ticker: CryptoCurrencyCoin;
    tokenContract: string | undefined;
};

export type ChainContract = {
    network: 'ton-testnet' | 'ton-mainnet';
    address: string;
};

export type ChainTx =
    | {
        network: 'ton-testnet' | 'ton-mainnet';
        address: string;
        hash: string;
        lt: string;
        transactionKey: string;
        error?: string;
    }
    | {
        network: 'tron' | 'polygon' | 'solana' | 'ether';
        hash: string;
        transactionKey: string;
        error?: string;
    };

export type ChainNetwork = ChainTx['network'];

export type MerchantInfo = {
    cleanName: string;
    dirtyName: string;
    country: string;
    logo: string;
    logoUrl: string;
    merchantId: string;
    placeId: string;
};

export type NotificationCommitted = {
    type: 'contract_committed';
    id: string;
    cardId: string;
    time: number;
    data: {
        chainTx?: ChainTx;
    };
};

export type NotificationAccountReady = {
    type: 'crypto_account_ready';
    id: string;
    time: number;
    data: {
        accountId: string;
        contract?: ChainContract;
    };
};

export type NotificationCardReady = {
    type: 'card_ready';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        contract?: ChainContract;
    };
};

export type NotificationDeposit = {
    type: 'deposit';
    id: string;
    key: string;
    time: number;
    data: {
        accountId: string;
        cryptoCurrency: CryptoCurrency;
        amount: string;
        pending?: boolean;
        chainTx?: ChainTx;
    };
};

export type NotificationCardPaid = {
    type: 'card_paid';
    id: string;
    cardId: string;
    time: number;
    data: {
        amount: string;
    };
};

export type NotificationCloseAccount = {
    type: 'contract_closed';
    id: string;
    cardId: string;
    time: number;
};

export type NotificationDecline = {
    type: 'decline';
    id: string;
    key: string;
    accountId: string;
    time: number;
    data: {
        amount?: string;
        currency: string;
        currencyAmount: string;
        txnCurrency: string;
        txnCurrencyAmount: string;
        rejectReason: string;
        merchantInfo?: MerchantInfo;
    };
};

export type NotificationCharge = {
    type: 'charge';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        cryptoCurrency: CryptoCurrency;
        amount: string;
        currency: string;
        currencyAmount: string;
        txnCurrency: string;
        txnCurrencyAmount: string;
        ref: string;
        merchantInfo?: MerchantInfo;
    };
};

export type NotificationChargeFailed = {
    type: 'charge_failed';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        amount: string;
        currency: string;
        currencyAmount: string;
        txnCurrency: string;
        txnCurrencyAmount: string;
        cryptoCurrency: CryptoCurrency;
        ref: string;
        reason: {
            limit?: LimitsKeyT;
            type: string;
        };
        merchantInfo: MerchantInfo;
    };
};

export type NotificationChargeBack = {
    type: 'charge_back';
    id: string;
    key: string;
    time: number;
    data: {
        action: 'purchase' | 'refund' | 'cash_withdraw' | 'other';
        accountId: string;
        amount: string;
        currency: string;
        currencyAmount: string;
        txnCurrency: string;
        txnCurrencyAmount: string;
        cryptoCurrency: CryptoCurrency;
        merchantInfo: MerchantInfo;
    };
};

export type NotificationLimitChange = {
    type: 'limits_change';
    id: string;
    key: string;
    time: number;
    data: {
        accountId: string;
        limits: Limits;
        chainTx?: ChainTx;
        pending?: boolean;
    };
};

export type NotificationCardWithdrawal = {
    type: 'card_withdraw';
    id: string;
    cardId: string;
    time: number;
    data: {
        amount: string;
        accountId: string;
    };
};

export type NotificationAccountCharge = {
    type: 'account_charge';
    id: string;
    accountId: string;
    time: number;
    data: {
        amount: string;
        cryptoCurrency: CryptoCurrency;
        currency: string;
        currencyAmount: string;
        rate: string;
        merchantInfo?: MerchantInfo;
    };
};

export type NotificationAccountWithdrawal = {
    type: 'crypto_account_withdraw';
    id: string;
    cardId: string;
    time: number;
    data: {
        amount: string;
        accountId: string;
    };
};

export type NotificationCardFreeze = {
    type: 'card_freeze';
    id: string;
    cardId: string;
    time: number;
    data: {
        reason: string;
    };
};

export type NotificationCardBlock = {
    type: 'card_block';
    id: string;
    cardId: string;
    time: number;
    data: {
        reason: string;
    };
};

export type NotificationCardUnfreeze = {
    type: 'card_unfreeze';
    id: string;
    cardId: string;
    time: number;
    data: {
        byUser: boolean;
    };
};

export type NotificationPrepaidTopup = {
    id: string;
    type: 'prepaid_topup';
    key: string;
    time: number;
    data: {
        amount: string;
        currency: string;
        cryptoCurrency: CryptoCurrency;
        cryptoAmount: string;
    };
};

export type NotificationPrepaidCharge = {
    id: string;
    type: 'prepaid_charge';
    key: string;
    time: number;
    data: {
        action: ChargeAction;
        currency: string;
        amount: string;
        transactionAmount: string;
        transactionCurrency: string;
        merchantInfo?: MerchantInfo;
    };
};

export type HoldersTransaction =
    | NotificationCardBlock
    | NotificationCardReady
    | NotificationAccountReady
    | NotificationDeposit
    | NotificationDecline
    | NotificationCharge
    | NotificationChargeFailed
    | NotificationChargeBack
    | NotificationLimitChange
    | NotificationCardPaid
    | NotificationAccountCharge
    | NotificationAccountWithdrawal
    | NotificationCardWithdrawal
    | NotificationCloseAccount
    | NotificationCardFreeze
    | NotificationCardUnfreeze
    | NotificationCommitted
    | NotificationPrepaidTopup
    | NotificationPrepaidCharge;

export enum TransactionType {
    TON = 'ton',
    SOLANA = 'solana'
}

//
// Fetched
//
export type TonTx = {
    type: TransactionType.TON,
    data: StoredTransaction
}

export type SolanaTx = {
    type: TransactionType.SOLANA,
    data: SolanaTransaction
}

export type CommonTx = TonTx | SolanaTx;

//
// Stored
//
export type TonTransaction = {
    id: string,
    base: StoredTransaction,
    outMessagesCount: number,
    outMessages: StoredMessage[],
    lt: string,
    hash: string
    message?: PreparedMessage
    contractInfo?: ContractInfo
    symbolText?: string
    jettonDecimals?: number | null
}

export type TonStoredTransaction = {
    type: TransactionType.TON,
    data: TonTransaction
}
