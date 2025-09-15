import Intercom, { Space } from "@intercom/intercom-react-native";

export const showIntercomForWalletAddress = async (address?: string) => {
    try {
        if (!!address) {
            await Intercom.logout()
            await Intercom.loginUserWithUserAttributes({ userId: address });
            await Intercom.presentSpace(Space.home)
        } else {
            await Intercom.logout()
            await Intercom.loginUnidentifiedUser();
            await Intercom.presentSpace(Space.home)
        }
    } catch (err) {
        console.log('ERROR SHOWING INTERCOM', err);
    }
}