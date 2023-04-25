import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, KeyboardAvoidingView, Alert, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { useEngine } from '../../engine/Engine';
import { warn } from '../../utils/log';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { StatusBar } from 'expo-status-bar';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useParams } from '../../utils/useParams';
import { ZenPayAppParams } from './ZenPayAppFragment';
import { extractZenPayQueryParams } from './utils';
import { getLocales } from 'react-native-localize';
import { fragment } from '../../fragment';
import { useAppConfig } from '../../utils/AppConfigContext';

export const ZenPayLandingFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const webRef = React.useRef<WebView>(null);
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const [hideKeyboardAccessoryView, setHideKeyboardAccessoryView] = React.useState(true);
    const { endpoint, onEnrollType } = useParams<{ endpoint: string, onEnrollType: ZenPayAppParams }>();
    const lang = getLocales()[0].languageCode;
    const currency = engine.products.price.usePrimaryCurrency();

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
            backgroundColor: Theme.item,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    let [auth, setAuth] = React.useState(false);
    const authOpacity = useSharedValue(0);
    const animatedAuthStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.item,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(authOpacity.value, { duration: 300 }),
        };
    });

    const onEnroll = React.useCallback(async () => {
        if (auth) {
            return;
        }
        // Show loader
        authOpacity.value = 1;
        setAuth(true);

        try {
            const data = await engine.products.extensions.getAppData(endpoint);
            if (!data) {
                Alert.alert(t('auth.failed'));
                authOpacity.value = 0;
                setAuth(false);
                return;
            }

            const domain = extractDomain(endpoint);
            const res = await engine.products.zenPay.enroll(domain);
            if (!res) {
                Alert.alert(t('auth.failed'));
                authOpacity.value = 0;
                setAuth(false)
                return;
            }

            // Navigate to continue
            navigation.goBack();
            navigation.navigateZenPay(onEnrollType);

            authOpacity.value = 0;
            setAuth(false);

        } catch (error) {
            authOpacity.value = 0;
            setAuth(false);
            Alert.alert(t('auth.failed'));
            warn(error);
        }
    }, [auth]);

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
            onEnroll();
            return;
        }
        if (data.name === 'closeApp') {
            navigation.goBack();
            return;
        }
    }, [onEnroll]);

    const onNavigation = React.useCallback((url: string) => {
        const params = extractZenPayQueryParams(url);
        if (params.closeApp) {
            navigation.goBack();
            return;
        }
        setHideKeyboardAccessoryView(!params.showKeyboardAccessoryView);
        if (params.openEnrollment) {
            onEnroll();
            return;
        }
    }, [onEnroll]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.item
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ backgroundColor: Theme.item, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{
                        backgroundColor: Theme.item,
                        flexGrow: 1,
                    }}
                >
                    <WebView
                        ref={webRef}
                        source={{ uri: `${endpoint}/about?lang=${lang}&currency=${currency}` }}
                        startInLoadingState={true}
                        style={{
                            backgroundColor: Theme.item,
                            flexGrow: 1, flexBasis: 0, height: '100%',
                            alignSelf: 'stretch',
                            marginTop: Platform.OS === 'ios' ? 0 : 8,
                        }}
                        onLoadEnd={() => {
                            setLoaded(true);
                            opacity.value = 0;
                        }}
                        onLoadProgress={(event) => {
                            if (Platform.OS === 'android' && event.nativeEvent.progress === 1) {
                                // Searching for supported query
                                onNavigation(event.nativeEvent.url);
                            }
                        }}
                        onNavigationStateChange={(event: WebViewNavigation) => {
                            // Searching for supported query
                            onNavigation(event.url);
                        }}
                        contentInset={{ top: 0, bottom: 0 }}
                        autoManageStatusBarEnabled={false}
                        allowFileAccessFromFileURLs={false}
                        allowUniversalAccessFromFileURLs={false}
                        decelerationRate="normal"
                        allowsInlineMediaPlayback={true}
                        onMessage={handleWebViewMessage}
                        keyboardDisplayRequiresUserAction={false}
                        scrollEnabled={false}
                        hideKeyboardAccessoryView={hideKeyboardAccessoryView}
                    />
                </KeyboardAvoidingView>
                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        <AndroidToolbar onBack={() => navigation.goBack()} />
                    </View>
                    {Platform.OS === 'ios' && (
                        <Pressable
                            style={{ position: 'absolute', top: 22, right: 16 }}
                            onPress={() => {
                                navigation.goBack();
                            }} >
                            <Text style={{ color: '#43A4EB', fontWeight: '500', fontSize: 17 }}>
                                {t('common.close')}
                            </Text>
                        </Pressable>
                    )}
                    <ActivityIndicator size="small" color={'#43A4EB'} />
                </Animated.View>
                <Animated.View
                    style={animatedAuthStyles}
                    pointerEvents={!auth ? 'none' : 'box-none'}
                >
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        <AndroidToolbar onBack={() => navigation.goBack()} />
                    </View>
                    {Platform.OS === 'ios' && (
                        <Pressable
                            style={{ position: 'absolute', top: 22, right: 16 }}
                            onPress={() => {
                                navigation.goBack();
                            }} >
                            <Text style={{ color: '#43A4EB', fontWeight: '500', fontSize: 17 }}>
                                {t('common.close')}
                            </Text>
                        </Pressable>
                    )}
                    <ActivityIndicator size="small" color={'#43A4EB'} />
                </Animated.View>
            </View>
        </View>
    );
});