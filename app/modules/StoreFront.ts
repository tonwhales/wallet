import { NativeModules, Platform } from 'react-native';

const { StoreFront } = NativeModules;

export async function getStoreFront(): Promise<string | null> {
    return Platform.select({
        ios: await StoreFront.getStoreFront() as string | null,
        android: null,
        default: null
    });
}
