import * as React from 'react';
import { Alert, ImageSourcePropType, Platform, Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { encryptData, generateNewKeyAndEncrypt } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../storage/getDeviceEncryption';
import { getAppState, markAddressSecured, setAppState } from '../../storage/appState';
import { mnemonicToWalletKey } from 'ton-crypto';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { RoundButton } from '../../components/RoundButton';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { useReboot } from '../../utils/RebootContext';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { deriveUtilityKey } from '../../storage/utilityKeys';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useAppStateManager } from '../../engine/AppStateManager';

export const WalletSecureFragment = systemFragment((props: {
    mnemonics: string,
    deviceEncryption: DeviceEncryption,
    import: boolean,
    additionalWallet?: boolean,
}) => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();

    // Action
    const [loading, setLoading] = React.useState(false);
    const onClick = React.useCallback((bypassEncryption?: boolean) => {
        (async () => {
            setLoading(true);
            try {

                // Encrypted token
                let secretKeyEnc: Buffer;

                // Generate New Key
                try {
                    let disableEncryption = !!(props.deviceEncryption === 'none' || props.deviceEncryption === 'device-biometrics' || props.deviceEncryption === 'device-passcode' || bypassEncryption);
                    if (Platform.OS === 'android' && Platform.Version < 30) {
                        disableEncryption = true; // Encryption doesn't work well on older androids
                    }
                    if (props.additionalWallet) {
                        secretKeyEnc = await encryptData(Buffer.from(props.mnemonics));
                    } else {
                        secretKeyEnc = await generateNewKeyAndEncrypt(disableEncryption, Buffer.from(props.mnemonics));
                    }
                } catch (e) {
                    // Ignore
                    console.warn(e);
                    return;
                }

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve utility key
                const utilityKey = await deriveUtilityKey(props.mnemonics.split(' '));

                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey);

                // Persist state
                const state = getAppState();
                const isNew = state.addresses.findIndex((a) => a.address.equals(contract.address)) === -1;

                if (!isNew) {
                    Alert.alert(t('wallets.alreadyExistsAlertTitle'), t('wallets.alreadyExistsAlertMessage'));
                    return;
                }
                
                const newAddressesState = [
                    ...state.addresses,
                    {
                        address: contract.address,
                        publicKey: key.publicKey,
                        secretKeyEnc,
                        utilityKey,
                    }
                ];

                // Persist secured flag
                if (props.import || props.additionalWallet) {
                    markAddressSecured(contract.address, AppConfig.isTestnet);
                }

                appStateManager.updateAppState({
                    addresses: newAddressesState,
                    selected: newAddressesState.length - 1
                });

            } catch (e) {
                warn(e);
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    let iconImage: ImageSourcePropType | undefined;
    let icon: any | undefined;
    let buttonText = '';
    let title = t('secure.title');
    let text = t('secure.subtitle');

    switch (props.deviceEncryption) {
        case 'face':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_face_id.png')
                : require('../../../assets/ic_and_touch.png');
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectFaceID')
                : t('secure.protectBiometrics');
            break;
        case 'biometric':
        case 'fingerprint':
            iconImage = Platform.OS === 'ios'
                ? require('../../../assets/ic_touch_id.png')
                : require('../../../assets/ic_and_touch.png');
            buttonText = Platform.OS === 'ios'
                ? t('secure.protectTouchID')
                : t('secure.protectBiometrics');
            break;
        case 'passcode':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
        case 'device-biometrics':
            buttonText = t('secure.protectBiometrics');
            break;
        case 'device-passcode':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
        case 'secret':
            icon = <Ionicons
                name="keypad"
                size={20}
                color="white"
            />;
            buttonText = t('secure.protectPasscode');
            break;
        case 'none':
            icon = <Ionicons
                name="lock-open-outline"
                size={20}
                color="white"
            />;
            buttonText = t('common.continueAnyway');
            title = t('secure.titleUnprotected');
            text = t('secure.subtitleUnprotected');
            break;

        default:
            break;
    }

    const disabled = props.deviceEncryption === 'none';
    if (disabled) {
        text = t('secure.subtitleNoBiometrics');
        buttonText = t('secure.titleUnprotected');
        icon = undefined;
    }

    const continueAnywayAlert = React.useCallback(() => {
        Alert.alert(
            t('secure.titleUnprotected'),
            t('secure.messageNoBiometrics'),
            [
                { text: t('common.cancel') },
                {
                    text: t('common.continueAnyway'), onPress: () => {
                        onClick(true);
                    }
                }
            ])
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: Theme.item,
            justifyContent: 'center',
            alignContent: 'center'
        }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                <View style={{ flexGrow: 1 }} />
                <FragmentMediaContent
                    animation={require('../../../assets/animations/lock.json')}
                    title={title}
                    text={text}
                />
                <View style={{ flexGrow: 1 }} />
                <View style={{ height: disabled ? 128 : 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                    <RoundButton
                        disabled={disabled}
                        onPress={onClick}
                        title={buttonText}
                        loading={loading}
                        iconImage={iconImage}
                        icon={icon}
                    />
                    {disabled && (
                        <Pressable
                            onPress={continueAnywayAlert}
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1,
                                    alignSelf: 'center',
                                    marginTop: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }
                            }}
                        >
                            <Text style={{
                                fontSize: 17,
                                fontWeight: '600',
                                color: Theme.accentText
                            }}>
                                {t('common.continueAnyway')}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
});