import axios from "axios";
import { holdersEndpoint } from "./fetchUserState";

export type CountryCode = 'AC' | 'AD' | 'AE' | 'AF' | 'AG' | 'AI' | 'AL' | 'AM' | 'AO' | 'AR' | 'AS' | 'AT' | 'AU' | 'AW' | 'AX' | 'AZ' | 'BA' | 'BB' | 'BD' | 'BE' | 'BF' | 'BG' | 'BH' | 'BI' | 'BJ' | 'BL' | 'BM' | 'BN' | 'BO' | 'BQ' | 'BR' | 'BS' | 'BT' | 'BW' | 'BY' | 'BZ' | 'CA' | 'CC' | 'CD' | 'CF' | 'CG' | 'CH' | 'CI' | 'CK' | 'CL' | 'CM' | 'CN' | 'CO' | 'CR' | 'CU' | 'CV' | 'CW' | 'CX' | 'CY' | 'CZ' | 'DE' | 'DJ' | 'DK' | 'DM' | 'DO' | 'DZ' | 'EC' | 'EE' | 'EG' | 'EH' | 'ER' | 'ES' | 'ET' | 'FI' | 'FJ' | 'FK' | 'FM' | 'FO' | 'FR' | 'GA' | 'GB' | 'GD' | 'GE' | 'GF' | 'GG' | 'GH' | 'GI' | 'GL' | 'GM' | 'GN' | 'GP' | 'GQ' | 'GR' | 'GT' | 'GU' | 'GW' | 'GY' | 'HK' | 'HN' | 'HR' | 'HT' | 'HU' | 'ID' | 'IE' | 'IL' | 'IM' | 'IN' | 'IO' | 'IQ' | 'IR' | 'IS' | 'IT' | 'JE' | 'JM' | 'JO' | 'JP' | 'KE' | 'KG' | 'KH' | 'KI' | 'KM' | 'KN' | 'KP' | 'KR' | 'KW' | 'KY' | 'KZ' | 'LA' | 'LB' | 'LC' | 'LI' | 'LK' | 'LR' | 'LS' | 'LT' | 'LU' | 'LV' | 'LY' | 'MA' | 'MC' | 'MD' | 'ME' | 'MF' | 'MG' | 'MH' | 'MK' | 'ML' | 'MM' | 'MN' | 'MO' | 'MP' | 'MQ' | 'MR' | 'MS' | 'MT' | 'MU' | 'MV' | 'MW' | 'MX' | 'MY' | 'MZ' | 'NA' | 'NC' | 'NE' | 'NF' | 'NG' | 'NI' | 'NL' | 'NO' | 'NP' | 'NR' | 'NU' | 'NZ' | 'OM' | 'PA' | 'PE' | 'PF' | 'PG' | 'PH' | 'PK' | 'PL' | 'PM' | 'PR' | 'PS' | 'PT' | 'PW' | 'PY' | 'QA' | 'RE' | 'RO' | 'RS' | 'RU' | 'RW' | 'SA' | 'SB' | 'SC' | 'SD' | 'SE' | 'SG' | 'SH' | 'SI' | 'SJ' | 'SK' | 'SL' | 'SM' | 'SN' | 'SO' | 'SR' | 'SS' | 'ST' | 'SV' | 'SX' | 'SY' | 'SZ' | 'TA' | 'TC' | 'TD' | 'TG' | 'TH' | 'TJ' | 'TK' | 'TL' | 'TM' | 'TN' | 'TO' | 'TR' | 'TT' | 'TV' | 'TW' | 'TZ' | 'UA' | 'UG' | 'US' | 'UY' | 'UZ' | 'VA' | 'VC' | 'VE' | 'VG' | 'VI' | 'VN' | 'VU' | 'WF' | 'WS' | 'XK' | 'YE' | 'YT' | 'ZA' | 'ZM' | 'ZW';

export type ChainTx = {
    lt: string;
    hash: string;
    address: string;
    network: 'ton-testnet' | 'ton-mainnet';
};

export type ChainContract = {
    network: 'ton-testnet' | 'ton-mainnet';
    address: string;
};

export type NotificationCommitedT = {
    type: 'contract_commited';
    id: string;
    cardId: string;
    time: number;
    data: {
        chainTx?: ChainTx;
        /**
         * @deprecated Use chainTx
         */
        explorerUrl?: string;
    };
};

export type NotificationReadyT = {
    type: 'card_ready';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        contract?: ChainContract;
        /**
         * @deprecated Use contract
         */
        explorerUrl?: string;
    };
};

export type NotificationDepositT = {
    type: 'deposit';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        amount: string;
        pending?: boolean;
        chainTx?: ChainTx;
        /**
         * @deprecated Use chainTx
         */
        explorerUrl?: string;
    };
};

export type NotificationCardPaidT = {
    type: 'card_paid';
    id: string;
    cardId: string;
    time: number;
    data: {
        amount: string;
    };
};

export type NotificationCloseAccountT = {
    type: 'contract_closed';
    id: string;
    cardId: string;
    time: number;
};

export type MerchantInfo = {
    cleanName: string;
    dirtyName: string;
    country: CountryCode;
    logo: string;
    logoUrl: string;
    merchantId: string;
    placeId: string;
};

export type NotificationChargeT = {
    type: 'charge';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        amount: string;
        currency: string;
        currencyAmount: string;
        ref: string;
        merchantInfo?: MerchantInfo;
    };
};

export type NotificationChargeFailedT = {
    type: 'charge_failed';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        amount: string;
        currency: string;
        currencyAmount: string;
        ref: string;
        reason: {
            limit?: 'daily' | 'monthly' | 'onetime';
            type: string;
        };
        merchantInfo: MerchantInfo;
    };
};

export type NotificationLimitChangeT = {
    type: 'limits_change';
    id: string;
    cardId: string;
    time: number;
    data: {
        accountId: string;
        limits: {
            daily: string;
            monthly: string;
            onetime: string;
        };
        chainTx?: ChainTx;
        pending?: boolean;
    };
};

export type NotificationWithdrawalT = {
    type: 'card_withdraw';
    id: string;
    cardId: string;
    time: number;
    data: {
        amount: string;
        accountId: string;
    };
};

export type NotificationWithdrawaAcclT = {
    type: 'crypto_account_withdraw';
    id: string;
    cardId: string;
    time: number;
    data: {
        amount: string;
        accountId: string;
    };
};

export type NotificationFreezeT = {
    type: 'card_freeze';
    id: string;
    cardId: string;
    time: number;
    data: {
        reason: string;
    };
};

export type NotificationBlockT = {
    type: 'card_block';
    id: string;
    cardId: string;
    time: number;
    data: {
        reason: string;
    };
};

export type NotificationUnFreezeT = {
    type: 'card_unfreeze';
    id: string;
    cardId: string;
    time: number;
    data: {
        byUser: boolean;
    };
};

export type CardNotification =
    | NotificationBlockT
    | NotificationReadyT
    | NotificationDepositT
    | NotificationChargeT
    | NotificationChargeFailedT
    | NotificationLimitChangeT
    | NotificationCardPaidT
    | NotificationWithdrawalT
    | NotificationCloseAccountT
    | NotificationFreezeT
    | NotificationUnFreezeT
    | NotificationCommitedT
    | NotificationWithdrawaAcclT;


export async function fetchCardsTransactions(
    token: string,
    id: string,
    limit = 40,
    isTestnet: boolean,
    cursor?: string | undefined,
    order?: 'asc' | 'desc',
) {
    const endpoint = holdersEndpoint(isTestnet);
    const res = await axios.post(
        `https://${endpoint}/v2/card/events`,
        {
            cardId: id,
            token,
            cursor,
            limit,
            order,
        }
    );

    if (!res.data.ok) {
        throw Error('Error fetching events');
    }

    return {
        hasMore: (res.data.data.more || false) as boolean,
        lastCursor: res.data.data.cursor as string,
        data: (res.data.data.events || []) as CardNotification[]
    };
}