import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../storage/storage';
import { BiometricsState, biometricsReenablePendingKey, encryptAndStoreAppKeyWithBiometrics, getBiometricsState } from '../storage/secureStorage';
import { t } from '../i18n/t';
import { warn } from './log';

export function markBiometricsReenablePending() {
    storage.set(biometricsReenablePendingKey, true);
}

export async function offerBiometricsReenable(
    passcode: string,
    setBiometricsState: (state: BiometricsState) => void
) {
    try {
        if (!storage.getBoolean(biometricsReenablePendingKey)) {
            return;
        }
        if (getBiometricsState() === BiometricsState.InUse) {
            storage.delete(biometricsReenablePendingKey);
            return;
        }
        const level = await LocalAuthentication.getEnrolledLevelAsync();
        if (level !== LocalAuthentication.SecurityLevel.BIOMETRIC) {
            return;
        }
        storage.delete(biometricsReenablePendingKey);
        Alert.alert(
            t('security.auth.biometricsReenable.title'),
            t('security.auth.biometricsReenable.message'),
            [
                { text: t('security.auth.biometricsReenable.notNow'), style: 'cancel' },
                {
                    text: t('security.auth.biometricsReenable.enable'),
                    onPress: async () => {
                        try {
                            await encryptAndStoreAppKeyWithBiometrics(passcode);
                            setBiometricsState(BiometricsState.InUse);
                        } catch (e) {
                            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
                        }
                    }
                }
            ]
        );
    } catch (e) {
        warn('Failed to offer biometrics re-enable');
    }
}
