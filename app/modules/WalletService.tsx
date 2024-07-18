import { NativeModules } from 'react-native';

const { RNAppleProvisioning } = NativeModules;

// cardholderName - NSString, The name of the person the card is issued to.
// primaryAccountNumberSuffix - NSString, The last four or five digits of the PAN. Presented to the user with dots prepended to indicate that it is a suffix.
// This must not be the entire PAN.
// localizedDescription - NSString, A short description of the card.
// Example: "Green Travel"
// Example Usage: "You are adding your Green Travel Card".
// primaryAccountidentifier - NSString, Filters the device and attached devices that already have this card provisioned. No filter is applied if the parameter is omitted.
// paymentNetwork - NSString, Filters the networks shown in the introduction view to this single network.
type AddCardRequest = {
    cardId: string,
    userToken: string,
    cardholderName: string,
    primaryAccountNumberSuffix: string,
    localizedDescription: string,
    primaryAccountIdentifier?: string,
    paymentNetwork: string,
    network: 'test' | 'main'
}

const WalletService = {
    async canAddCards(): Promise<boolean> {
        return RNAppleProvisioning.canAddCards();
    },

    async checkIfCardIsAlreadyAdded(): Promise<boolean> {
        return RNAppleProvisioning.checkIfCardIsAlreadyAdded();
    },

    async canAddCard(cardId: string): Promise<boolean> {
        return RNAppleProvisioning.canAddCard(cardId);
    },

    async addCardToWallet(request: AddCardRequest): Promise<boolean> {
        return RNAppleProvisioning.addCardToWallet(request);
    }
}

export default WalletService;