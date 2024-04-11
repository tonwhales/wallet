import { NativeModules, Platform } from 'react-native';

const { StoreFront } = NativeModules;

export function getStoreFront(): string | null {
    return Platform.select({
        ios: StoreFront.getConstants().countryCode as string | null,
        android: null,
        default: null
    });
}
