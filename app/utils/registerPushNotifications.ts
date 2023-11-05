import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';
import { Address } from '@ton/core';
import { getAppInstanceKeyPair } from '../storage/appState';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
        if (Platform.OS === 'android') {
            await Notifications.getNotificationChannelsAsync();
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.DEFAULT,
            });
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            const res = await Notifications.requestPermissionsAsync();
        }
        if (finalStatus !== 'granted') {
            return null;
        }
        return (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        return null;
    }
};

export async function registerPushToken(token: string, addresses: Address[], isTestnet: boolean) {
    await axios.post('https://connect.tonhubapi.com/push/register', {
        token,
        appPublicKey: (await getAppInstanceKeyPair()).publicKey.toString('base64'),
        addresses: addresses.map((v) => v.toString({ testOnly: isTestnet }))
    }, { method: 'POST' });
}