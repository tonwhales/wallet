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
        const parsed = walletSettingsSchema.safeParse(JSON.parse(walletsSettings));
        if (!parsed.success) {
            return {};
        }
        
        // Avatar changing feature is disabled for now. 
        // If you want to enable this feature again, just remove the code below
        const result: { [key: string]: WalletSettings } = {};
        for (const [key, wallet] of Object.entries(parsed.data)) {
            result[key] = {
                name: wallet.name,
                avatar: null,
                color: null
            };
        }
        return result;
    }
    return {};
}

export const walletsSettingsAtom = atom({
    key: 'wallet/settings',
    default: getWalletsSettings(),
    effects: [
        ({ onSet, setSelf }) => {
            const stored = getWalletsSettings();
            setSelf(stored);

            onSet((newWalletSettings) => {
                setWalletsSettings(newWalletSettings);
            });
        }
    ]
});