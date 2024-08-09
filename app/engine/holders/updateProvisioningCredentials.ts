import { fetchApplePayCredentials } from "../api/holders/fetchApplePayCredentials";
import { z } from "zod";
import WalletService from "../../modules/WalletService";
import { getHoldersToken } from "../hooks/holders/useHoldersAccountStatus";
import { Platform } from "react-native";

export const credentialsKey = 'PaymentPassCredentials';

export const credentialCodec = z.object({
    identifier: z.string(),
    token: z.string(),
    label: z.string(),
    primaryAccountSuffix: z.string(),
    cardholderName: z.string(),
    address: z.string(),
    assetName: z.string().optional(),
    assetUrl: z.string().optional(),
    isTestnet: z.union([z.literal(0), z.literal(1)]).optional(),
});

export type ProvisioningCredential = z.infer<typeof credentialCodec>;

async function fetchProvisioningCredentials(address: string, isTestnet: boolean): Promise<{ [key: string]: ProvisioningCredential } | undefined> {
    const credentials: Map<string, ProvisioningCredential> = new Map();
    const token = getHoldersToken(address);

    if (!token) {
        return {};
    }

    try {
        const accCreds = await fetchApplePayCredentials(token, isTestnet);

        if (!accCreds || accCreds.length === 0) {
            return;
        }

        for (const cred of accCreds) {
            credentials.set(
                cred.id,
                {
                    identifier: cred.id,
                    label: cred.title,
                    cardholderName: cred.cardholderName,
                    primaryAccountSuffix: cred.lastFourDigits,
                    token,
                    address,
                    assetName: cred.assetName,
                    assetUrl: cred.assetUrl,
                    isTestnet: isTestnet ? 1 : 0,
                }
            );
        }

        return Object.fromEntries(credentials);

    } catch {
        console.warn('Failed to fetch provisioning credentials');
    }
}

export async function removeProvisioningCredentials(address: string) {
    try {
        const creds = await WalletService.getCredentials();
        const currentState: { [key: string]: ProvisioningCredential } = {};
        creds.forEach((cred) => {
            if (cred.address !== address) {
                currentState[cred.identifier] = cred;
            }
        });

        await WalletService.setCredentialsInGroupUserDefaults(currentState);

    } catch {
        console.warn('Failed to remove provisioning credentials');
    }
}

async function filterOutAlreadyAddedCredentials(creds: { [key: string]: ProvisioningCredential }): Promise<{ [key: string]: ProvisioningCredential }> {
    const filteredCreds: { [key: string]: ProvisioningCredential } = {};

    for (const [key, cred] of Object.entries(creds)) {
        const isAlreadyAdded = await WalletService.checkIfCardIsAlreadyAdded(cred.primaryAccountSuffix);

        if (!isAlreadyAdded) {
            filteredCreds[key] = cred;
        }
    }

    return filteredCreds;
}

// store cards that could be added to Wallet for Apple Pay
export async function updateProvisioningCredentials(address: string, isTestnet: boolean) {
    if (Platform.OS !== 'ios') {
        return;
    }

    try {
        const token = getHoldersToken(address);
        const storedCreds = await WalletService.getCredentials();
        const currentState: { [key: string]: ProvisioningCredential } = {};

        storedCreds.forEach((cred) => {
            // add all credentials except the one that matches the current address
            if (cred.address !== address) {

                currentState[cred.identifier] = cred;
            }
        });

        if (!token) { // if there is no token, remove all credentials for the current address
            const filteredCreds = await filterOutAlreadyAddedCredentials(currentState);
            await WalletService.setCredentialsInGroupUserDefaults(filteredCreds);
            return;
        }

        const freshCreds = await fetchProvisioningCredentials(address, isTestnet);

        // update the credentials for the address with the new ones
        const filteredCreds = await filterOutAlreadyAddedCredentials({ ...currentState, ...freshCreds });
        await WalletService.setCredentialsInGroupUserDefaults(filteredCreds);
    } catch {
        console.warn('Failed to update provisioning credentials');
    }
}