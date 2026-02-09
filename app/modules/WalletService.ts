import { NativeModules, Platform } from 'react-native';
import { z } from 'zod';
import { ProvisioningCredential } from '../engine/holders/updateProvisioningCredentials';
import { saveErrorLog } from '../storage/errorLogs';

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

// Platform-prefixed error codes for wallet operations
export enum WalletErrorCode {
    // iOS PassKit errors
    IOS_REQUEST_IN_PROGRESS = 'ios.passkit.add_card.request_in_progress',
    IOS_MISSING_CARD_DETAILS = 'ios.passkit.add_card.missing_details',
    IOS_CONFIG_FAILED = 'ios.passkit.add_card.config_failed',
    IOS_CONTROLLER_FAILED = 'ios.passkit.add_card.controller_failed',
    IOS_INVALID_CREDENTIAL = 'ios.passkit.credentials.invalid_data',
    IOS_SERVER_ERROR = 'ios.passkit.add_card.server_error',

    // Android TapAndPay errors
    ANDROID_PROVISION_IN_PROGRESS = 'android.tapandpay.provision.in_progress',
    ANDROID_NO_ACTIVE_WALLET = 'android.tapandpay.provision.no_active_wallet',
    ANDROID_ATTESTATION_ERROR = 'android.tapandpay.provision.attestation_error',
    ANDROID_WALLET_CREATE_FAILED = 'android.tapandpay.wallet.create_failed',
    ANDROID_NO_ACTIVITY = 'android.tapandpay.provision.no_activity',
    ANDROID_OPC_FETCH_FAILED = 'android.tapandpay.provision.opc_fetch_failed',
    ANDROID_API_ERROR = 'android.tapandpay.api_error',
    ANDROID_NETWORK_ERROR = 'android.tapandpay.network_error',
    ANDROID_JSON_ERROR = 'android.tapandpay.json_error',
    ANDROID_SET_DEFAULT_IN_PROGRESS = 'android.tapandpay.set_default.in_progress',

    // Common errors
    UNKNOWN_ERROR = 'wallet.unknown_error',
}

// Structured error from native modules
export interface WalletNativeError {
    code: string;
    message: string;
    nativeCode?: string | number;
    details?: Record<string, unknown>;
}

// Error handling utilities for consistent behavior across platforms
export class WalletServiceError extends Error {
    public readonly nativeCode?: string | number;
    public readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        public readonly code: string,
        options?: { nativeCode?: string | number; details?: Record<string, unknown> }
    ) {
        super(message);
        this.name = 'WalletServiceError';
        this.nativeCode = options?.nativeCode;
        this.details = options?.details;
    }
}

/**
 * Parse native error into structured format.
 * React Native native module errors have code property when rejected with a code.
 */
function parseNativeError(error: unknown, operationName: string): WalletNativeError {
    if (error instanceof Error) {
        const nativeError = error as Error & { code?: string; nativeCode?: string | number; userInfo?: Record<string, unknown> };
        return {
            code: nativeError.code || WalletErrorCode.UNKNOWN_ERROR,
            message: nativeError.message || 'Unknown error',
            nativeCode: nativeError.nativeCode,
            details: {
                operation: operationName,
                ...(nativeError.userInfo || {})
            }
        };
    }
    return {
        code: WalletErrorCode.UNKNOWN_ERROR,
        message: String(error),
        details: { operation: operationName }
    };
}

/**
 * Handles wallet operation errors with logging and optional re-throwing.
 * For non-critical operations, logs the error and returns a default value.
 * For critical operations, logs the error and re-throws with normalized error.
 */
async function handleWalletError<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: { critical: boolean; defaultValue?: T }
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        const parsedError = parseNativeError(error, operationName);

        // Log to error storage for debugging
        saveErrorLog({
            message: parsedError.message,
            url: `WalletService.${operationName}`,
            additionalData: {
                code: parsedError.code,
                nativeCode: parsedError.nativeCode,
                platform: Platform.OS,
                ...parsedError.details
            }
        });

        if (options.critical) {
            throw new WalletServiceError(parsedError.message, parsedError.code, {
                nativeCode: parsedError.nativeCode,
                details: parsedError.details
            });
        }

        console.warn(`WalletService.${operationName} failed:`, parsedError.message);
        return options.defaultValue as T;
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
        return handleWalletError(
            () => RNAppleProvisioning.canAddCards(),
            'isEnabled',
            { critical: false, defaultValue: false }
        );
    },

    async checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean> {
        return handleWalletError(
            () => RNAppleProvisioning.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix),
            'checkIfCardIsAlreadyAdded',
            { critical: false, defaultValue: false }
        );
    },

    async checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }> {
        return handleWalletError(
            () => RNAppleProvisioning.checkIfCardsAreAdded(cardIds),
            'checkIfCardsAreAdded',
            { critical: false, defaultValue: {} }
        );
    },

    async canAddCard(cardId: string): Promise<boolean> {
        return handleWalletError(
            () => RNAppleProvisioning.canAddCard(cardId),
            'canAddCard',
            { critical: false, defaultValue: false }
        );
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        // Critical operation - propagate errors to caller
        return handleWalletError(
            () => RNAppleProvisioning.addCardToWallet(request),
            'addCardToWallet',
            { critical: true }
        );
    },

    async getCredentials(): Promise<ProvisioningCredential[]> {
        return handleWalletError(
            () => RNAppleProvisioning.getCredentials(),
            'getCredentials',
            { critical: false, defaultValue: [] }
        );
    },

    async setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }): Promise<void> {
        return handleWalletError(
            () => RNAppleProvisioning.setCredentialsInGroupUserDefaults(data),
            'setCredentialsInGroupUserDefaults',
            { critical: false, defaultValue: undefined }
        );
    },

    async getShouldRequireAuthenticationForAppleWallet(): Promise<boolean> {
        return handleWalletError(
            () => RNAppleProvisioning.getShouldRequireAuthenticationForAppleWallet(),
            'getShouldRequireAuthenticationForAppleWallet',
            { critical: false, defaultValue: false }
        );
    },

    async setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean): Promise<void> {
        return handleWalletError(
            () => RNAppleProvisioning.setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication),
            'setShouldRequireAuthenticationForAppleWallet',
            { critical: false, defaultValue: undefined }
        );
    }
}

// Android Wallet Service implementation
// Note: Platform selection happens at export level, so individual methods don't need platform checks
export const AndroidWalletService: AndroidWalletService = {
    async isEnabled(): Promise<boolean> {
        return handleWalletError(
            () => WalletModule.isEnabled(),
            'isEnabled',
            { critical: false, defaultValue: false }
        );
    },

    async getIsDefaultWallet(): Promise<boolean> {
        return handleWalletError(
            () => WalletModule.getIsDefaultWallet(),
            'getIsDefaultWallet',
            { critical: false, defaultValue: false }
        );
    },

    async setDefaultWallet(): Promise<void> {
        return handleWalletError(
            () => WalletModule.setDefaultWallet(),
            'setDefaultWallet',
            { critical: true }
        );
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        // Critical operation - propagate errors to caller
        return handleWalletError(
            () => WalletModule.addCardToWallet(
                request.token,
                request.cardId,
                request.cardholderName,
                request.primaryAccountNumberSuffix,
                request.isTestnet
            ),
            'addCardToWallet',
            { critical: true }
        );
    },

    async checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix: string): Promise<boolean> {
        return handleWalletError(
            () => WalletModule.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix),
            'checkIfCardIsAlreadyAdded',
            { critical: false, defaultValue: false }
        );
    },

    async canAddCard(_cardId: string): Promise<boolean> {
        // Android always returns true - card can be added, errors handled at native level
        return true;
    },

    async checkIfCardsAreAdded(cardIds: string[]): Promise<{ [key: string]: boolean }> {
        return handleWalletError(
            async () => {
                const result = await WalletModule.checkIfCardsAreAdded(cardIds);
                return result.reduce((acc: { [key: string]: boolean }, isAdded: boolean, index: number) => {
                    acc[cardIds[index]] = isAdded;
                    return acc;
                }, {} as { [key: string]: boolean });
            },
            'checkIfCardsAreAdded',
            { critical: false, defaultValue: {} }
        );
    }
}

export const WalletService = Platform.OS === 'ios' ? IosWalletService : AndroidWalletService;