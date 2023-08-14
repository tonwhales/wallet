import { memo, useEffect, useRef, useState } from "react";
import { View, Text, Platform, Pressable } from "react-native";
import { t } from "../../../i18n/t";
import { useAppConfig } from "../../../utils/AppConfigContext";
import * as Network from 'expo-network';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { RoundButton } from "../../../components/RoundButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openWithInApp } from "../../../utils/openWithInApp";

export const WebViewErrorComponent = memo(({
    errorDomain,
    errorCode,
    errorDesc,
    onReload
}: {
    errorDomain?: string,
    errorCode: number,
    errorDesc: string,
    onReload: () => void
}) => {
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const [networkState, setNetworkState] = useState<Network.NetworkState | undefined>();

    const animRef = useRef<LottieView>(null);

    useEffect(() => {
        (async () => {
            const netState = await Network.getNetworkStateAsync();
            setNetworkState(netState);
        })();
        if (Platform.OS === 'ios') {
            setTimeout(() => animRef.current?.play(), 300);
        }
    }, []);

    console.log('networkState', networkState);

    return (
        <View style={{
            flexGrow: 1,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16
        }}>
            {!!networkState ? (
                <View style={{
                    width: '100%',
                    flexGrow: 1,
                    alignItems: 'center',
                    paddingTop: 46, paddingBottom: safeArea.bottom,
                }}>
                    <Text style={{
                        fontSize: 28, lineHeight: 32,
                        color: Theme.textColor,
                        fontWeight: '500',
                        marginBottom: 16,
                        textAlign: 'center', marginHorizontal: 16
                    }}>
                        {!networkState.isInternetReachable ?
                            t('webView.noInternet') :
                            t('common.somethingWentWrong')
                        }
                    </Text>
                    {networkState.isInternetReachable && (
                        <Text style={{
                            color: Theme.textSecondary,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '400',
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            {t('common.errorOccurred', { error: errorDesc, code: errorCode })}
                        </Text>
                    )}
                    <Text style={{
                        color: Theme.textSecondary,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400',
                        marginBottom: 32,
                        textAlign: 'center'
                    }}>
                        {!networkState.isInternetReachable
                            ? t('webView.checkInternetAndReload')
                            : t('webView.contactSupportOrTryToReload')
                        }
                    </Text>
                    <LottieView
                        ref={animRef}
                        source={require('../../../../assets/animations/flag.json')}
                        style={{ width: 280, height: 280 }}
                        autoPlay={true}
                    />
                    <View style={{ flexGrow: 1 }} />
                    <RoundButton
                        style={{ width: '100%' }}
                        display={'default'}
                        onPress={onReload}
                        title={t('common.reload')}
                    />
                    {networkState.isInternetReachable && (
                        <RoundButton
                            style={{ width: '100%' }}
                            display={'text'}
                            onPress={() => {
                                openWithInApp('https://t.me/WhalesSupportBot');
                            }}
                            title={t('webView.contactSupport')}
                        />
                    )
                    }
                </View>
            )
                : (
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
                )
            }
            {Platform.OS === 'ios' && (
                <Pressable
                    style={{ position: 'absolute', top: 22, right: 16 }}
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Text style={{ color: Theme.accent, fontWeight: '500', fontSize: 17 }}>
                        {t('common.close')}
                    </Text>
                </Pressable>
            )}
        </View>
    );
})