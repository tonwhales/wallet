import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';
import { Address } from 'ton';
import { AppConfig } from '../AppConfig';

export const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return null;
        }
        return (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        return null;
    }
};

export async function registerPushToken(token: string, address: Address) {
    await axios.post('https://connect.tonhubapi.com/push/register', { token, addresses: [address.toFriendly({ testOnly: AppConfig.isTestnet })] }, { method: 'POST' });
}