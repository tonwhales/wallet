import { atom } from "recoil";
import { z } from "zod";
import { sharedStoragePersistence } from "../../storage/storage";

export type WalletSettings = {
    name: string | null,
    avatar: number | null,
    color: number | null,
}

const walletSettingsKey = 'walletsSettings';

const walletSettingsSchema = z.record(
    z.object({
        name: z.string().nullable(),
        avatar: z.number().nullable(),
        color: z.number().nullable(),
    })
);

export function setWalletsSettings(walletsSettings: { [key: string]: WalletSettings }) {
    sharedStoragePersistence.set(walletSettingsKey, JSON.stringify(walletsSettings));
}

function getWalletsSettings(): z.infer<typeof walletSettingsSchema> {
    let walletsSettings = sharedStoragePersistence.getString(walletSettingsKey);
    if (walletsSettings) {
        const jsonObj = JSON.parse(walletsSettings);
        if (jsonObj.color === undefined) {
            jsonObj.color = null;
        }
        const parsed = walletSettingsSchema.safeParse(JSON.parse(walletsSettings));
        if (!parsed.success) {
            return {};
        }
        return parsed.data;
    }
    return {};
}

export const walletsSettingsAtom = atom({
    key: 'wallet/settings',
    default: getWalletsSettings(),
    effects: [
        ({ onSet }) => {
            onSet((newWalletSettings) => {
                setWalletsSettings(newWalletSettings);
            });
        }
    ]
});