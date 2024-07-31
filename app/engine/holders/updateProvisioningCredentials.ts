import { fetchApplePayCredentials } from "../api/holders/fetchApplePayCredentials";
import { z } from "zod";
import WalletService from "../../modules/WalletService";

export const credentialsKey = 'PaymentPassCredentials';

export const credentialCodec = z.object({
    identifier: z.string(),
    token: z.string(),
    label: z.string(),
    primaryAccountSuffix: z.string(),
    cardholderName: z.string(),
    assetName: z.string().optional(),
    assetUrl: z.string().optional(),
    isTestnet: z.union([z.literal(0), z.literal(1)]).optional(),
});

export type ProvisioningCredential = z.infer<typeof credentialCodec>;

export async function fetchProvisioningCredentials(token: string, isTestnet: boolean): Promise<{ [key: string]: ProvisioningCredential } | undefined> {
    const credentials: Map<string, ProvisioningCredential> = new Map();

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

export async function removeProvisioningCredentials(token: string) {
    try {
        const creds = await WalletService.getCredentials();
        const currentState: { [key: string]: ProvisioningCredential } = {};
        creds.forEach((cred) => {
            if (cred.token !== token) {
                currentState[cred.identifier] = cred;
            }
        });

        await WalletService.setCredentialsInGroupUserDefaults(currentState);

    } catch {
        console.warn('Failed to remove provisioning credentials');
    }
}

export async function updateProvisioningCredentials(token: string, isTestnet: boolean) {
    try {
        const creds = await WalletService.getCredentials();
        const currentState: { [key: string]: ProvisioningCredential } = {};
        creds.forEach((cred) => {
            if (cred.token !== token) { // remove old credentials for the token
                currentState[cred.identifier] = cred;
            }
        });

        const freshCreds = await fetchProvisioningCredentials(token, isTestnet);

        await WalletService.setCredentialsInGroupUserDefaults({
            ...currentState,
            ...freshCreds
        });

    } catch {
        console.warn('Failed to update provisioning credentials');
    }
}