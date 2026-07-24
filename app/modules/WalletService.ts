import { NativeModules, Platform } from 'react-native';
import { z } from 'zod';
import { ProvisioningCredential } from '../engine/holders/updateProvisioningCredentials';

const { RNAppleProvisioning } = NativeModules;
const { WalletModule } = NativeModules;

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
    checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }>;

    getCredentials(): Promise<ProvisioningCredential[]>;
    setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }): Promise<void>;
    getShouldRequireAuthenticationForAppleWallet(): Promise<boolean>;
    setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean): Promise<void>;
}

// not implemented yet
interface AndroidWalletService {
    isEnabled(): Promise<boolean>;
    checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean>;
    canAddCard(cardId: string): Promise<boolean>;
    addCardToWallet(request: AddCardRequest): Promise<boolean>;
    checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }>;

    getIsDefaultWallet(): Promise<boolean>;
    setDefaultWallet(): Promise<void>;
}

export const IosWalletService: IosWalletService = {
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

    async checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }> {
        if (Platform.OS === 'android') {
            return {};
        }
        return RNAppleProvisioning.checkIfCardsAreAdded(cardIds);
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

    async getCredentials(): Promise<ProvisioningCredential[]> {
        if (Platform.OS === 'android') {
            return [];
        }
        return RNAppleProvisioning.getCredentials();
    },

    async setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }): Promise<void> {
        if (Platform.OS === 'android') {
            return;
        }
        return RNAppleProvisioning.setCredentialsInGroupUserDefaults(data);
    },

    async getShouldRequireAuthenticationForAppleWallet(): Promise<boolean> {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.getShouldRequireAuthenticationForAppleWallet();
    },

    async setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean): Promise<void> {
        if (Platform.OS === 'android') {
            return;
        }
        return RNAppleProvisioning.setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication);
    }
}

export const AndroidWalletService: AndroidWalletService = {
    async isEnabled(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return false;
        }

        return WalletModule.isEnabled();
    },

    async getIsDefaultWallet(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return false;
        }

        return WalletModule.getIsDefaultWallet();
    },

    async setDefaultWallet(): Promise<void> {
        if (Platform.OS === 'ios') {
            return;
        }

        return WalletModule.setDefaultWallet();
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return false;
        }

        return WalletModule.addCardToWallet(
            request.token,
            request.cardId,
            request.cardholderName,
            request.primaryAccountNumberSuffix,
            request.isTestnet
        );
    },

    async checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return false;
        }

        return WalletModule.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix);
    },

    async canAddCard(cardId: string): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return false;
        }

        return true;
    },

    async checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }> {
        if (Platform.OS === 'ios') {
            return {};
        }

        const result = await WalletModule.checkIfCardsAreAdded(cardIds);

        return result.reduce((acc: { [x: string]: any; }, cardId: any, index: number) => {
            acc[cardIds[index]] = cardId;
            return acc;
        }, {});
    }
}

export const WalletService = Platform.OS === 'ios' ? IosWalletService : AndroidWalletService;