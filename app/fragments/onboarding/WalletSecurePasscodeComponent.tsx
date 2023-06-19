import * as React from 'react';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { encryptAndStoreWithPasscode } from '../../storage/secureStorage';
import { getAppState, getBackup, markAddressSecured, setAppState } from '../../storage/appState';
import { mnemonicToWalletKey } from 'ton-crypto';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { useReboot } from '../../utils/RebootContext';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { deriveUtilityKey } from '../../storage/utilityKeys';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { PasscodeSetup } from '../../components/passcode/PasscodeSetup';
import Animated, { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated';
import { WalletSecureComponent } from '../../components/secure/WalletSecureComponent';
import { DeviceEncryption, getDeviceEncryption } from '../../storage/getDeviceEncryption';
import { LoadingIndicator } from '../../components/LoadingIndicator';

export const WalletSecurePasscodeComponent = systemFragment((props: {
    mnemonics: string,
    import: boolean
}) => {
    const { AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();

    const [deviceEncryption, setDeviceEncryption] = React.useState<DeviceEncryption>();
    const [loading, setLoading] = React.useState(false);

    const onAfterImport = React.useCallback(() => {
        const address = getBackup();
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address, AppConfig.isTestnet);
        reboot();
    }, []);

    const onConfirmed = React.useCallback(async (passcode: string) => {
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

            // Generate New Key
            try {
                secretKeyEnc = await encryptAndStoreWithPasscode(
                    contract.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    passcode,
                    Buffer.from(props.mnemonics)
                );
            } catch (e) {
                // Ignore
                warn('Failed to generate new key');
                return;
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
                    }
                ],
                selected: state.addresses.length
            }, AppConfig.isTestnet);

            const deviceEncryption = await getDeviceEncryption();
            setDeviceEncryption(deviceEncryption);
        } catch (e) {
            warn(e);
            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <>
            {!deviceEncryption && (
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
                    <PasscodeSetup onReady={onConfirmed} />
                </Animated.View>
            )}

            {deviceEncryption && (
                <Animated.View
                    style={{ alignItems: 'stretch', justifyContent: 'center', flexGrow: 1 }}
                    key="content"
                    entering={FadeIn}
                >
                    <WalletSecureComponent
                        mnemonics={props.mnemonics}
                        deviceEncryption={deviceEncryption}
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