import { TFunction } from "i18next";
import { AddressNameType } from "../engine/types";

export const getAddressName = (t: TFunction, addressType?: AddressNameType) => {
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