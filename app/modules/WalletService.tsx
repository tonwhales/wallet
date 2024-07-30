import { NativeModules, Platform } from 'react-native';
import { z } from 'zod';
import { ProvisioningCredential } from '../engine/holders/updateProvisioningCredentials';

const { RNAppleProvisioning } = NativeModules;

// cardholderName - NSString, The name of the person the card is issued to.
// primaryAccountNumberSuffix - NSString, The last four or five digits of the PAN. Presented to the user with dots prepended to indicate that it is a suffix.
// This must not be the entire PAN.
// localizedDescription - NSString, A short description of the card.
// Example: "Green Travel"
// Example Usage: "You are adding your Green Travel Card".
// primaryAccountidentifier - NSString, Filters the device and attached devices that already have this card provisioned. No filter is applied if the parameter is omitted.
// paymentNetwork - NSString, Filters the networks shown in the introduction view to this single network.

export const addCardRequestSchema = z.object({
    cardId: z.string(),
    cardholderName: z.string(),
    primaryAccountNumberSuffix: z.string(),
    localizedDescription: z.string().optional(),
    primaryAccountIdentifier: z.string().optional(),
    paymentNetwork: z.string().optional(),
    network: z.union([z.literal('test'), z.literal('main')]).optional()
});

const addCardRequestSchemaWithToken = addCardRequestSchema.extend({
    token: z.string()
});

type AddCardRequest = z.infer<typeof addCardRequestSchemaWithToken>;

interface IosWalletService {
    isEnabled(): Promise<boolean>;
    checkIfCardIsAlreadyAdded(primaryAccountIdentifier: string): Promise<boolean>;
    canAddCard(cardId: string): Promise<boolean>;
    addCardToWallet(request: AddCardRequest): Promise<boolean>;
    getCredentials(): Promise<ProvisioningCredential[]>;
    setCredentialsInGroupUserDefaults(data: { [key: string]: ProvisioningCredential }): Promise<void>;
    getShouldRequireAuthenticationForAppleWallet(): Promise<boolean>;
    setShouldRequireAuthenticationForAppleWallet(shouldRequireAuthentication: boolean): Promise<void>;

    // TODO // MARK: REMOVE
    status(): Promise<{
        passEntriesAvailable: boolean;
        remotePassEntriesAvailable: boolean;
        requiresAuthentication: boolean;
    }>;
    getGroupUserDefaults(): Promise<{ [key: string]: object }>;
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

    async checkIfCardIsAlreadyAdded(primaryAccountIdentifier: string): Promise<boolean> {
        if (Platform.OS === 'android') {
            return false;
        }
        return RNAppleProvisioning.checkIfCardIsAlreadyAdded(primaryAccountIdentifier);
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

    // TODO // MARK: REMOVE
    async status() {
        return RNAppleProvisioning.status();
    },
    async getGroupUserDefaults() {
        return RNAppleProvisioning.getGroupUserDefaults();
    }
}

export default WalletService;