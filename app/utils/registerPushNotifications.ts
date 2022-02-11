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
        return (await Notifications.getExpoPushTokenAsync({ experienceId: '@ex3ndr/wallet' })).data;
    } else {
        return null;
    }
};

export async function registerPushToken(token: string, addresses: Address[]) {
    await axios.post('https://connect.tonhubapi.com/push/register', { token, addresses: addresses.map((v) => v.toFriendly({ testOnly: AppConfig.isTestnet })) }, { method: 'POST' });
}