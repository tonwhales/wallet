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

// Error handling utilities for consistent behavior across platforms
export class WalletServiceError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'WalletServiceError';
    }
}

/**
 * Wraps a native module call with consistent error handling.
 * For non-critical operations, returns a default value on error.
 * For critical operations, re-throws with a normalized error.
 */
async function safeCall<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    operationName: string
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.warn(`WalletService.${operationName} failed:`, error);
        return defaultValue;
    }
}

/**
 * Wraps a critical native module call - throws normalized errors.
 */
async function criticalCall<T>(
    operation: () => Promise<T>,
    operationName: string
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new WalletServiceError(message, operationName);
    }
}

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

// iOS Wallet Service implementation
// Note: Platform selection happens at export level, so individual methods don't need platform checks
export const IosWalletService: IosWalletService = {
    async isEnabled(): Promise<boolean> {
        return safeCall(
            () => RNAppleProvisioning.canAddCards(),
            false,
            'isEnabled'
        );
    },

    async checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean> {
        return safeCall(
            () => RNAppleProvisioning.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix),
            false,
            'checkIfCardIsAlreadyAdded'
        );
    },

    async checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }> {
        return safeCall(
            () => RNAppleProvisioning.checkIfCardsAreAdded(cardIds),
            {},
            'checkIfCardsAreAdded'
        );
    },

    async canAddCard(cardId: string): Promise<boolean> {
        return safeCall(
            () => RNAppleProvisioning.canAddCard(cardId),
            false,
            'canAddCard'
        );
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        // Critical operation - propagate errors to caller
        return criticalCall(
            () => RNAppleProvisioning.addCardToWallet(request),
            'addCardToWallet'
        );
    },

    async getCredentials(): Promise<ProvisioningCredential[]> {
        return safeCall(
            () => RNAppleProvisioning.getCredentials(),
            [],
            'getCredentials'
        );
    },

    async setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }): Promise<void> {
        return safeCall(
            () => RNAppleProvisioning.setCredentialsInGroupUserDefaults(data),
            undefined,
            'setCredentialsInGroupUserDefaults'
        );
    },

    async getShouldRequireAuthenticationForAppleWallet(): Promise<boolean> {
        return safeCall(
            () => RNAppleProvisioning.getShouldRequireAuthenticationForAppleWallet(),
            false,
            'getShouldRequireAuthenticationForAppleWallet'
        );
    },

    async setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean): Promise<void> {
        return safeCall(
            () => RNAppleProvisioning.setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication),
            undefined,
            'setShouldRequireAuthenticationForAppleWallet'
        );
    }
}

// Android Wallet Service implementation
// Note: Platform selection happens at export level, so individual methods don't need platform checks
export const AndroidWalletService: AndroidWalletService = {
    async isEnabled(): Promise<boolean> {
        return safeCall(
            () => WalletModule.isEnabled(),
            false,
            'isEnabled'
        );
    },

    async getIsDefaultWallet(): Promise<boolean> {
        return safeCall(
            () => WalletModule.getIsDefaultWallet(),
            false,
            'getIsDefaultWallet'
        );
    },

    async setDefaultWallet(): Promise<void> {
        return criticalCall(
            () => WalletModule.setDefaultWallet(),
            'setDefaultWallet'
        );
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        // Critical operation - propagate errors to caller
        return criticalCall(
            () => WalletModule.addCardToWallet(
                request.token,
                request.cardId,
                request.cardholderName,
                request.primaryAccountNumberSuffix,
                request.isTestnet
            ),
            'addCardToWallet'
        );
    },

    async checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean> {
        return safeCall(
            () => WalletModule.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix),
            false,
            'checkIfCardIsAlreadyAdded'
        );
    },

    async canAddCard(_cardId: string): Promise<boolean> {
        // Android always returns true - card can be added, errors handled at native level
        return true;
    },

    async checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }> {
        try {
            const result = await WalletModule.checkIfCardsAreAdded(cardIds);

            return result.reduce((acc: { [key: string]: boolean }, isAdded: boolean, index: number) => {
                acc[cardIds[index]] = isAdded;
                return acc;
            }, {} as { [key: string]: boolean });
        } catch (error) {
            console.warn('WalletService.checkIfCardsAreAdded failed:', error);
            return {};
        }
    }
}

export const WalletService = Platform.OS === 'ios' ? IosWalletService : AndroidWalletService;