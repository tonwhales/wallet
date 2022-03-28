import * as React from 'react';
import { fragment } from '../../fragment';
import { Alert, ImageSourcePropType, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { encryptData, encryptPasscodeData, ensureKeystoreReady } from '../../storage/secureStorage';
import { DeviceEncryption } from '../../utils/getDeviceEncryption';
import { getAppState, markAddressSecured, setAppState } from '../../storage/appState';
import { storage } from '../../storage/storage';
import { mnemonicToWalletKey } from 'ton-crypto';
import { contractFromPublicKey } from '../../sync/contractFromPublicKey';
import { RoundButton } from '../../components/RoundButton';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { useReboot } from '../../utils/RebootContext';
import { t } from '../../i18n/t';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import * as LocalAuthentication from 'expo-local-authentication';

export const WalletSecureFragment = fragment((props: { mnemonics: string, deviceEncryption: DeviceEncryption, import: boolean }) => {
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const navigation = useTypedNavigation();

    // Action
    const [loading, setLoading] = React.useState(false);

    const onSet = React.useCallback((bypassEncryption?: boolean) => {
        (async () => {
            setLoading(true);
            try {

                // Ensure keystore is ok
                ensureKeystoreReady();

                // Persist key
                if (props.deviceEncryption === 'none' || bypassEncryption) {
                    storage.set('ton-bypass-encryption', true);
                } else {
                    storage.set('ton-bypass-encryption', false);
                }
                const token = await encryptPasscodeData(Buffer.from(props.mnemonics));

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey);

                // Persist state
                const state = getAppState();
                setAppState({
                    addresses: [
                        ...state.addresses,
                        {
                            address: contract.address,
                            publicKey: key.publicKey,
                            secretKeyEnc: token
                        }
                    ],
                    selected: state.addresses.length
                });

                // Persist secured flag
                if (props.import) {
                    markAddressSecured(contract.address);
                }

                // Navigate next
                reboot();
            } catch (e) {
                console.warn(e);
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);


    const setPasscode = React.useCallback(
        () => {
            navigation.navigate('SetPasscode', {
                onSuccess: () => {
                    const hasBiometry = props.deviceEncryption !== 'none'
                        && !!props.deviceEncryption
                            .types
                            .find(
                                (t) =>
                                    (t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
                                    || (t === LocalAuthentication.AuthenticationType.FINGERPRINT)
                            );
                    if (hasBiometry) {
                        navigation.navigate('SetBiometry', {
                            onSuccess: onSet,
                            onCancel: () => {
                                navigation.goBack();
                            },
                        });
                    } else {
                        onSet()
                    }
                },
                onCancel: () => {
                    navigation.goBack();
                },
            });
        },
        [],
    );

    const button = {
        title: t('secure.protectPasscode'),
        onPress: setPasscode,
        icon: <Ionicons name="keypad" size={20} color="white" />
    };

    let title = t('secure.title');
    let text = t('secure.subtitle');

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: 'white',
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
                <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                    <RoundButton
                        // disabled={disabled}
                        onPress={button.onPress}
                        title={button.title}
                        loading={loading}
                        // iconImage={button.iconImage}
                        icon={button.icon}
                    />
                    {/* {disabled && (
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
                    )} */}
                </View>
            </View>
        </View>
    );
});