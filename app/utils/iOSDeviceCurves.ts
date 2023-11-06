import { Platform } from "react-native";

export const iOSDeviceCurves = {
    X_XS_XSMax_PRO11_PROMAX11: 39.0,
    XR_11: 41.5,
    MINI12_MINI13: 44.0,
    PRO12_12_PRO13_14: 47.33,
    PROMAX12_PROMAX13_14PLUS: 53.33,
    PRO14_PROMAX14: 55.0,
}

export function getDeviceScreenCurve(deviceName: string) {
    if (Platform.OS !== 'ios') return 0;
    switch (deviceName) {
        case 'iPhone10,3':
        case 'iPhone11,2':
        case 'iPhone11,4':
        case 'iPhone11,6':
        case 'iPhone12,3':
        case 'iPhone12,5':
            return iOSDeviceCurves.X_XS_XSMax_PRO11_PROMAX11;
        case 'iPhone11,8':
        case 'iPhone12,1':
            return iOSDeviceCurves.XR_11;
        case 'iPhone13,1':
        case 'iPhone14,4':
            return iOSDeviceCurves.MINI12_MINI13;
        case 'iPhone13,2':
        case 'iPhone13,3':
        case 'iPhone14,2':
        case 'iPhone14,7':
            return iOSDeviceCurves.PRO12_12_PRO13_14;
        case 'iPhone13,4':
        case 'iPhone14,3':
        case 'iPhone14,8':
            return iOSDeviceCurves.PROMAX12_PROMAX13_14PLUS;
        case 'iPhone15,2':
        case 'iPhone15,3':
            return iOSDeviceCurves.PRO14_PROMAX14;
        default:
            return 0;
    }

}