import * as React from 'react';
import { Platform, Text, View, ScrollView, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useCallback, useEffect, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { StatusBar } from 'expo-status-bar';
import { Buffer } from 'buffer';

export const EthereumSeedFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const selectedAccount = useSelectedAccount();
    const authContext = useKeysAuth();
    const toaster = useToaster();

    const hasEthereumWallet = !!selectedAccount?.ethereumSecretKeyEnc;

    useEffect(() => {
        if (!hasEthereumWallet) {
            Alert.alert(t('common.error'), 'Ethereum wallet not created');
            navigation.goBack();
            return;
        }

        let subscription: ScreenCapture.Subscription;
        subscription = ScreenCapture.addScreenshotListener(() => {
            navigation.navigateScreenCapture();
        });

        (async () => {
            try {
                let keys = await authContext.authenticate({
                    backgroundColor: theme.surfaceOnBg,
                    cancelable: true,
                    containerStyle: { paddingBottom: safeArea.bottom + 56 },
                });

                if (keys.ethKeyPair) {
                    const pkHex = '0x' + Buffer.from(keys.ethKeyPair.privateKey).toString('hex');
                    setPrivateKey(pkHex);
                    setAddress(keys.ethKeyPair.address);
                } else {
                    Alert.alert(t('common.error'), 'Ethereum wallet not found');
                    navigation.goBack();
                }
            } catch {
                navigation.goBack();
                return;
            }
        })();

        return () => {
            subscription?.remove();
        };
    }, [hasEthereumWallet]);

    const onCopy = useCallback(() => {
        if (!privateKey) return;

        try {
            Clipboard.setString(privateKey);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show(
                {
                    message: t('common.copied'),
                    type: 'default',
                    duration: ToastDuration.SHORT,
                    marginBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 56 + 64 : safeArea.bottom + 64) : 16
                }
            );
        } catch {
            warn('Failed to copy private key');
            Alert.alert(t('common.error'), t('errors.unknown'));
        }
    }, [privateKey, safeArea.bottom, toaster]);

    if (!privateKey) {
        return null;
    }

    return (
        <Animated.View
            style={[{
                alignItems: 'center', justifyContent: 'center',
                flexGrow: 1,
                backgroundColor: theme.backgroundPrimary,
                paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 56 + 32 : safeArea.bottom + 32) : 0,
            }, Platform.select({ android: { paddingTop: safeArea.top } })]}
            exiting={FadeIn}
            key={"content"}
        >
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: theme.style === 'dark' ? 'light' : 'dark',
            })} />
            <ScreenHeader
                title={'Ethereum Private Key'}
                onBackPressed={navigation.goBack}
                style={{
                    paddingHorizontal: 16,
                    ...Platform.select({ android: { paddingTop: 0 } })
                }}
            />
            <ScrollView
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
                style={{ flexGrow: 1, width: '100%', paddingHorizontal: 16 }}
            >
                <Text style={{
                    fontSize: 32, lineHeight: 38,
                    fontWeight: '600',
                    textAlign: 'center',
                    color: theme.textPrimary,
                    marginBottom: 12, marginTop: 16
                }}>
                    {'Private Key'}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    fontSize: 17, lineHeight: 24,
                    fontWeight: '400',
                    flexShrink: 1,
                    color: theme.textSecondary,
                    marginBottom: 16
                }}>
                    {'Use this private key to import your wallet into MetaMask or other Ethereum wallets.'}
                </Text>

                {address && (
                    <View style={{
                        backgroundColor: theme.surfaceOnElevation,
                        borderRadius: 14,
                        padding: 16,
                        marginBottom: 16
                    }}>
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '500',
                            color: theme.textSecondary,
                            marginBottom: 4
                        }}>
                            {'Address'}
                        </Text>
                        <Text style={{
                            fontSize: 15,
                            fontWeight: '500',
                            color: theme.textPrimary,
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
                        }}>
                            {address}
                        </Text>
                    </View>
                )}

                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 14,
                    padding: 16,
                }}>
                    <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: theme.textSecondary,
                        marginBottom: 8
                    }}>
                        {'Private Key'}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: theme.textPrimary,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        lineHeight: 20
                    }}
                        selectable={true}
                    >
                        {privateKey}
                    </Text>
                </View>

                <Text style={{
                    textAlign: 'center',
                    fontSize: 15, lineHeight: 20,
                    fontWeight: '400',
                    flexShrink: 1,
                    color: theme.accentRed,
                    marginTop: 16
                }}>
                    {'⚠️ Never share your private key with anyone. Anyone with this key can access your funds.'}
                </Text>

                {(network.isTestnet || __DEV__) && (
                    <RoundButton
                        display={'text'}
                        title={t('create.copy')}
                        style={{ marginTop: 20 }}
                        onPress={onCopy}
                    />
                )}
            </ScrollView>
            <View style={{
                paddingVertical: 16,
                paddingHorizontal: 16,
                width: '100%',
            }}>
                <RoundButton title={t('common.done')} onPress={navigation.goBack} />
            </View>
        </Animated.View>
    );
});

