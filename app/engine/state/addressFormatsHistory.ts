import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

const addressFormatsHistoryKey = 'addressFormatsHistory';

export type AddressFormatHistoryEntry = {
    lastUsedBounceableFormat: boolean;
};

export type AddressFormatsHistory = Map<string, AddressFormatHistoryEntry>;

export function getAddressFormatsHistory(): AddressFormatsHistory {
    const stored = sharedStoragePersistence.getString(addressFormatsHistoryKey);
    if (!stored) return new Map<string, AddressFormatHistoryEntry>();
    
    try {
        return new Map(JSON.parse(stored));
    } catch (e) {
        return new Map<string, AddressFormatHistoryEntry>();
    }
}

export function setAddressFormatsHistory(formats: AddressFormatsHistory) {
    sharedStoragePersistence.set(addressFormatsHistoryKey, JSON.stringify(Array.from(formats.entries())));
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