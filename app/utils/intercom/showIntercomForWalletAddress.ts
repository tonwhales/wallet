import Intercom, { Space } from "@intercom/intercom-react-native";

export const showIntercomForWalletAddress = async (address?: string) => {
    try {
        if (!!address) {
            await Intercom.logout()
            await Intercom.loginUserWithUserAttributes({ userId: address });
            await Intercom.presentSpace(Space.messages)
        } else {
            await Intercom.logout()
            await Intercom.loginUnidentifiedUser();
            await Intercom.presentSpace(Space.messages)
        }
    } catch (err) {
        console.log('ERROR SHOWING INTERCOM', err);
    }
}