import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

export enum AppMode {
    Wallet = 'wallet',
    Cards = 'cards',
}

const walletsAppModesKey = 'walletsAppModes';

export function setWalletsAppModes(walletsAppModes: { [key: string]: AppMode }) {
    sharedStoragePersistence.set(walletsAppModesKey, JSON.stringify(walletsAppModes));
}

function getWalletsAppModes(): Record<string, AppMode> {
    let walletsAppModes = sharedStoragePersistence.getString(walletsAppModesKey);
    return walletsAppModes ? JSON.parse(walletsAppModes) : {};
}

export const walletsAppModesAtom = atom({
    key: 'wallet/appModes',
    default: getWalletsAppModes(),
    effects: [
        ({ onSet }) => {
            onSet((walletsAppModes) => {
                setWalletsAppModes(walletsAppModes);
            });
        }
    ]
});