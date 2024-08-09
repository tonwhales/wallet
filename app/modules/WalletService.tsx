import { NativeModules, Platform } from 'react-native';
import { z } from 'zod';
import { ProvisioningCredential } from '../engine/holders/updateProvisioningCredentials';

const { RNAppleProvisioning } = NativeModules;

export const addCardRequestSchema = z.object({
    cardId: z.string(),
    cardholderName: z.string(),
    primaryAccountNumberSuffix: z.string(),
    localizedDescription: z.string().optional(),
    primaryAccountIdentifier: z.string().optional(),
    paymentNetwork: z.string().optional(),
    isTestnet: z.boolean().optional()
});

const addCardRequestSchemaWithToken = addCardRequestSchema.extend({
    token: z.string()
});

type AddCardRequest = z.infer<typeof addCardRequestSchemaWithToken>;

interface IosWalletService {
    isEnabled(): Promise<boolean>;
    checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean>;
    canAddCard(cardId: string): Promise<boolean>;
    addCardToWallet(request: AddCardRequest): Promise<boolean>;
    getCredentials(): Promise<ProvisioningCredential[]>;
    setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }): Promise<void>;
    getShouldRequireAuthenticationForAppleWallet(): Promise<boolean>;
    setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean): Promise<void>;

    // Dev debug
    getExtensionData(key: string): Promise<string | undefined>;
}

// not implemented yet
interface AndroidWalletService {}

const WalletService: IosWalletService = {
    async isEnabled(): Promise<boolean> {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.canAddCards();
    },

    async checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean> {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix);
    },

    async canAddCard(cardId: string): Promise<boolean> {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.canAddCard(cardId);
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.addCardToWallet(request);
    },

    async getCredentials() {
        if (Platform.OS === 'android') {
            return {};
        }
        return RNAppleProvisioning.getCredentials();
    },

    async setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }) {
        if (Platform.OS === 'android') {
            return;
        }
        return RNAppleProvisioning.setCredentialsInGroupUserDefaults(data);
    },

    async getShouldRequireAuthenticationForAppleWallet() {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.getShouldRequireAuthenticationForAppleWallet();
    },

    async setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean) {
        if (Platform.OS === 'android') {
            return;
        }
        return RNAppleProvisioning.setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication);
    },

    // Dev debug
    async getExtensionData(key: string) {
        if (Platform.OS === 'android') {
            return '';
        }
        return RNAppleProvisioning.getExtensionData(key);
    }
}

export default WalletService;