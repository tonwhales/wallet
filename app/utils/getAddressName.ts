import { AddressNameType } from "../engine/types";
import { t } from "../i18n/t";

export const getAddressName = (addressType?: AddressNameType) => {
    switch (addressType) {
        case 'pool':
            return t('common.poolAddress');
        case 'wallet':
            return t('common.walletAddress');
        case 'direct-deposit':
            return t('common.directDepositAddress');
        default:
            return t('common.walletAddress');
    }
};