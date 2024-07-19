import { NativeModules, Platform } from 'react-native';
import { z } from 'zod';

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
    localizedDescription: z.string(),
    primaryAccountIdentifier: z.string().optional(),
    paymentNetwork: z.string(),
    network: z.union([z.literal('test'), z.literal('main')])
});

const addCardRequestSchemaWithToken = addCardRequestSchema.extend({
    userToken: z.string()
});

type AddCardRequest = z.infer<typeof addCardRequestSchemaWithToken>;

interface WalletService {
    canAddCards(): Promise<boolean>;
    checkIfCardIsAlreadyAdded(primaryAccountIdentifier: string): Promise<boolean>;
    canAddCard(cardId: string): Promise<boolean>;
    addCardToWallet(request: AddCardRequest): Promise<boolean>;
}

const WalletService: WalletService = Platform.OS === 'ios' ? {
    async canAddCards(): Promise<boolean> {
        return RNAppleProvisioning.canAddCards();
    },

    async checkIfCardIsAlreadyAdded(primaryAccountIdentifier: string): Promise<boolean> {
        return RNAppleProvisioning.checkIfCardIsAlreadyAdded(primaryAccountIdentifier);
    },

    async canAddCard(cardId: string): Promise<boolean> {
        return RNAppleProvisioning.canAddCard(cardId);
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        return RNAppleProvisioning.addCardToWallet(request);
    }
} : {
    async canAddCards(): Promise<boolean> {
        return false;
    },

    async checkIfCardIsAlreadyAdded(primaryAccountIdentifier: string): Promise<boolean> {
        return false;
    },

    async canAddCard(cardId: string): Promise<boolean> {
        return false;
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        return false;
    }
}

// export const process

export default WalletService;