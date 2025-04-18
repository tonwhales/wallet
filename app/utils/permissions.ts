import { Platform, Alert, Linking } from 'react-native';
import { checkMultiple, requestMultiple, PERMISSIONS, Permission } from 'react-native-permissions';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { t } from '../i18n/t';

export const openBluetoothPermissionAlert = () => {
    Alert.alert(
        Platform.OS === 'ios' ? t('hardwareWallet.errors.permissionsIos') : t('hardwareWallet.errors.permissions'), 
        undefined, 
        [
            {
                text: t('common.cancel'),
                style: 'cancel'
            },
            {
                text: t('common.openSettings'),
                onPress: () => {
                    if (Platform.OS === 'ios') {
                        Linking.openURL('app-settings:');
                    } else {
                        const pkg = Application.applicationId;
                        IntentLauncher.startActivityAsync(
                            IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                            { data: 'package:' + pkg }
                        );
                    }
                }
            }
        ]
    );
};

export const checkAndRequestPermissions = async (options: {
    permissions: Permission[],
}): Promise<boolean> => {
    const { permissions } = options;
    
    const checkResult = await checkMultiple(permissions);
    
    if (Object.values(checkResult).some(status => status !== 'granted')) {
        const requestResult = await requestMultiple(permissions);
        
        if (Object.values(requestResult).some(status => status !== 'granted')) {
            openBluetoothPermissionAlert();
            return false;
        }
    }
    
    return true;
};

export const checkAndRequestAndroidBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || Platform.Version < 23) {
        return true;
    }

    const locationPermissions = [
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    ];
    
    const locationResult = await checkAndRequestPermissions({
        permissions: locationPermissions,
    });
    
    if (!locationResult) {
        return false;
    }
    
    const bluetoothPermissions = [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
    ];
    
    return await checkAndRequestPermissions({
        permissions: bluetoothPermissions,
    });
};
