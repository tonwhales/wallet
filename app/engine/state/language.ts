import { atom } from "recoil";
import { storagePersistence } from "../../storage/storage";
import i18n from 'i18next';
import { getLocales } from "react-native-localize";

export const langKey = 'languageState';

function getLanguageState() {
    const stored = storagePersistence.getString(langKey);
    if (!stored) {
        return getLocales()[0].languageCode;
    }
    
    return stored;
}

function storeLanguageState(state: string) {
    storagePersistence.set(langKey, state);
}

export const languageState = atom({
    key: 'language',
    default: getLanguageState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeLanguageState(newValue);
        })
    }]
});