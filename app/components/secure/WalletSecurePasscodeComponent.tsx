import * as React from 'react';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppState, getBackup, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { mnemonicToWalletKey } from '@ton/crypto';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { useReboot } from '../../utils/RebootContext';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { deriveUtilityKey } from '../../storage/utilityKeys';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { PasscodeSetup } from '../passcode/PasscodeSetup';
import Animated, { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated';
import { WalletSecureComponent } from './WalletSecureComponent';
import { DeviceEncryption, getDeviceEncryption } from '../../storage/getDeviceEncryption';
import { LoadingIndicator } from '../LoadingIndicator';
import { storage } from '../../storage/storage';
import { PasscodeState, encryptData, generateNewKeyAndEncryptWithPasscode, passcodeStateKey } from '../../storage/secureStorage';
import { useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { useSetAppState } from '../../engine/hooks';
import { useCallback, useState } from 'react';

export const WalletSecurePasscodeComponent = systemFragment((props: {
    mnemonics: string,
    import: boolean
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const setAppState = useSetAppState();

    const [state, setState] = useState<{ passcode: string, deviceEncryption: DeviceEncryption }>();
    const [loading, setLoading] = useState(false);

    const onAfterImport = useCallback(() => {
        const address = getBackup();
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address, isTestnet);
        navigation.navigateAndReplaceAll('Home');
    }, []);

    const onConfirmed = useCallback(async (passcode: string) => {
        setLoading(true);
        try {

            // Encrypted token
            let secretKeyEnc: Buffer;

            // Resolve key
            const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

            // Resolve utility key
            const utilityKey = await deriveUtilityKey(props.mnemonics.split(' '));

            // Resolve contract
            const contract = await contractFromPublicKey(key.publicKey);

            const passcodeState = storage.getString(passcodeStateKey);
            const isPasscodeSet = (passcodeState === PasscodeState.Set);

            if (isPasscodeSet) {
                // Use prev app key
                try {
                    secretKeyEnc = await encryptData(Buffer.from(props.mnemonics), passcode);
                } catch (e) {
                    warn('Failed to encrypt with passcode');
                    return;
                }
            } else {
                // Generate New Key
                try {
                    secretKeyEnc = await generateNewKeyAndEncryptWithPasscode(Buffer.from(props.mnemonics), passcode);
                } catch {
                    // Ignore
                    warn('Failed to generate new key');
                    return;
                }
            }

            // Persist state
            const state = getAppState();
            setAppState({
                addresses: [
                    ...state.addresses,
                    {
                        address: contract.address,
                        publicKey: key.publicKey,
                        secretKeyEnc, // With passcode
                        utilityKey,
                        addressString: contract.address.toString({ testOnly: isTestnet })
                    }
                ],
                selected: state.addresses.length
            }, isTestnet);

            const deviceEncryption = await getDeviceEncryption();

            let disableEncryption =
                (deviceEncryption === 'none')
                || (deviceEncryption === 'device-biometrics')
                || (deviceEncryption === 'device-passcode')
                || (Platform.OS === 'android' && Platform.Version < 30);

            // Skip biometrics setup if encryption is disabled
            if (disableEncryption) {
                if (props.import) {
                    let state = getAppState();
                    if (!state) {
                        throw Error('Invalid state');
                    }
                    const account = getCurrentAddress();
                    markAddressSecured(account.address, isTestnet);
                    reboot();
                }
                navigation.navigate('WalletBackupInit');
            }

            setState({ passcode, deviceEncryption });
        } catch {
            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <>
            {!state && (
                <Animated.View
                    style={{
                        flex: 1,
                        paddingTop: (Platform.OS === 'android')
                            ? safeArea.top
                            : undefined,
                    }}
                    exiting={FadeOutDown}
                >
                    <StatusBar style={'dark'} />
                    <PasscodeSetup style={props.import ? { backgroundColor: theme.item } : undefined} onReady={onConfirmed} />
                </Animated.View>
            )}

            {state && (
                <Animated.View
                    style={{ alignItems: 'stretch', justifyContent: 'center', flexGrow: 1 }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecureComponent
                        deviceEncryption={state.deviceEncryption}
                        passcode={state.passcode}
                        callback={(res: boolean) => {
                            if (res) {
                                if (props.import) {
                                    onAfterImport();
                                } else {
                                    navigation.navigate('WalletCreated')
                                }
                            }
                        }}
                        onLater={() => {
                            if (props.import) {
                                onAfterImport();
                            } else {
                                navigation.navigate('WalletCreated')
                            }
                        }}
                    />
                </Animated.View>
            )}

            {loading && (
                <Animated.View
                    style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                        justifyContent: 'center', alignItems: 'center',
                    }}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    <LoadingIndicator simple />
                </Animated.View>
            )}
        </>
    );
});