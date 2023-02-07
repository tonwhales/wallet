import * as React from 'react';
import { ActivityIndicator, Platform, View, Text, Pressable, KeyboardAvoidingView } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { useEngine } from '../../engine/Engine';
import { warn } from '../../utils/log';
import { Theme } from '../../Theme';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { HeaderBackButton } from "@react-navigation/elements";
import { zenPayUrl } from '../../engine/corp/ZenPayProduct';
import { StatusBar } from 'expo-status-bar';

export const ZenPayLandingFragment = React.memo(() => {
    const webRef = React.useRef<WebView>(null);
    const navigation = useTypedNavigation();
    const pageTitle = t('products.zenPay.title');

    //
    // View
    //
    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = React.useState(false);
    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.background,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    //
    // Navigation
    //
    const handleWebViewMessage = React.useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            if (typeof parsed.id !== 'number') {
                warn('Invalid operation id');
                return;
            }
            id = parsed.id;
            data = parsed.data;
        } catch (e) {
            warn(e);
            return;
        }

        if (data.name === 'openEnrollment') {
            navigation.goBack();
            navigation.navigateZenPayEnrollment({
                endpoint: zenPayUrl, callback: () => {
                    navigation.navigateZenPay({ type: 'account' });
                }
            });
        }
        if (data.name === 'closeApp') {
            navigation.goBack();
            return;
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.item
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ backgroundColor: Theme.item, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <AndroidToolbar
                    pageTitle={pageTitle}
                    onBack={navigation.goBack}
                />
                {Platform.OS === 'ios' && (
                    <>
                        <View style={{
                            width: '100%',
                            flexDirection: 'row',
                            paddingHorizontal: 15,
                            marginVertical: 14,
                            height: 42,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    top: 0, bottom: 0, left: 15, justifyContent: 'center'
                                }}
                                entering={FadeIn}
                                exiting={FadeOut}
                            >
                                <Pressable
                                    style={({ pressed }) => {
                                        return ({
                                            opacity: pressed ? 0.3 : 1,
                                        });
                                    }}
                                    onPress={navigation.goBack}
                                >
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 17,
                                        textAlign: 'center',
                                    }}>
                                        {t('common.close')}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                textAlign: 'center',
                            }}>
                                {pageTitle}
                            </Text>
                        </View>
                    </>
                )}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{
                        backgroundColor: Theme.background,
                        flexGrow: 1,
                    }}
                >
                    <WebView
                        ref={webRef}
                        source={{ uri: zenPayUrl + '/about' }}
                        startInLoadingState={true}
                        style={{
                            backgroundColor: Theme.background,
                            flexGrow: 1, flexBasis: 0, height: '100%',
                            alignSelf: 'stretch',
                            marginTop: Platform.OS === 'ios' ? 0 : 8,
                        }}
                        onLoadEnd={() => {
                            setLoaded(true);
                            opacity.value = 0;
                        }}
                        contentInset={{ top: 0, bottom: 0 }}
                        autoManageStatusBarEnabled={false}
                        allowFileAccessFromFileURLs={false}
                        allowUniversalAccessFromFileURLs={false}
                        decelerationRate="normal"
                        allowsInlineMediaPlayback={true}
                        onMessage={handleWebViewMessage}
                        keyboardDisplayRequiresUserAction={false}
                    />
                </KeyboardAvoidingView>
                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <ActivityIndicator size="small" color={Theme.accent} />
                </Animated.View>
            </View>
        </View>
    );
});