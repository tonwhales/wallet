import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

const addressFormatsHistoryKey = 'addressFormatsHistory';

export type AddressFormatHistoryEntry = {
    lastUsedBounceableFormat: boolean;
};

export type AddressFormatsHistory = Record<string, AddressFormatHistoryEntry>;

export function getAddressFormatsHistory(): AddressFormatsHistory {
    const stored = sharedStoragePersistence.getString(addressFormatsHistoryKey);
    if (!stored) return {};
    
    try {
        return JSON.parse(stored);
    } catch (e) {
        return {};
    }
}

export function setAddressFormatsHistory(formats: AddressFormatsHistory) {
    sharedStoragePersistence.set(addressFormatsHistoryKey, JSON.stringify(formats));
}

export const addressFormatsHistoryAtom = atom<AddressFormatsHistory>({
    key: 'wallet/addressFormatsHistory',
    default: getAddressFormatsHistory(),
    effects: [
        ({ onSet }) => {
            onSet((formats) => {
                setAddressFormatsHistory(formats);
            });
        }
    ]
}); 