import { memo, useEffect, useRef, useState } from "react";
import { View, Text, Platform, Image } from "react-native";
import { t } from "../../i18n/t";
import { useTheme } from '../../engine/hooks';
import * as Network from 'expo-network';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LoadingIndicator } from "../LoadingIndicator";
import { RoundButton } from "../RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openWithInApp } from "../../utils/openWithInApp";
import { ScreenHeader } from "../ScreenHeader";
import { Typography } from "../styles";

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
    const theme = useTheme();
    const [networkState, setNetworkState] = useState<Network.NetworkState | undefined>();
    const safeArea = useSafeAreaInsets();

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

    return (
        <View style={{
            flexGrow: 1,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16
        }}>
            <ScreenHeader
                onClosePressed={navigation.goBack}
            />
            {!!networkState ? (
                <View style={{
                    width: '100%',
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: 46, paddingBottom: safeArea.bottom,
                }}>
                    {networkState.isInternetReachable ? (
                        <LottieView
                            ref={animRef}
                            source={require('@assets/animations/melted.json')}
                            style={{ width: 172, height: 172 }}
                            autoPlay={true}
                        />
                    ) : (
                        <Image
                            style={{ height: 68, width: 68, marginBottom: 32 }}
                            source={require('@assets/ic-no-internet.png')}
                        />
                    )}
                    <Text style={[{ color: theme.textPrimary, textAlign: 'center' }, Typography.semiBold32_38]}>
                        {networkState.isInternetReachable ?
                            t('common.errorOccurred', { error: errorDesc, code: errorCode }) :
                            t('common.checkInternetConnection')
                        }
                    </Text>
                    <Text style={[{
                        color: theme.textSecondary,
                        textAlign: 'center', marginTop: 12,
                        marginBottom: 20
                    }, Typography.regular17_24]}>
                        {!networkState.isInternetReachable
                            ? t('webView.checkInternetAndReload')
                            : t('webView.contactSupportOrTryToReload')
                        }
                    </Text>
                    <View>
                        {networkState.isInternetReachable && (
                            <RoundButton
                                style={{ marginBottom: 16 }}
                                display={'secondary'}
                                onPress={() => {
                                    openWithInApp('https://t.me/WhalesSupportBot');
                                }}
                                title={t('webView.contactSupport')}
                            />
                        )}
                        <RoundButton
                            display={'default'}
                            onPress={onReload}
                            title={t('common.reload')}
                        />
                    </View>
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
        </View>
    );
})